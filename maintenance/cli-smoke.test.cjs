'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
function cli(...args) {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'run-offline.cjs'), 'cli', ...args], {
    encoding: 'utf8', timeout: 195000, windowsHide: true, maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(result.error, undefined);
  assert.doesNotMatch(result.stderr, /Blocked (network|child)/);
  return result;
}
test('version has package, platform and runtime on stdout', () => {
  const result = cli('--version');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /@flxbl-io\/sfp\/39\.8\.0 .* node-v/);
  assert.equal(result.stderr, '');
});
test('help discovers build, validate and release', () => {
  const result = cli('--help');
  assert.equal(result.status, 0, result.stderr);
  for (const command of ['build', 'validate', 'release']) assert.match(result.stdout, new RegExp(`\\b${command}\\b`));
  assert.equal(result.stderr, '');
});
test('build help and legacy alias expose the same flags', () => {
  for (const command of ['build', 'orchestrator:build']) {
    const result = cli(command, '--help');
    assert.equal(result.status, 0, result.stderr);
    for (const flag of ['--buildOnly', '--executorcount', '--branch']) assert.ok(result.stdout.includes(flag));
    assert.equal(result.stderr, '');
  }
});
test('unknown build flags fail before authentication and report on stderr', () => {
  const result = cli('build', '--not-a-real-flag');
  // The inherited bootstrap surfaces the parser rejection as exit 1, although
  // the oclif error object contains exitCode 2. Preserve the observed contract.
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /Nonexistent flag: --not-a-real-flag/);
  assert.doesNotMatch(result.stdout, /Nonexistent flag/);
});
