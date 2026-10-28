#pragma once
#include <Arduino.h>
#include "AppConfig.h"

bool loadStoredConfig(String& ssid, String& pass, String& apiUrl, String& token);
bool saveStoredConfig(const String& ssid, const String& pass, const String& apiUrl, const String& token);
void clearStoredConfig();
bool loadFeedSchedule(Config& config);
void saveFeedSchedule(const Config& config);
int64_t loadLastFeedMinute();
bool saveLastFeedMinute(int64_t minute);
