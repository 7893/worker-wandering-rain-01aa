#!/usr/bin/env bash
set -euo pipefail

# Deploy Worker via API to avoid script-settings (Logpush) calls on Free plans.
# Requires: CF_ACCOUNT_ID, CF_API_TOKEN env vars.

if [[ -z "${CF_ACCOUNT_ID:-}" || -z "${CF_API_TOKEN:-}" ]]; then
  echo "Missing CF_ACCOUNT_ID or CF_API_TOKEN env vars" >&2
  exit 1
fi

NAME="worker-wandering-rain-01aa"

# The --name flag ensures the output bundle is configured for the correct worker name.
echo "Building bundle (dry-run)..."
npx wrangler deploy --dry-run --outdir .cfbundle --minify --name "${NAME}"

cd .cfbundle

# The wrangler --dry-run command generates a _metadata.json.
# We use this file as the single source of truth for deployment metadata.
if [[ ! -f "_metadata.json" ]]; then
    echo "Error: _metadata.json not found after wrangler dry-run." >&2
    exit 1
fi

# The main module name might vary, find it from the metadata
MAIN_MODULE=$(grep -o '"main_module": "[^"]*"' _metadata.json | cut -d '"' -f 4)

if [[ -z "$MAIN_MODULE" ]]; then
  echo "Could not determine main module from _metadata.json" >&2
  exit 1
fi

echo "Uploading script via API using main module '${MAIN_MODULE}'..."
http_code=$(curl -sS -X PUT \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -F "metadata=@_metadata.json;type=application/json" \
  -F "${MAIN_MODULE}=@${MAIN_MODULE};type=application/javascript+module" \
  -o /tmp/cf_upload_body.json -w '%{http_code}' \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${NAME}")

echo "HTTP ${http_code}"
cat /tmp/cf_upload_body.json || true

# Accept 2xx; fail otherwise
if (( http_code < 200 || http_code >= 300 )); then
  echo "Upload failed" >&2
  exit 1
fi

# The cron schedule is now read from wrangler.toml, but let's ensure it's applied.
# Note: wrangler deploy should handle this, but API call is explicit.
CRON_SCHEDULE=$(grep -o 'crons = \["[^"]*\]' ../wrangler.toml | cut -d '"' -f 2)

if [[ -n "${CRON_SCHEDULE}" ]]; then
    echo "Configuring cron schedule ('${CRON_SCHEDULE}')..."
    curl -fLsS -X PUT \
      -H "Authorization: Bearer ${CF_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "{\"schedules\":[{\"cron\":\"${CRON_SCHEDULE}\"}]}" \
      "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${NAME}/schedules"
else
    echo "No cron schedule found in wrangler.toml, skipping schedule update."
fi


echo "Done."

# Verify script exists (best-effort)
echo "Verifying script exists..."
curl -sS -H "Authorization: Bearer ${CF_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${NAME}" \
  -o /tmp/cf_get_script.json -w "HTTP %{http_code}\\n"
echo "--- GET script response ---"
cat /tmp/cf_get_script.json || true
echo "---------------------------\\n"