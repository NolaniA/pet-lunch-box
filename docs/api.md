# API contract

Responses containing schedules or credentials are private and must not be cached. The shared schedule payload is an array:

```json
[
  { "hour": 6, "minute": 30, "duration_sec": 10 },
  { "hour": 17, "minute": 30, "duration_sec": 15 }
]
```

All fields are integers. Maximum 10 rows; unique hour/minute pairs; hour 0–23, minute 0–59, duration 0–60 seconds. Every time refers to Asia/Bangkok (UTC+7). Zero duration pauses a meal. `[]` pauses all meals. Output is sorted by hour then minute.

## Device

`GET /api/device`

Preferred header: `Authorization: Bearer <device-token>`

For existing firmware, `GET /api/device?token=<device-token>` is also accepted. A bearer header takes precedence. New firmware uses separate endpoint and token fields in setup.

- 200: schedule array, including `[]`
- 401: missing, malformed or unknown token
- 503: database/configuration failure or invalid stored schedule

No user IDs, row IDs, email addresses or tokens appear in the response. The endpoint uses a token-scoped SQL function instead of opening anonymous table access.

## Dashboard schedule

`GET /api/schedule` requires an authenticated user cookie and returns that account's schedule. Unauthenticated requests return 401.

`PUT /api/schedule` requires the same session and a matching `Origin` header. Send the entire array as JSON. A successful write returns the saved, sorted array. Caller-supplied ownership or row IDs are discarded.

- 200: saved schedule
- 400: invalid JSON, invalid values, duplicate times or too many meals
- 401: missing/invalid user session
- 403: missing or cross-origin Origin
- 413: payload exceeds 4096 characters
- 503: write/configuration failure

The SQL operation replaces all rows atomically, so deleting meals works without a separate delete endpoint.

## Dashboard credentials

`GET /api/settings` requires a session and returns `{ "email": "...", "device_token": "..." }`.

`POST /api/settings` requires a session and matching Origin. It generates a new token for the authenticated account and returns `{ "device_token": "..." }`. The previous token immediately loses API access.

Update the physical device after rotating a token. A device with a revoked token retains its previously cached schedule until reconfigured; rotation does not turn off the motor remotely.
