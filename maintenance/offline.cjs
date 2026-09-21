'use strict';

// Preload in every offline validation process, including inherited Node children.
// Fail closed before a test can reach Salesforce or any other network service.
const net = require('node:net');
const tls = require('node:tls');
const http = require('node:http');
const https = require('node:https');
function recordViolation(message) {
  if (process.env.SFP_OFFLINE_VIOLATIONS) {
    require('node:fs').appendFileSync(process.env.SFP_OFFLINE_VIOLATIONS, message + '\n');
  }
  process.exitCode = 1;
}
function blocked() {
  // Even a swallowed rejection must fail the enclosing validation process.
  recordViolation('Blocked network access');
  throw new Error('Network access is disabled during offline validation');
}
net.Socket.prototype.connect = blocked;
net.connect = blocked;
net.createConnection = blocked;
tls.connect = blocked;
http.request = blocked;
http.get = blocked;
https.request = blocked;
https.get = blocked;
globalThis.fetch = blocked;
require('node:http2').connect = blocked;
require('node:dgram').createSocket = blocked;
const dns = require('node:dns');
for (const key of Object.keys(dns)) {
  if (/^(lookup|resolve|reverse)/.test(key)) dns[key] = blocked;
}
for (const key of Object.keys(dns.promises)) {
  if (/^(lookup|resolve|reverse)/.test(key)) dns.promises[key] = blocked;
}
// Tests must stub process boundaries explicitly. No shell, git, sf, or worker
// may bypass the network guard. The outer runner launches isolated Node checks.
const childProcess = require('node:child_process');
for (const key of ['exec', 'execSync', 'execFile', 'execFileSync', 'spawn', 'spawnSync', 'fork']) {
  childProcess[key] = function () {
    recordViolation('Blocked child process');
    throw new Error('Child processes are disabled during offline validation');
  };
}
require('node:worker_threads').Worker = childProcess.spawn;
require('node:module').syncBuiltinESMExports();
