#pragma once
#include <Arduino.h>
#include "AppConfig.h"

bool isValidConfig(const Config& config);
bool fetchFeedConfig(const String& url, const String& token, Config& result);
