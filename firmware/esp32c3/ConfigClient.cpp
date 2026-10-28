#include "ConfigClient.h"
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "RootCA.h"

bool isValidConfig(const Config& config) {
  if (config.count < 0 || config.count > MAX_FEEDS) return false;
  for (int i = 0; i < config.count; ++i) {
    const FeedTime& feed = config.feeds[i];
    if (feed.hour < 0 || feed.hour > 23 || feed.minute < 0 || feed.minute > 59 ||
        feed.duration_sec < 0 || feed.duration_sec > MAX_DURATION_SEC) return false;
    for (int j = 0; j < i; ++j) {
      if (config.feeds[j].hour == feed.hour && config.feeds[j].minute == feed.minute) return false;
    }
  }
  return true;
}

bool fetchFeedConfig(const String& url, const String& token, Config& result) {
  if (WiFi.status() != WL_CONNECTED || !url.startsWith("https://")) return false;
  WiFiClientSecure client;
  client.setCACert(API_ROOT_CA);
  client.setHandshakeTimeout(10);
  HTTPClient http;
  http.useHTTP10(true);  // ArduinoJson reads an unchunked response stream.
  http.setConnectTimeout(HTTP_TIMEOUT_MS);
  http.setTimeout(HTTP_TIMEOUT_MS);
  // Redirects are disabled so device credentials are not forwarded to another host.
  http.setFollowRedirects(HTTPC_DISABLE_FOLLOW_REDIRECTS);
  if (!http.begin(client, url)) return false;
  http.addHeader("Accept", "application/json");
  if (token.length()) http.addHeader("Authorization", "Bearer " + token);
  const int code = http.GET();
  if (code != HTTP_CODE_OK) {
    Serial.printf("Schedule request failed (%d); keeping cached schedule.\n", code);
    http.end();
    return false;
  }
  // A bounded stream parse avoids buffering an untrusted response in a String.
  if (http.getSize() > 4096) { http.end(); return false; }
  StaticJsonDocument<2048> doc;
  const DeserializationError error = deserializeJson(doc, http.getStream(), DeserializationOption::NestingLimit(3));
  http.end();
  if (error || !doc.is<JsonArray>()) return false;
  const JsonArray rows = doc.as<JsonArray>();
  if (rows.size() > MAX_FEEDS) return false;
  Config parsed{};
  for (JsonVariant row : rows) {
    if (!row.is<JsonObject>() || !row["hour"].is<int>() || !row["minute"].is<int>() || !row["duration_sec"].is<int>()) return false;
    parsed.feeds[parsed.count++] = {row["hour"].as<int>(), row["minute"].as<int>(), row["duration_sec"].as<int>()};
  }
  if (!isValidConfig(parsed)) return false;
  result = parsed;  // An empty array is a valid request to pause all meals.
  return true;
}
