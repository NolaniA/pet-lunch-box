# Architecture

The website is a shared service where each signed-in user manages their own settings. The ESP32-C3 code is public, open-source firmware that users download and install themselves. Users connect their ESP using their personal device token; they do not provision a database or configure the website backend.

The website operator configures the shared Supabase project once. Developer environment and migration instructions stay in repository documentation. Public pages cover account usage and firmware installation only. The firmware preserves its original GPIO9 pin.

```mermaid
flowchart LR
  Web["Next.js dashboard"] -->|"Verified account + validated meals"| API["Schedule / settings API"]
  API -->|"Account-scoped RPC + RLS"| DB[("Supabase PostgreSQL")]
  Device["ESP32-C3"] -->|"HTTPS + bearer device token"| DeviceAPI["GET /api/device"]
  DeviceAPI -->|"Token-scoped read RPC"| DB
  Device -->|"NTP + local schedule"| Servo["Continuous-rotation servo"]
```

The web app remains at the repository root so its existing Next.js deployment root does not change. Firmware is a separate PlatformIO project inside `firmware/`; there are no submodules or nested Git repositories.

## Trust boundaries

- Browser clients use the public Supabase anon key and a user session.
- Server routes verify the account with `auth.getUser()`.
- Middleware refreshes cookies on protected page entry points; routes independently enforce authorization.
- Schedule replacement and token rotation derive ownership from the verified session (and `auth.uid()` inside RPCs), never from request JSON.
- The new schema grants authenticated users only owner-scoped SELECT access and uses RPCs for writes. Existing installations retain their existing RLS table permissions; compatibility writes remain scoped to the verified account.
- Security-definer functions have an empty search path, explicit schema qualification and restricted execute grants.
- The device client receives only schedule fields after token validation, through the read RPC or the original token/account table filters when the RPC is absent. It has no service-role key and no user cookies.
- The device API sends `Cache-Control: private, no-store`. New firmware avoids tokens in URLs.

## Data flow

The dashboard sends a complete schedule to `PUT /api/schedule`. TypeScript validates and sorts it; PostgreSQL validates it again and replaces the account's rows in one transaction under a per-account lock. This transactional path lets device reads observe either the previous committed schedule or the new schedule. Older databases without the RPC use a batch upsert followed by owner-filtered removal and read-back verification. That compatibility path preserves existing permissions and avoids clearing meals before a successful write, but is not transactional across multiple requests.

Firmware polls every 5 minutes and atomically accepts a complete validated response, including `[]`. Failed requests retain the cached schedule. Scheduling runs independently from Wi-Fi after NTP synchronization. No device heartbeat/telemetry is implemented, so the dashboard describes the polling interval without claiming that a device is online or an update is already applied.

## Shared limits

The TypeScript contract is in `lib/schedule.ts`, SQL checks are in the initial migration, and firmware limits are in `AppConfig.h` / `ConfigClient.cpp`. Keep these boundaries aligned when changing the protocol. Automated tests cover API and SQL limits; firmware compilation covers the embedded sources.
