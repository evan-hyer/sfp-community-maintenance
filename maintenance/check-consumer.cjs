'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const crypto = require('node:crypto');
Object.assign(process.env, { SF_DISABLE_LOG_FILE: 'true', SF_DISABLE_TELEMETRY: 'true', SFDX_DISABLE_TELEMETRY: 'true' });
require('./offline.cjs');
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
assert.equal(profileRequire('better-sqlite3/package.json').version, sourceLock.packages['node_modules/better-sqlite3'].version);
for (const name of ['@flxbl-io/sfp-logger', '@flxbl-io/sfprofiles']) {
  const directory = path.dirname(consumer.resolve(`${name}/package.json`));
  const provenance = JSON.parse(fs.readFileSync(path.join(directory, 'PROVENANCE.json')));
  for (const [file, hash] of Object.entries(provenance.originalFilesSha256)) {
    if (file === 'package.json') continue;
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, file))).digest('hex'), hash, `${name}/${file}`);
  }
  const internal = JSON.parse(fs.readFileSync(path.join(directory, 'package.json')));
  for (const spec of Object.values(internal.dependencies)) assert.doesNotMatch(spec, /^(file:|workspace:)/);
}
const { default: ProfileMerge } = consumer('@flxbl-io/sfprofiles/lib/impl/source/profileMerge');
const merge = Object.create(ProfileMerge.prototype);
const profile = { classAccesses: { apexClass: 'Zebra', enabled: 'true' } };
merge.mergeClasses(profile, [{ apexClass: 'Zebra', enabled: 'false' }, { apexClass: 'Alpha', enabled: 'true' }]);
assert.deepEqual(profile.classAccesses, [{ apexClass: 'Alpha', enabled: 'true' }, { apexClass: 'Zebra', enabled: 'false' }]);
const db = profileRequire('better-sqlite3')(':memory:');
try { assert.equal(db.prepare('select 1 as value').get().value, 1); }
finally { db.close(); }
const { default: SQLiteKeyValue } = consumer('@flxbl-io/sfprofiles/lib/utils/sqlitekv');
const cache = new SQLiteKeyValue(':memory:');
cache.init();
try {
  assert.equal(cache.get('missing'), null);
  cache.set('profile', { enabled: false, count: 0 });
  assert.deepEqual(cache.get('profile'), { enabled: false, count: 0 });
  cache.set('profile', { enabled: true });
  assert.deepEqual(cache.get('profile'), { enabled: true });
} finally { cache.sqlite.close(); }
const metadata = consumer('./package.json');
assert.equal(metadata.workspaces, undefined);
for (const name of metadata.bundleDependencies) assert.doesNotMatch(metadata.dependencies[name], /^(file:|workspace:)/);
console.log('Consumer paths, shared logger, locked oclif, source/resource hashes, profile merge and real SQLite pass.');
