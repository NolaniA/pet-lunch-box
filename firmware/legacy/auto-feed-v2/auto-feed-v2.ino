#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "time.h"
#include <ESP32Servo.h>

Servo myservo;

// ---- Wi-Fi ----
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// ---- Time ----
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 7 * 3600;     // GMT+7
const int   daylightOffset_sec = 0;

// ---- config URL
const char* CONFIG_URL = "https://nolania.github.io/esp32c3-auto-feed/config-auto-feed/config-time.json";

// ---- Feed Struct ----
struct FeedTime {
  int hour;
  int minute;
  int duration_sec;
};

struct Config {
  FeedTime feed_time1;
  FeedTime feed_time2;
  FeedTime feed_time3;
};

Config cfg;

// ---- Timing ----
unsigned long last_api_time = 0;
const unsigned long api_interval = 5 * 60 * 1000; // 5 นาที

unsigned long last_second_check = 0; // สำหรับตรวจ feed ทุกวินาที
bool just_fed = false;

// ---- Servo ----
const int SERVO_PIN = 9;

// ---- Sleep ----
const int SLEEP_TIME = 21; // 21:00
const int WAKE_UP    = 5;  // 05:00

//--------------------------------------------
// HTTP GET CONFIG
//--------------------------------------------
String http_get(String url) {
  if (WiFi.status() != WL_CONNECTED) return "";

  HTTPClient http;
  http.begin(url);
  int code = http.GET();
  if (code == 200) return http.getString();
  return "";
}

Config http_get_config(String url) {
  Config cfg;
  String json = http_get(url);

  StaticJsonDocument<512> doc;
  deserializeJson(doc, json);

  cfg.feed_time1 = {
    doc["feed_time1"]["hour"],
    doc["feed_time1"]["minute"],
    doc["feed_time1"]["duration_sec"]
  };

  cfg.feed_time2 = {
    doc["feed_time2"]["hour"],
    doc["feed_time2"]["minute"],
    doc["feed_time2"]["duration_sec"]
  };

  cfg.feed_time3 = {
    doc["feed_time3"]["hour"],
    doc["feed_time3"]["minute"],
    doc["feed_time3"]["duration_sec"]
  };

  return cfg;
}

//--------------------------------------------
// WIFI
//--------------------------------------------
void connectWiFi() {
  Serial.println("WiFi connecting...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  const unsigned long timeout = 15000;

  // ===== TRY 1 =====
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeout) {
    delay(300);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi OK: %s\n", WiFi.localIP().toString().c_str());
    return;
  }

  // ===== TRY 2 =====
  Serial.println("\nRetry connect wifi (backup SSID)...");
  WiFi.disconnect(true);
  delay(500);

  WiFi.begin("sleepyolo_2.4G", WIFI_PASS);

  start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeout) {
    delay(300);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi OK: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nWiFi FAIL");
  }
}


//--------------------------------------------
// GET TIME
//--------------------------------------------
bool getTimeInfo(struct tm &timeinfo) {
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to get time");
    return false;
  }
  return true;
}

//--------------------------------------------
// FEED FUNCTION
//--------------------------------------------
void doFeed(int duration_sec) {
  Serial.printf("FEED START %d sec\n", duration_sec);

  myservo.writeMicroseconds(5000);
  delay(duration_sec * 1000);
  myservo.writeMicroseconds(1500);

  Serial.println("FEED DONE");
}

//--------------------------------------------
// SETUP
//--------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(200);

  Serial.println("Start ESP32-C3 auto feed!");

  connectWiFi();

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  myservo.attach(SERVO_PIN);

  last_api_time = millis() - api_interval; // ดึง config ครั้งแรกทันที
}

//--------------------------------------------
// LOOP
//--------------------------------------------
void loop() {

  unsigned long now = millis();

  // === ดึง Config ทุก 5 นาที ===
  if (now - last_api_time >= api_interval) {
    last_api_time = now;
    cfg = http_get_config(CONFIG_URL);
    Serial.println("CONFIG UPDATED");
  }

  // === ตรวจเวลา feed ทุก 1 วินาที ===
  if (now - last_second_check >= 1000) {
    last_second_check = now;

    struct tm timeinfo;
    if (!getTimeInfo(timeinfo)) return;

    Serial.println(&timeinfo);

    int H = timeinfo.tm_hour;
    int M = timeinfo.tm_min;
    int total_min = H * 60 + M;

    int duration = 0;

    if (cfg.feed_time1.hour * 60 + cfg.feed_time1.minute == total_min)
      duration = cfg.feed_time1.duration_sec;

    if (cfg.feed_time2.hour * 60 + cfg.feed_time2.minute == total_min)
      duration = cfg.feed_time2.duration_sec;

    if (cfg.feed_time3.hour * 60 + cfg.feed_time3.minute == total_min)
      duration = cfg.feed_time3.duration_sec;

    // ถ้าเจอ feed time
    if (duration > 0) {
      static int last_feed_min = -1;

      if (last_feed_min != total_min) {
        last_feed_min = total_min;
        just_fed = true;
        doFeed(duration);
      }
    }

    // === Sleep เฉพาะกรณีไม่ใช่หลัง feed ===
    if (!just_fed) {
      if (H >= SLEEP_TIME || H < WAKE_UP) {

        int now_min = H * 60 + M;
        int wake_min = WAKE_UP * 60;

        int minute_sleep;
        if (now_min <= wake_min)
          minute_sleep = wake_min - now_min;
        else
          minute_sleep = (24 * 60 - now_min) + wake_min;

        Serial.printf("Ready to sleep: %d minute\n", minute_sleep);
        Serial.flush();

        esp_sleep_enable_timer_wakeup((uint64_t)minute_sleep * 60 * 1000000ULL);
        esp_deep_sleep_start();
      }
    }

    just_fed = false;
  }
}
