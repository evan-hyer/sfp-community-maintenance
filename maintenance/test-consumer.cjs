'use strict';
// Install the built artifact into a new prefix, then exercise the installed CLI.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const artifact = path.resolve(process.argv[2] || path.join(root, '.maintenance', 'flxbl-io-sfp-39.8.0.tgz'));
if (!fs.existsSync(artifact)) throw new Error(`Missing artifact: ${artifact}`);
if (!process.env.npm_execpath) throw new Error('Run through npm run test:consumer');
const prefix = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp-consumer-'));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root, stdio: 'inherit', timeout: 300000, windowsHide: true, ...options,
  });
  if (result.error || result.status !== 0) throw result.error || new Error(`${command} failed: ${result.status}`);
}
try {
  // Hosted Windows exceeded five minutes before npm emitted installation output.
  // Keep the longer limit specific to installation; assertions retain five minutes.
  const installTimeout = process.platform === 'win32' && process.env.GITHUB_ACTIONS === 'true' ? 900000 : 300000;
  console.log(`Installing fresh consumer (timeout ${installTimeout / 1000}s): ${prefix}`);
  run(process.execPath, [process.env.npm_execpath, 'install', '--prefix', prefix, '--omit=dev', '--no-audit', '--no-fund', '--foreground-scripts', '--loglevel=info', artifact], {
    timeout: installTimeout,
  });
  console.log('Fresh consumer installation completed; starting assertions.');
  const installed = path.join(prefix, 'node_modules', '@flxbl-io', 'sfp');
  run(process.execPath, [path.join(__dirname, 'check-consumer.cjs'), installed]);
  run(process.execPath, [path.join(__dirname, 'cli-smoke.test.cjs')], {
    env: { ...process.env, SFP_OFFLINE_CLI_ROOT: installed },
  });
  const violations = path.join(prefix, 'violations.log');
  const env = {
    ...process.env,
    NODE_OPTIONS: `--require="${path.join(__dirname, 'offline.cjs').replaceAll('\\', '/')}"`,
    SFP_OFFLINE_VIOLATIONS: violations,
    SF_DISABLE_LOG_FILE: 'true', SF_DISABLE_TELEMETRY: 'true', SFDX_DISABLE_TELEMETRY: 'true',
  };
  const bin = path.join(prefix, 'node_modules', '.bin');
  for (const alias of ['sfp', 'sfpowerscripts']) {
    if (process.platform === 'win32') {
      run(process.env.ComSpec || 'cmd.exe', ['/d', '/c', `${alias}.cmd`, '--version'], { cwd: bin, env });
    } else {
      run(path.join(bin, alias), ['--version'], { cwd: bin, env });
    }
  }
  if (fs.existsSync(violations)) throw new Error(fs.readFileSync(violations, 'utf8'));
  console.log('Fresh production consumer, CLI and aliases pass.');
} finally {
  fs.rmSync(prefix, { recursive: true, force: true });
}
