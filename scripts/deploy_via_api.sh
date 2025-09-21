#!/usr/bin/env bash
set -euo pipefail

# Deploy Worker via API to avoid script-settings (Logpush) calls on Free plans.
# Requires: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN env vars.

if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" || -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN env vars" >&2
  exit 1
fi

NAME="worker-wandering-rain-01aa"

# The --name flag ensures the output bundle is configured for the correct worker name.
# This command bundles all [vars] from wrangler.toml into the output file.
echo "Building bundle (dry-run)..."
npx wrangler deploy --dry-run --outdir .cfbundle --minify --name "${NAME}"

cd .cfbundle

# --- Dynamically create metadata.json --- #
# Wrangler v4's `deploy --dry-run` no longer reliably creates _metadata.json.
# We will construct it manually, but pull the compatibility_date from wrangler.toml
# to keep it as the single source of truth.

COMPAT_DATE=$(grep 'compatibility_date' ../wrangler.toml | cut -d '=' -f 2 | cut -d '#' -f 1 | tr -d '"[:space:]')
MAIN_MODULE="index.js" # This is the default output name from wrangler build

if [[ -z "${COMPAT_DATE}" ]]; then
    echo "Could not read compatibility_date from wrangler.toml" >&2
    exit 1
fi

# Note: The bindings for [vars] are bundled directly into the script by wrangler.
# The bindings for secrets need to be set via the dashboard or `wrangler secret put`.
# Therefore, we only need to specify the main module and compatibility info here.
cat > metadata.json << JSON
{
  "main_module": "${MAIN_MODULE}",
  "compatibility_date": "${COMPAT_DATE}"
}
JSON

echo "--- Generated metadata.json ---"
cat metadata.json
echo "-----------------------------"


echo "Uploading script via API using main module '${MAIN_MODULE}'..."
http_code=$(curl -sS -X PUT \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -F "metadata=@metadata.json;type=application/json" \
  -F "${MAIN_MODULE}=@${MAIN_MODULE};type=application/javascript+module" \
  -o /tmp/cf_upload_body.json -w '%{http_code}' \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${NAME}")

echo "HTTP ${http_code}"
cat /tmp/cf_upload_body.json || true

# Accept 2xx; fail otherwise
if (( http_code < 200 || http_code >= 300 )); then
  echo "Upload failed" >&2
  exit 1
fi

echo "Done."