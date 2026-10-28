#include "SetupPortal.h"
#include <DNSServer.h>
#include <WebServer.h>
#include <WiFi.h>
#include <esp_system.h>
#include <ctype.h>
#include "Storage.h"
#include "WebPage.h"

namespace {
WebServer server(80);
DNSServer dnsServer;
IPAddress apIP(192, 168, 4, 1);
bool apMode = false;
String csrfToken;

void noCache() {
  server.sendHeader("Cache-Control", "no-store");
  server.sendHeader("X-Content-Type-Options", "nosniff");
}
void handleRoot() {
  noCache();
  String html(FPSTR(SETUP_HTML));
  html.replace("%CSRF%", csrfToken);
  server.send(200, "text/html; charset=utf-8", html);
}
bool validRequest() {
  if (server.arg("csrf") == csrfToken && csrfToken.length() > 0) return true;
  server.send(403, "text/plain", "Invalid setup request. Reload the setup page.");
  return false;
}
bool validToken(const String& value) {
  if (value.length() != 36) return false;
  for (unsigned int i = 0; i < value.length(); ++i) {
    if (i == 8 || i == 13 || i == 18 || i == 23) { if (value[i] != '-') return false; }
    else if (!isxdigit(static_cast<unsigned char>(value[i]))) return false;
  }
  return true;
}
void handleSave() {
  noCache();
  if (!validRequest()) return;
  String ssid = server.arg("ssid");
  const String pass = server.arg("pass");
  String api = server.arg("api");
  String token = server.arg("token");
  api.trim();
  token.trim();
  if (ssid.length() == 0 || ssid.length() > 32 || pass.length() > 63 ||
      (pass.length() > 0 && pass.length() < 8) || !api.startsWith("https://") ||
      api.length() > 512 || api.indexOf('?') >= 0 || api.indexOf('#') >= 0 ||
      api.indexOf('\r') >= 0 || api.indexOf('\n') >= 0 || !validToken(token)) {
    server.send(400, "text/plain", "Check Wi-Fi name/password, HTTPS endpoint (without query parameters), and device token.");
    return;
  }
  if (!saveStoredConfig(ssid, pass, api, token)) {
    server.send(500, "text/plain", "Unable to save settings. Please try again.");
    return;
  }
  server.send_P(200, "text/html", SAVED_HTML);
  delay(1000);
  ESP.restart();
}
void handleClear() {
  noCache();
  if (!validRequest()) return;
  clearStoredConfig();
  server.send_P(200, "text/html", CLEARED_HTML);
  delay(1000);
  ESP.restart();
}
}

void startAPMode() {
  if (apMode) return;
  apMode = true;
  WiFi.disconnect(true);
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  char password[17], nonce[33];
  snprintf(password, sizeof(password), "%08lx%08lx", static_cast<unsigned long>(esp_random()), static_cast<unsigned long>(esp_random()));
  snprintf(nonce, sizeof(nonce), "%08lx%08lx%08lx%08lx",
    static_cast<unsigned long>(esp_random()), static_cast<unsigned long>(esp_random()),
    static_cast<unsigned long>(esp_random()), static_cast<unsigned long>(esp_random()));
  csrfToken = nonce;
  String suffix = String(static_cast<uint32_t>(ESP.getEfuseMac()), HEX);
  const String name = "PetLunchBox-" + suffix.substring(suffix.length() > 4 ? suffix.length() - 4 : 0);
  WiFi.softAP(name.c_str(), password);
  // This local setup password is intentionally printed only over the physical serial connection.
  Serial.printf("Setup Wi-Fi: %s\nSetup password: %s\nOpen http://192.168.4.1\n", name.c_str(), password);
  dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
  dnsServer.start(53, "*", apIP);
  server.on("/", HTTP_GET, handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.on("/clear", HTTP_POST, handleClear);
  server.onNotFound(handleRoot);
  server.begin();
}
bool isAPMode() { return apMode; }
void handlePortalLoop() { dnsServer.processNextRequest(); server.handleClient(); }
