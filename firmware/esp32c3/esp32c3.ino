#include <Arduino.h>
#include <WiFi.h>
#include <time.h>
#include "AppConfig.h"
#include "ConfigClient.h"
#include "Feeder.h"
#include "SetupPortal.h"
#include "Storage.h"
#include "TimeHelper.h"
#include "WiFiHelper.h"

// Explicit declarations avoid Arduino sketch preprocessor prototypes inside the namespace.
void setup();
void loop();

namespace {
String wifiSsid, wifiPass, apiUrl, deviceToken;
String serialCommand;
Config cfg{};
unsigned long lastApiTime = 0, lastSecondCheck = 0, lastWiFiRetry = 0;
int64_t lastFeedMinute = -1;

void checkSerial() {
  while (Serial.available()) {
    const char c = static_cast<char>(Serial.read());
    if (c == '\n') {
      serialCommand.trim();
      if (serialCommand == "SETUP" && !isAPMode()) startAPMode();
      serialCommand = "";
    } else if (serialCommand.length() < 32) serialCommand += c;
  }
}

void checkFeedingTime() {
  struct tm localTime;
  if (!getDeviceTime(localTime)) return;
  const int64_t epochMinute = static_cast<int64_t>(time(nullptr)) / 60;
  // Persist before moving the servo: a reboot in this minute must not feed twice.
  // The >= guard also prevents replay if NTP moves the clock backwards.
  if (lastFeedMinute >= epochMinute) return;
  for (int i = 0; i < cfg.count; ++i) {
    const FeedTime& feed = cfg.feeds[i];
    if (feed.hour == localTime.tm_hour && feed.minute == localTime.tm_min && feed.duration_sec > 0) {
      if (!saveLastFeedMinute(epochMinute)) { Serial.println("Cannot persist feeding marker; skipping meal."); return; }
      lastFeedMinute = epochMinute;
      doFeed(feed.duration_sec);
      return;
    }
  }
}
}

void setup() {
  Serial.begin(115200);
  delay(200);
  setupFeeder(SERVO_PIN);
  lastFeedMinute = loadLastFeedMinute();
  loadFeedSchedule(cfg);
  if (!loadStoredConfig(wifiSsid, wifiPass, apiUrl, deviceToken)) { startAPMode(); return; }
  setupDeviceTime();
  if (!connectWiFiCustom(wifiSsid, wifiPass)) {
    // Temporary network failure should not discard the schedule or enter setup mode.
    Serial.println("Wi-Fi unavailable; retrying. Send SETUP over Serial to reconfigure.");
  }
  lastApiTime = millis() - API_INTERVAL_MS;
}

void loop() {
  checkSerial();
  if (isAPMode()) { handlePortalLoop(); delay(2); return; }
  unsigned long now = millis();
  // Feeding runs independently of Wi-Fi connectivity once the clock is synchronized.
  if (now - lastSecondCheck >= SECOND_CHECK_MS) {
    lastSecondCheck = now;
    checkFeedingTime();
  }
  now = millis();
  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastWiFiRetry >= WIFI_RETRY_MS) { lastWiFiRetry = now; WiFi.reconnect(); }
    delay(10);
    return;
  }
  if (now - lastApiTime >= API_INTERVAL_MS) {
    lastApiTime = now;
    Config fresh{};
    if (fetchFeedConfig(apiUrl, deviceToken, fresh)) {
      cfg = fresh;
      saveFeedSchedule(cfg);
      Serial.printf("Schedule updated: %d meals\n", cfg.count);
    }
  }
  delay(10);
}
