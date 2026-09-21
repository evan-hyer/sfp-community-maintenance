'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
for (const [mutation, contract] of [
  ['logger', 'logger filters low severity'],
  ['profile', 'profile class merge normalizes'],
  ['artifact', 'zip and tar artifacts round trip'],
]) {
  test(`contracts reject deliberately broken ${mutation} behavior`, () => {
    const result = spawnSync(process.execPath, [path.join(__dirname, 'run-offline.cjs'), 'mutation', mutation], {
      encoding: 'utf8', timeout: 195000, windowsHide: true, maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, NODE_TEST_CONTEXT: '' },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stdout, new RegExp(`(?:not ok \\d+ - |✖ )${contract}`));
    assert.doesNotMatch(result.stderr, /Blocked (network|child)/);
  });
}
