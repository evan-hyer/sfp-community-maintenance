'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(process.argv[2]);
const consumer = createRequire(path.join(root, 'package.json'));
const sourceLock = require('../package-lock.json');
const logger = consumer.resolve('@flxbl-io/sfp-logger');
assert.ok(logger.startsWith(root + path.sep));
assert.equal(fs.lstatSync(path.dirname(path.dirname(logger))).isSymbolicLink(), false);
for (const name of ['@flxbl-io/sfprofiles', '@flxbl-io/apexlink', '@flxbl-io/sfdx-process-wrapper']) {
  const importer = createRequire(consumer.resolve(name));
  assert.equal(importer.resolve('@flxbl-io/sfp-logger'), logger, `${name} has a different logger`);
}
const loggerRequire = createRequire(logger);
assert.equal(loggerRequire('fs-extra/package.json').version, '9.1.0');
assert.equal(consumer('@oclif/core/package.json').version, sourceLock.packages['node_modules/@oclif/core'].version);
const profileRequire = createRequire(consumer.resolve('@flxbl-io/sfprofiles'));
const db = profileRequire('better-sqlite3')(':memory:');
try { assert.equal(db.prepare('select 1 as value').get().value, 1); }
finally { db.close(); }
const metadata = consumer('./package.json');
assert.equal(metadata.workspaces, undefined);
for (const name of metadata.bundleDependencies) assert.doesNotMatch(metadata.dependencies[name], /^(file:|workspace:)/);
console.log('Consumer paths, shared logger, locked oclif, nested fs-extra and real SQLite pass.');
