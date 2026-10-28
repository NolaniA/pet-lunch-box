#include "Feeder.h"
#include <Arduino.h>
#include <esp_arduino_version.h>
#include "AppConfig.h"

namespace {
int feederPin = SERVO_PIN;
constexpr int PWM_CHANNEL = 0;
constexpr int PWM_BITS = 14;  // ESP32-C3 supports up to 14-bit LEDC resolution.
void writePulse(int microseconds) {
  const uint32_t duty = static_cast<uint32_t>(microseconds) * ((1UL << PWM_BITS) - 1) / 20000UL;
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(feederPin, duty);
#else
  ledcWrite(PWM_CHANNEL, duty);
#endif
}
}
void setupFeeder(int servoPin) {
  feederPin = servoPin;
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(feederPin, 50, PWM_BITS);
#else
  ledcSetup(PWM_CHANNEL, 50, PWM_BITS);
  ledcAttachPin(feederPin, PWM_CHANNEL);
#endif
  writePulse(SERVO_STOP_US);
}
void doFeed(int durationSec) {
  if (durationSec <= 0 || durationSec > MAX_DURATION_SEC) return;
  Serial.printf("FEED START %d sec\n", durationSec);
  writePulse(SERVO_FEED_US);
  delay(static_cast<unsigned long>(durationSec) * 1000UL);
  writePulse(SERVO_STOP_US);
  Serial.println("FEED DONE");
}
