# Integration provenance

| Component         | Repository                                                                | Imported commit                            |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| Web / primary     | [NolaniA/pet-lunch-box](https://github.com/NolaniA/pet-lunch-box)         | `c5cefc4f0f509c220e6ee7f4d867e5bf3d77b1f1` |
| ESP32 / secondary | [NolaniA/esp32c3-auto-feed](https://github.com/NolaniA/esp32c3-auto-feed) | `5e217bbc20077dd6cd3db9e5f0da289d772a82e7` |

The primary Git history is retained. Firmware source is imported directly, not linked as a submodule. The secondary source commit is recorded here for traceability; this is a source integration rather than a merge of unrelated Git histories.

## Layout mapping

- Upstream `src/auto-feed-v4/*` → `firmware/esp32c3/*`.
- `auto-feed-v4.ino` → `esp32c3.ino` so the Arduino sketch matches its directory.
- Upstream v1–v3 → `firmware/legacy/`, with hardcoded Wi-Fi credentials replaced by placeholders, and excluded from PlatformIO.
- Root web application and original LICENSE remain in place.

## Integration changes

- Real project README, environment example, npm lockfile, formatting rules and CI.
- Shared schedule validation and an atomic database replacement function.
- Authenticated schedule/settings API with same-origin mutation checks.
- Token-scoped device RPC, private responses and no token logging.
- Updated schedule editor with add/remove meals, empty states, retries and saved status.
- Responsive navigation, accessible account controls, login and setup guide.
- Correct Next.js 15 middleware filename and Node.js runtime; safe callback failure handling.
- Server-side route protection and consistent Supabase environment names.
- HTTPS certificate verification and bearer credentials for new firmware.
- Valid empty schedules, duplicate/range validation and persistent schedule cache.
- Wi-Fi recovery, all-day scheduling, persistent feed replay protection.
- Protected setup portal, original GPIO9 pin assignment and built-in servo PWM.
- Current patches in the Next.js 15 release line and targeted dependency security fixes.

The old source link pointed to a missing/different firmware branch. Device settings now points to the firmware directory in the primary repository; the link becomes available after this integration is pushed.

## Compatibility

Existing v4 devices may continue using the query-token API if their tokens are UUIDs and the database RPC is installed. Upgrading a board from v4 can reuse Preferences Wi-Fi/API storage when the saved URL is HTTPS; reconfigure through Serial SETUP to switch to the separate bearer token.

The web/database update must be deployed together. The new web application expects the supplied RPC functions and privileges. The original GPIO9 servo pin and existing wiring are preserved. Do not change firmware pin assignments.

## Product boundary

The web UI serves individual user accounts. Firmware source and installation instructions are public and available without authentication at `/firmware`. The website provides a source ZIP built from the maintained firmware. Backend setup belongs to the website operator and is documented in the repository, not in the user onboarding flow.
