#include "TimeHelper.h"
#include "AppConfig.h"

void setupDeviceTime() { configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER); }

bool getDeviceTime(struct tm& timeinfo) {
  return getLocalTime(&timeinfo, 10) && timeinfo.tm_year >= 124;
}
