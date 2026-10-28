#include "Storage.h"
#include <Preferences.h>
#include <cstring>
#include "ConfigClient.h"

bool loadStoredConfig(String& ssid, String& pass, String& apiUrl, String& token) {
  Preferences prefs;
  if (!prefs.begin("config", true)) return false;
  ssid = prefs.getString("ssid", "");
  pass = prefs.getString("pass", "");
  apiUrl = prefs.getString("api", "");
  token = prefs.getString("token", "");
  prefs.end();
  return ssid.length() > 0 && apiUrl.startsWith("https://");
}

bool saveStoredConfig(const String& ssid, const String& pass, const String& apiUrl, const String& token) {
  Preferences prefs;
  if (!prefs.begin("config", false)) return false;
  const bool changed = prefs.getString("api", "") != apiUrl || prefs.getString("token", "") != token;
  if (changed) prefs.remove("schedule-v1");
  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);
  prefs.putString("api", apiUrl);
  prefs.putString("token", token);
  const bool saved = prefs.getString("ssid", "") == ssid &&
    prefs.getString("pass", "") == pass && prefs.getString("api", "") == apiUrl &&
    prefs.getString("token", "") == token;
  prefs.end();
  return saved;
}

void clearStoredConfig() {
  Preferences prefs;
  if (prefs.begin("config", false)) { prefs.clear(); prefs.end(); }
}

bool loadFeedSchedule(Config& config) {
  Preferences prefs;
  if (!prefs.begin("config", true)) return false;
  Config cached{};
  const bool loaded = prefs.getBytesLength("schedule-v1") == sizeof(Config) &&
    prefs.getBytes("schedule-v1", &cached, sizeof(cached)) == sizeof(cached);
  prefs.end();
  if (!loaded || !isValidConfig(cached)) return false;
  config = cached;
  return true;
}

void saveFeedSchedule(const Config& config) {
  Preferences prefs;
  if (!isValidConfig(config) || !prefs.begin("config", false)) return;
  Config previous{};
  const bool same = prefs.getBytesLength("schedule-v1") == sizeof(Config) &&
    prefs.getBytes("schedule-v1", &previous, sizeof(previous)) == sizeof(previous) &&
    memcmp(&previous, &config, sizeof(Config)) == 0;
  if (!same) prefs.putBytes("schedule-v1", &config, sizeof(config));
  prefs.end();
}

int64_t loadLastFeedMinute() {
  Preferences prefs;
  if (!prefs.begin("config", true)) return -1;
  const int64_t result = prefs.getLong64("last-feed", -1);
  prefs.end();
  return result;
}

bool saveLastFeedMinute(int64_t minute) {
  Preferences prefs;
  if (!prefs.begin("config", false)) return false;
  const bool saved = prefs.putLong64("last-feed", minute) == sizeof(minute);
  prefs.end();
  return saved;
}
