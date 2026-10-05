'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
// Each attempted escape runs in an expendable guarded child, never this runner.
const probes = {
  http: "require('node:http').get('http://127.0.0.1')",
  https: "require('node:https').get('https://example.invalid')",
  fetch: "fetch('https://example.invalid')",
  socket: "new (require('node:net').Socket)().connect(80, '127.0.0.1')",
  dns: "require('node:dns').lookup('example.invalid', () => {})",
  udp: "require('node:dgram').createSocket('udp4')",
  http2: "require('node:http2').connect('https://example.invalid')",
  shell: "require('node:child_process').exec('sf org list')",
  spawn: "require('node:child_process').spawn('git', ['fetch'])",
  fork: "require('node:child_process').fork('missing.js')",
  worker: "new (require('node:worker_threads').Worker)('process.exit()', { eval: true })",
};
for (const [name, expression] of Object.entries(probes)) {
  test(`offline guard blocks ${name} even when the exception is caught`, () => {
    const child = spawnSync(process.execPath, ['--require', path.join(__dirname, 'offline.cjs'), '-e',
      `try { ${expression}; process.exitCode = 99; } catch (error) { console.error(error.message); }`],
    { encoding: 'utf8', timeout: 15000, windowsHide: true });
    assert.equal(child.error, undefined);
    assert.equal(child.status, 1);
    assert.match(child.stderr, /disabled during offline validation/);
  });
}
