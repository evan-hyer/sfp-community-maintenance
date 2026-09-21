'use strict';
// Trusted outer runner: only it launches children; application/test code cannot.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const mode = process.argv[2] || 'characterization';
const root = path.resolve(__dirname, '..');
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp offline '));
// find-java-home eagerly probes the Windows registry merely on import. A local
// discovery fixture avoids that subprocess; the guard still forbids Java execution.
const javaHome = path.join(home, 'java fixture');
fs.mkdirSync(path.join(javaHome, 'bin'), { recursive: true });
for (const name of ['java', 'javac']) {
  fs.writeFileSync(path.join(javaHome, 'bin', name + (process.platform === 'win32' ? '.exe' : '')), '');
}
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/^(SF_|SFDX_|SFP_|FORCE_|NODE_OPTIONS$)/i.test(key)) delete env[key];
}
Object.assign(env, {
  HOME: home, USERPROFILE: home, APPDATA: home, LOCALAPPDATA: home,
  JAVA_HOME: javaHome,
  XDG_CONFIG_HOME: home, XDG_CACHE_HOME: home,
  SF_DISABLE_TELEMETRY: 'true', SFDX_DISABLE_TELEMETRY: 'true',
  SF_DISABLE_LOG_FILE: 'true', SFDX_DISABLE_LOG_FILE: 'true',
  SF_AUTOUPDATE_DISABLE: 'true', SFDX_AUTOUPDATE_DISABLE: 'true',
  NO_COLOR: '1', FORCE_COLOR: '0', CI: 'true',
  SFP_OFFLINE_VIOLATIONS: path.join(home, 'violations.log'),
});
let args;
if (mode === 'characterization') args = ['maintenance/characterization.test.cjs'];
else if (mode === 'jest') args = ['node_modules/jest/bin/jest.js', '--runInBand', ...process.argv.slice(3)];
else if (mode === 'cli') args = ['bin/run', ...process.argv.slice(3)];
else if (mode === 'mutation') args = ['maintenance/mutation-case.cjs', process.argv[3]];
else throw new Error(`Unknown offline mode: ${mode}`);
try {
  const result = spawnSync(process.execPath, ['--require', path.join(__dirname, 'offline.cjs'), ...args], {
    cwd: root, env, encoding: 'utf8', timeout: mode === 'jest' ? 300000 : 180000,
    maxBuffer: 32 * 1024 * 1024, windowsHide: true,
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.error) console.error(result.error.message);
  const violation = fs.existsSync(env.SFP_OFFLINE_VIOLATIONS);
  if (violation) console.error(fs.readFileSync(env.SFP_OFFLINE_VIOLATIONS, 'utf8'));
  process.exitCode = violation ? 1 : (result.status ?? 1);
} finally {
  fs.rmSync(home, { recursive: true, force: true });
}
