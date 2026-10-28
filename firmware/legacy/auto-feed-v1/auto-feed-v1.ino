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

// ---- config
const char* CONFIG_URL = "https://nolania.github.io/esp32c3-auto-feed/config-auto-feed/config-time.json";

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

unsigned long last_api_time = 0;
const unsigned long api_interval = 5 * 60 * 1000;   // 5 นาที
const int   SERVO_PIN = 9;

const int   SLEEP_TIME = 21;    //9pm
const int   WAKE_UP = 5;    // 5am




//----------------------------------
// function
//----------------------------------


String http_get(String url){
  // check wifi connect
  if(WiFi.status() != WL_CONNECTED){
    Serial.println("wifi not connect");
    return  "" ;
  }

  // define HTTPClient as http
  HTTPClient http;

  http.begin(url);

  int httpget = http.GET();

  // check status code must > 0 (200)
  if(httpget < 0){
    Serial.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpget).c_str());
    return "" ;
  }

  // check api get success
  if (httpget == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println("[HTTP] get success!!");
    return  payload ;
  }


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


void connectWiFi() {
  Serial.println("WiFi connecting...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  const unsigned long timeout = 15000; // 15 วิ

  while (WiFi.status() != WL_CONNECTED && (millis() - start) < timeout) {
    delay(300);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi OK: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nretry .....");

    WiFi.begin("sleepyolo_2.4G", WIFI_PASS);

    unsigned long start = millis();

    while (WiFi.status() != WL_CONNECTED && (millis() - start) < timeout) {
      delay(300);
      Serial.print(".");
    }

    Serial.println("\nWiFi FAIL (timeout)");
  }


}


bool getTimeInfo(struct tm &timeinfo) {
  // configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return false;
  }

  return true;
}



void setup() {
  Serial.begin(115200);

  delay(300);

  // -------say hi first time -------
  Serial.println("Start ESP32-C3 auto feed");

  connectWiFi();

  last_api_time = millis() - api_interval;

  myservo.attach(SERVO_PIN);

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

}

void loop() {

  unsigned long now = millis();

  // ===== ยิง API ทุก ๆ 5 นาที =====
  if (now - last_api_time >= api_interval) {
    last_api_time = now;

    cfg = http_get_config(CONFIG_URL);

  }


  // static int last_feed_minute = -1;

  struct tm timeinfo;
  if (getTimeInfo(timeinfo)) {
    Serial.println(&timeinfo);
    int current_hour   = timeinfo.tm_hour;
    int current_minute = timeinfo.tm_min;
    int duration       = 0;

    duration = (cfg.feed_time1.hour == current_hour && cfg.feed_time1.minute == current_minute)? cfg.feed_time1.duration_sec:duration;
    duration = (cfg.feed_time2.hour == current_hour && cfg.feed_time2.minute == current_minute)? cfg.feed_time2.duration_sec:duration;
    duration = (cfg.feed_time3.hour == current_hour && cfg.feed_time3.minute == current_minute)? cfg.feed_time3.duration_sec:duration;

    if (duration > 0) {
      // if (last_feed_minute != current_minute) {
      //   last_feed_minute = current_minute;

        Serial.printf("FEED START %d sec\n", duration);
        myservo.writeMicroseconds(5000);  //start
        delay(duration * 1000);
        myservo.writeMicroseconds(1500);  //stop
        Serial.println("FEED DONE");

        getTimeInfo(timeinfo);

        delay((60 - timeinfo.tm_sec) * 1000);
      // }
    }


  }




  // test start
  // Serial.println("start");
  // myservo.writeMicroseconds(5000);
  // delay(5000);
  // myservo.writeMicroseconds(1500);
  // Serial.println("end");
  // test end

  delay(3 * 1000);   //second


  // sleep
  if (timeinfo.tm_hour >= SLEEP_TIME || timeinfo.tm_hour < WAKE_UP) {

    int now_min = timeinfo.tm_hour * 60 + timeinfo.tm_min;
    int wake_min = WAKE_UP * 60;

    int minute_sleep;

    if (now_min <= wake_min) {
      minute_sleep = wake_min - now_min;
    } else {
      minute_sleep = (24 * 60 - now_min) + wake_min;
    }

    Serial.printf("Ready to sleep : %d minute\n", minute_sleep);
    Serial.flush();
    delay(300);

    esp_sleep_enable_timer_wakeup((uint64_t)minute_sleep * 60 * 1000000ULL);
    esp_deep_sleep_start();
  }


}
