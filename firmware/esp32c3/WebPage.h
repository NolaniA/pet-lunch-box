#pragma once
#include <Arduino.h>

const char SETUP_HTML[] PROGMEM = R"html(
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pet Lunch Box · Setup</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f4f7f3;color:#20372c;font:15px/1.6 system-ui,sans-serif}.card{width:100%;max-width:440px;background:white;border:1px solid #dce6df;border-radius:24px;padding:32px}h1{font-size:27px;line-height:1.2;margin:8px 0 16px}.eyebrow{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#326a4e;font-weight:700}p,small{color:#63796c}label{display:block;font-size:13px;font-weight:600;margin:18px 0 6px}input{width:100%;padding:12px;border:1px solid #c8d8cc;border-radius:10px;background:#fafcf9;color:#20372c;font:inherit}input:focus{outline:2px solid #326a4e;outline-offset:2px}button{width:100%;border:0;border-radius:12px;padding:13px;margin-top:22px;background:#326a4e;color:white;font:600 14px system-ui;cursor:pointer}.reset{background:transparent;border:1px solid #e2d2cf;color:#a14332;margin-top:10px}small{display:block;font-size:12px;margin-top:16px}.divider{border-top:1px solid #e3ebe5;margin-top:24px;padding-top:8px}
</style></head><body><main class="card"><div class="eyebrow">Pet Lunch Box / ESP32-C3</div><h1>Let’s connect your feeder.</h1><p>Add your Wi-Fi and the credentials from your dashboard’s Device page.</p>
<form action="/save" method="post"><input type="hidden" name="csrf" value="%CSRF%">
<label for="ssid">Wi-Fi name</label><input id="ssid" name="ssid" required maxlength="32" autocomplete="off">
<label for="pass">Wi-Fi password</label><input id="pass" name="pass" type="password" maxlength="63" autocomplete="off" placeholder="Leave blank for an open network">
<label for="api">API endpoint</label><input id="api" name="api" type="url" required maxlength="512" placeholder="https://your-domain.com/api/device">
<label for="token">Device token</label><input id="token" name="token" type="password" required minlength="36" maxlength="36" autocomplete="off">
<button type="submit">Save &amp; connect</button></form>
<small>The feeder restarts after saving. Join your usual Wi-Fi again to open the dashboard.</small>
<details class="divider"><summary>Reset saved configuration</summary><p>Removes Wi-Fi credentials, token and cached schedule.</p><form action="/clear" method="post"><input type="hidden" name="csrf" value="%CSRF%"><button class="reset" type="submit">Clear configuration &amp; restart</button></form></details>
</main></body></html>
)html";

const char SAVED_HTML[] PROGMEM = R"html(
<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Settings saved</title><body style="font:18px system-ui;text-align:center;padding:15vh 24px;background:#f4f7f3;color:#20372c"><h1>Ready to connect.</h1><p>Your settings are saved. The feeder is restarting.</p></body></html>
)html";
const char CLEARED_HTML[] PROGMEM = R"html(
<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Configuration cleared</title><body style="font:18px system-ui;text-align:center;padding:15vh 24px;background:#f4f7f3;color:#20372c"><h1>A fresh start.</h1><p>Saved configuration cleared. Check Serial Monitor for the new setup Wi-Fi password.</p></body></html>
)html";
