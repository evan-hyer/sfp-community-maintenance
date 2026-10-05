#!/bin/bash
set -euo pipefail
bash /validation/maintenance/container-check.sh
sf --version
yarn --version
java -version
chromium --version
chromedriver --version
sf plugins --json > /tmp/plugins.json
cat /tmp/plugins.json
node -e 'const assert=require("node:assert/strict");const raw=require("/tmp/plugins.json");const rows=Array.isArray(raw)?raw:raw.result;for(const [name,version] of Object.entries({"sfdx-browserforce-plugin":"5.0.0",sfdmu:"4.38.0","@salesforce/sfdx-scanner":"4.7.0"})){assert.ok(rows.some(p=>p.name===name&&p.version===version),name+" exact version missing");}'
sf browserforce --help
sf sfdmu --help
sf scanner --help
export PUPPETEER_PACKAGE
PUPPETEER_PACKAGE=$(find -L /sf_plugins -path '*/node_modules/puppeteer/package.json' -print -quit)
test -n "$PUPPETEER_PACKAGE"
timeout 90s node /validation/maintenance/browser-smoke.cjs