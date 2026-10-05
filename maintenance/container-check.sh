set -euo pipefail
node --version
npm --version
node /validation/maintenance/check-consumer.cjs /usr/local/lib/node_modules/@flxbl-io/sfp
SFP_OFFLINE_CLI_ROOT=/usr/local/lib/node_modules/@flxbl-io/sfp node /validation/maintenance/cli-smoke.test.cjs
export NODE_OPTIONS=--require=/validation/maintenance/offline.cjs
export SF_DISABLE_LOG_FILE=true SF_DISABLE_TELEMETRY=true SFDX_DISABLE_TELEMETRY=true
sfp --version
sfpowerscripts --version
