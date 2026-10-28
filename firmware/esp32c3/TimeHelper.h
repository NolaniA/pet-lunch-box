#pragma once

#include <Arduino.h>
#include <time.h>

void setupDeviceTime();
bool getDeviceTime(struct tm& timeinfo);
