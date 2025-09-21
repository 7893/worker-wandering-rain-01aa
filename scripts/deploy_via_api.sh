#!/usr/bin/env bash
set -euo pipefail

# Deploy Worker via API to avoid script-settings (Logpush) calls on Free plans.
# Requires: CF_ACCOUNT_ID, CF_API_TOKEN env vars.

if [[ -z "${CF_ACCOUNT_ID:-}" || -z "${CF_API_TOKEN:-}" ]]; then
  echo "Missing CF_ACCOUNT_ID or CF_API_TOKEN env vars" >&2
  exit 1
fi

NAME="worker-wandering-rain-01aa"

echo "Building bundle (dry-run)..."
npx wrangler deploy --dry-run --outdir .cfbundle --minify

cd .cfbundle
cat > metadata.json << 'JSON'
{
  "main_module": "index.js",
  "compatibility_date": "2025-09-20",
  "bindings": [
    { "name": "ORDS_BASE_URL",   "type": "plain_text", "text": "https://w9cigs8ax3ponzm-ioftnbqu5k6zb6ea.adb.ap-tokyo-1.oraclecloudapps.com/ords" },
    { "name": "ORDS_SCHEMA_PATH", "type": "plain_text", "text": "admin" },
    { "name": "ORDS_API_PATH",    "type": "plain_text", "text": "colorevents" },
    { "name": "DB_USER",          "type": "plain_text", "text": "ADMIN" }
  ]
}
JSON

echo "Uploading script via API..."
curl -fLsS -X PUT \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -F "metadata=@metadata.json;type=application/json" \
  -F "index.js=@index.js;type=application/javascript" \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${NAME}"

echo "Configuring cron schedule (00:00 UTC daily)..."
curl -fLsS -X PUT \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"schedules":[{"cron":"0 0 * * *"}]}' \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${NAME}/schedules"

echo "Done."
