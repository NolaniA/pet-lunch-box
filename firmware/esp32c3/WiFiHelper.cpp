#include "WiFiHelper.h"
#include <WiFi.h>

bool connectWiFiCustom(const String& ssid, const String& pass) {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid.c_str(), pass.c_str());
  const unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000UL) delay(100);
  if (WiFi.status() != WL_CONNECTED) return false;
  Serial.print("Wi-Fi connected: ");
  Serial.println(WiFi.localIP());
  return true;
}
