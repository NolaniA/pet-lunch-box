# ESP32-C3 feeder

This is the public, open-source firmware for users to install on their own ESP32-C3 boards. The maintained source lives in `esp32c3/`. Each user connects the same firmware to their own account using their personal connection settings from the Pet Lunch Box website. `legacy/` contains v1–v3 snapshots with placeholder Wi-Fi credentials and is excluded from the build.

## Reproducible PlatformIO build

From the repository root:

```bash
python -m pip install -r firmware/requirements.txt
pio run -d firmware
pio run -d firmware -t upload
pio device monitor -d firmware
```

The configuration pins Espressif32 6.12.0, Arduino ESP32 2.0.17 and ArduinoJson 6.21.5. Servo PWM uses the ESP32's built-in LEDC peripheral, so ESP32Servo is not required. The board profile is `esp32-c3-devkitm-1`; select an appropriate profile and serial port for your actual board.

For Arduino IDE, install **esp32 by Espressif Systems 2.0.17** and **ArduinoJson 6.21.5**. Open `esp32c3/esp32c3.ino` with every adjacent header and source file in the same folder. The folder and sketch names must both be `esp32c3`.

## Wiring and calibration

| Connection | Default |
| --- | --- |
| Servo signal | GPIO9 |
| Servo PWM | 50 Hz, 14-bit LEDC |
| Neutral pulse | 1500 µs |
| Feed pulse | 2000 µs |
| Serial | 115200 baud |

The firmware preserves the original v4 GPIO9 servo pin and existing wiring. Keep the original pin assignments unchanged. Use an appropriate external supply for the servo and a common ground with the ESP32. The implementation assumes a continuous-rotation servo; a positional servo needs a different control strategy. Calibrate neutral and feed pulses for the actual motor.

## First-time setup

1. Open the Pet Lunch Box website and create or sign in to your account. The website operator manages the shared backend; you do not need your own database project.
2. Sign in, save the schedule and open **Device**.
3. Flash and reboot the board with Serial Monitor open.
4. Join `PetLunchBox-XXXX`. Its randomly generated password is printed over serial.
5. Open `http://192.168.4.1`.
6. Enter Wi-Fi SSID/password, the HTTPS endpoint (for example `https://your-domain.com/api/device`) and the device token in separate fields.
7. Save. The board restarts, synchronizes its clock and fetches the schedule.

The endpoint must not contain query parameters. New requests send the token as `Authorization: Bearer …`. Setup form writes use a session nonce; credentials are stored in ESP32 Preferences, not source code.

To reconfigure Wi-Fi, change a token, or clear settings, send `SETUP` followed by a newline in Serial Monitor. The servo stops while the setup portal is active. Changing the endpoint/token clears the previous account's cached schedule; changing Wi-Fi alone preserves it.

## HTTPS trust

`esp32c3/RootCA.h` contains the [ISRG Root X1 certificate](https://letsencrypt.org/certificates/) downloaded from [Let's Encrypt](https://letsencrypt.org/certs/isrgrootx1.pem). The adjacent PEM is its source copy. Your server certificate chain must end at that trust anchor. If your hosting uses another CA, replace both the PEM and the string in `RootCA.h` with the correct trusted root before building.

TLS certificate verification is enabled. Redirect following is disabled to avoid forwarding device credentials to another host. Use the final HTTPS endpoint directly. NTP must synchronize the device time before certificate verification succeeds.

## Runtime behavior

- Time zone: UTC+7 (Asia/Bangkok), no daylight saving.
- At most 10 unique daily meal times; integer hour 0–23, minute 0–59, duration 0–60 seconds.
- HTTP fetch every 5 minutes while connected, with bounded connection/read timeouts.
- The parser rejects the entire response if any row is invalid.
- A valid empty array replaces the cached schedule and pauses all meals.
- A request/TLS/JSON failure keeps the last valid schedule, including authorization failures. Token rotation revokes API access; it is **not** a remote emergency stop.
- The valid schedule is cached in NVS and unchanged schedules are not rewritten.
- The scheduler checks the local clock even when Wi-Fi disconnects. Wi-Fi reconnect attempts continue.
- A persistent minute marker is written **before** dispensing, preventing a second feed after reboot in the same minute or after a backward clock adjustment.
- Deep sleep is disabled so meals between 21:00 and 05:00 are not silently skipped.
- No missed-meal catch-up occurs. After full power loss, the board needs NTP again; offline power-cycle timekeeping needs an external RTC.
- A power failure between recording a meal and finishing the motor can leave that meal incomplete. The marker deliberately favors preventing a duplicate feed.

Verify wiring, actual dispense quantity, restart behavior and network recovery on your physical device before relying on the routine.
