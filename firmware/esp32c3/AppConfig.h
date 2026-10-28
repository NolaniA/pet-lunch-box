#pragma once
#include <Arduino.h>

constexpr int MAX_FEEDS = 10;
constexpr int MAX_DURATION_SEC = 60;
struct FeedTime { int hour; int minute; int duration_sec; };
struct Config { FeedTime feeds[MAX_FEEDS]; int count; };

constexpr const char* NTP_SERVER = "pool.ntp.org";
constexpr long GMT_OFFSET_SEC = 7 * 3600;  // Asia/Bangkok
constexpr int DAYLIGHT_OFFSET_SEC = 0;
constexpr unsigned long API_INTERVAL_MS = 5UL * 60UL * 1000UL;
constexpr unsigned long SECOND_CHECK_MS = 1000UL;
constexpr unsigned long WIFI_RETRY_MS = 30000UL;
constexpr int HTTP_TIMEOUT_MS = 10000;

// Preserve the original upstream pin assignment and existing wiring.
constexpr int SERVO_PIN = 9;
constexpr int SERVO_STOP_US = 1500;
constexpr int SERVO_FEED_US = 2000;
