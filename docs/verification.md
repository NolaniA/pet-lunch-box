# Verification

Local verification was performed on 28 October 2026 using Node.js 24.22.1 and PlatformIO 6.2.0.

| Check                          | Result                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Clean dependency installation  | `npm ci` succeeded from the generated lockfile                                                                                     |
| ESLint / TypeScript / Prettier | Checked through the project scripts                                                                                                |
| Automated tests                | 44 passing tests across schedule, API and PostgreSQL suites                                                                        |
| Production build               | Next.js 15.5.28 production build                                                                                                   |
| ESP32-C3 compile               | PlatformIO Espressif32 6.12.0 / Arduino ESP32 2.0.17 succeeded                                                                     |
| Firmware size                  | 40,956 bytes RAM (12.5%); 966,944 bytes flash (73.8%)                                                                              |
| Browser                        | Microsoft Edge via Playwright; desktop 1440px and mobile 390px                                                                     |
| Browser interactions           | Add meal, reject duplicate times, correct and save, remove all meals, token replacement confirmation/cancel, login/register toggle |
| Responsive layout              | Schedule, settings, login and setup guide checked for horizontal overflow                                                          |
| Browser runtime errors         | None observed in the verified local flows                                                                                          |

## Test boundaries

The PostgreSQL tests apply the actual migration in an isolated PGlite instance with Supabase-compatible auth roles and `auth.uid()`. They verify owner isolation, denied direct writes, validation, atomic schedule replacement and token rotation.

Browser interaction checks used temporary preview routes with intercepted schedule/settings API responses because the workspace had no Supabase credentials. Those preview routes were removed after testing. The initial verification covered a setup notice that has since been removed. The current unconfigured application presents the account sign-in page with a service availability message; it does not ask end users to configure the backend. The browser fixtures do not establish that a live Supabase account or physical device is connected.

These local checks do not perform remote database changes, production deployment or hardware flashing. The integration branch can be published separately for Preview testing.

## Dependency audit

The integration applies the patched Next.js 15 release and Vitest updates. Explicit overrides select patched PostCSS and Sharp versions; the clean install verifies their lockfile resolution.

The final dependency audit has no moderate, high or critical findings. It still reports 14 low-severity entries propagated from the upstream `deepmerge` prototype-poisoning advisory, for which the registry reports no available fix. CI fails on high-severity findings; review the remaining upstream advisory when updating HeroUI and its dependencies.

## Before using a real dispenser

- Configure a real Supabase project and rehearse the schema deployment, especially for an existing installation.
- Verify signup, email/OAuth callback, schedule persistence and owner isolation against actual Supabase.
- Confirm the HTTPS certificate chain matches the root trusted by the firmware.
- Keep the original GPIO9 servo wiring and calibrate the motor's neutral/feed pulses and dispense duration.
- Test the first meal, an empty schedule, Wi-Fi interruption, reconnection, reboot replay prevention and token replacement on the physical ESP32-C3.
- A full power cycle without network access cannot restore wall-clock time without an external RTC. Cached schedules need a synchronized clock.

## User-account and public firmware flow correction

- Public pages no longer instruct users to configure Supabase, environment files or database migrations. Those are website-operator responsibilities.
- Anonymous home visits show the public About page; the Device page still requires account sign-in. Schedule and Device navigation items are shown only after sign-in. Local sign-in accurately reports temporary unavailability until the shared backend configuration is provided.
- `/firmware` and its source ZIP download are public and do not require a user account.
- Browser verification covered the account login page, protected device page, public firmware download, user connection guide and mobile overflow. No runtime errors were observed.
- The browser-downloaded archive matched the served source ZIP. Archive verification checked that GPIO9 is preserved and user secrets are excluded.
- All 26 API and PostgreSQL tests passed again, including account isolation and token scoping.
- No firmware pin or motor-control source was changed in this correction.

## Anonymous navigation and installation choices

- The anonymous homepage and `/about` describe the product, concrete benefits and account-to-device flow.
- Public navigation contains About and Firmware; private Schedule and Device links require a signed-in user.
- The firmware installation guide defaults to Arduino IDE, with a separate PlatformIO (Python) tab. Both install the same Arduino/C++ source.
- Tabs support mouse/touch, arrow keys, Home and End with standard ARIA tab semantics.
- The redundant Connection guide and Your device settings links were removed from the firmware footer.
- Firmware source, GPIO9 and the downloadable source archive were not changed by these UI edits.

## Existing database save compatibility

- The save handler prefers the transactional RPC, with a compatibility path only when PostgREST cannot resolve that function (PGRST202).
- Regression coverage uses the real Supabase JavaScript client with a local PostgREST test transport backed by isolated PostgreSQL and legacy table RLS.
- Cases cover the three reported meal rows, exact-time ID matching, adding a database-generated ID, owner-scoped removals, empty schedules, write failures, silent RLS cleanup denial and spoofed IDs/ownership.
- Device reads and token rotation also retain their original account/token filters when their RPCs are absent, without broadening database permissions.
- 58 automated tests pass. No production schema or user data was changed during these local tests.
- Online schema diagnostics were rejected by automatic approval review because the proposed command combined environment retrieval with mutation-capable RPC endpoints. Live data writes were not performed as a workaround.
