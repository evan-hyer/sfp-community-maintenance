'use strict';
require('./offline.cjs');
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { default: logger, LoggerLevel, FileLogger, VoidLogger } = require('@flxbl-io/sfp-logger');
const { default: ProfileMerge } = require('@flxbl-io/sfprofiles/lib/impl/source/profileMerge');
const chalk = require('chalk');
const initialColor = chalk.level;
const initialLevel = logger.logLevel;
const initialDisabled = logger.isLogsDisabled;

test('tmp default directory supports nested unsafe cleanup and repeated removal', () => {
  const tmp = require('tmp');
  const result = tmp.dirSync({ unsafeCleanup: true });
  try {
    assert.equal(path.dirname(fs.realpathSync(result.name)), fs.realpathSync(tmp.tmpdir));
    fs.mkdirSync(path.join(result.name, 'nested'));
    fs.writeFileSync(path.join(result.name, 'nested', 'artifact.txt'), 'artifact');
    result.removeCallback();
    assert.equal(fs.existsSync(result.name), false);
    assert.doesNotThrow(() => result.removeCallback());
  } finally {
    result.removeCallback();
  }
});

test('tmp rejects traversal and non-string options without creating paths', () => {
  const tmp = require('tmp');
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp-tmp-contract-'));
  const base = path.join(fixture, 'base');
  fs.mkdirSync(base);
  try {
    for (const option of ['prefix', 'postfix', 'template']) {
      for (const value of ['../escape-XXXXXX', ['../escape-XXXXXX'], Buffer.from('../escape-XXXXXX'),
        { includes: () => false, toString: () => '../escape-XXXXXX' }]) {
        assert.throws(() => {
          const result = tmp.dirSync({ tmpdir: base, [option]: value });
          result.removeCallback();
        }, /Relative value not allowed|must be a string/, `${option}: ${typeof value}`);
        assert.deepEqual(fs.readdirSync(base), []);
        assert.deepEqual(fs.readdirSync(fixture), ['base']);
      }
    }
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test('simple-git blocks protocol overrides regardless of config key casing', async () => {
  const { simpleGit } = require('simple-git');
  for (const key of ['protocol.allow', 'PROTOCOL.ALLOW', 'Protocol.Allow']) {
    await assert.rejects(
      simpleGit().raw(['-c', `${key}=always`, 'status', '--short']),
      error => error.plugin === 'unsafe' && /Configuring protocol.allow is not permitted/.test(error.message),
      key
    );
  }
});

test('vendored profile diff modules load the named simple-git factory', () => {
  for (const name of ['diffUtil', 'diffImpl']) {
    const module = require(`@flxbl-io/sfprofiles/lib/impl/diff/${name}`);
    assert.equal(typeof module.default, 'function', name);
  }
});

test('patched WebSocket driver retains in-memory handshake and text delivery', async () => {
  const websocket = require('websocket-driver');
  assert.equal(require('websocket-driver/package.json').version, '0.7.5');
  const server = websocket.server({ maxLength: 1024 });
  const client = websocket.client('ws://localhost/fixture', { maxLength: 1024 });
  client.io.pipe(server.io);
  server.io.pipe(client.io);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('WebSocket handshake timed out')), 3000);
    const finish = error => {
      clearTimeout(timeout);
      error ? reject(error) : resolve();
    };
    let received;
    client.on('error', finish);
    server.on('error', finish);
    server.on('connect', () => server.start());
    client.on('open', () => client.text('hello'));
    server.on('message', event => {
      received = event.data;
      server.text('world');
    });
    client.on('message', event => {
      try {
        assert.deepEqual([received, event.data], ['hello', 'world']);
        finish();
      } catch (error) {
        finish(error);
      }
    });
    client.start();
  });
});

test('repository URL parsing compares source and full name across Git transports', () => {
  const parse = require('git-url-parse');
  const ssh = parse('git@github.com:acme/repo.git');
  const https = parse('https://github.com/acme/repo.git');
  const different = parse('https://github.com/acme/other');
  const host = parse('https://gitlab.example/acme/repo.git');
  assert.deepEqual([ssh.source, ssh.full_name], ['github.com', 'acme/repo']);
  assert.deepEqual([https.source, https.full_name], [ssh.source, ssh.full_name]);
  assert.notEqual(different.full_name, ssh.full_name);
  assert.notEqual(host.source, ssh.source);
  assert.throws(() => parse('not a url'), /URL parsing failed/);
});

test('release artifact hash IDs retain their persisted SHA-1 values', () => {
  const hash = require('object-hash');
  const core = {
    name: 'core', from: undefined, to: 'f00dbabe', version: '1.2.3.4',
    repoUrl: 'https://github.com/acme/core.git', latestCommitId: undefined, commits: undefined,
  };
  const ui = {
    name: 'ui', from: undefined, to: 'abc12345', version: '2.0.0.1',
    repoUrl: 'git@github.com:acme/ui.git', latestCommitId: undefined, commits: undefined,
  };
  assert.equal(hash([core]), '1c799185f186d20815d3f3cf9a5305246f96f6d3');
  assert.equal(hash([core, ui]), '70de9b4a4dd68b88f7c1e936f667d42122802290');
  assert.notEqual(hash([core, ui]), hash([ui, core]));
  assert.notEqual(hash([core]), hash([{ ...core, version: '1.2.3.5' }]));
});

test('dedent preserves multiline diagnostic messages and interpolated URLs', () => {
  const dedent = require('dedent');
  const url = 'https://example.my.salesforce.com';
  assert.equal(dedent`Unable to fetch test execution results,
                      Please check the results in the org by using the URL below
                      ${url}/lightning/setup/ApexTestHistory/home
                      Please try the test execution again`,
    `Unable to fetch test execution results,\nPlease check the results in the org by using the URL below\n${url}/lightning/setup/ApexTestHistory/home\nPlease try the test execution again`);
  assert.equal(dedent(`Unable to fetch any sfp artifacts in the org,skipping updates in the org
                       - 1. sfp artifact package is not installed in the org
                       - 2. The required prerequisite object is not deployed to this org`),
    'Unable to fetch any sfp artifacts in the org,skipping updates in the org\n- 1. sfp artifact package is not installed in the org\n- 2. The required prerequisite object is not deployed to this org');
});

test('Splunk metrics retain request headers and payloads through axios', async () => {
  const { SplunkMetricSender } = require('../lib/core/stats/nativeMetricSenderImpl/SplunkMetricSender');
  const sender = new SplunkMetricSender(new VoidLogger());
  const requests = [];
  sender.initialize('https://metrics.example.test/ingest', 'fixture-key');
  sender.instance.defaults.adapter = async config => {
    requests.push(config);
    return { status: 200, statusText: 'OK', headers: {}, data: {}, config };
  };

  sender.sendGaugeMetric('duration', 3, { stage: 'test' });
  sender.sendCountMetric('deploys', ['stage:test']);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.method, 'post');
    assert.equal(request.baseURL, 'https://metrics.example.test/ingest');
    assert.equal(request.url, '');
    assert.equal(request.headers.get('Authorization'), 'fixture-key');
    assert.equal(request.headers.get('Content-Type'), 'application/json');
  }
  const gauge = JSON.parse(requests[0].data);
  const count = JSON.parse(requests[1].data);
  assert.deepEqual({ ...gauge.event, timestamp: 0 },
    { metric: 'sfp.duration', type: 'guage', value: 3, tags: { stage: 'test' }, timestamp: 0 });
  assert.deepEqual({ ...count.event, timestamp: 0 },
    { metric: 'sfp.deploys', type: 'count', tags: ['stage:test'], timestamp: 0 });
  assert.equal(gauge.source, 'sfp');
  assert.equal(count.sourcetype, 'metrics');
  assert.equal(typeof gauge.event.timestamp, 'number');
  assert.equal(typeof count.event.timestamp, 'number');
});

test('DataDog metrics preserve gauge/count payloads and report async delivery errors offline', async () => {
  const { DataDogMetricsSender } = require('../lib/core/stats/nativeMetricSenderImpl/DataDogMetricSender');
  logger.logLevel = LoggerLevel.TRACE;
  const messages = [];
  const sender = new DataDogMetricsSender({ log: (...args) => messages.push(args) });
  sender.initialize('datadoghq.eu', 'fixture-key');
  const client = sender.nativeDataDogMetricsLogger;
  assert.equal(client.flushIntervalSeconds, 0);
  assert.equal(client.reporter.site, 'datadoghq.eu');
  const submissions = [];
  client.reporter = { report: async series => { submissions.push(series); } };
  sender.sendGaugeMetric('duration', 3, { stage: 'test' });
  sender.sendCountMetric('deploys', ['stage:test']);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(submissions.length, 2);
  assert.equal(submissions[0][0].metric, 'sfpowerscripts.duration');
  assert.equal(submissions[0][0].type, 'gauge');
  assert.equal(submissions[0][0].points[0][1], 3);
  assert.deepEqual(submissions[0][0].tags, ['stage:test']);
  assert.equal(submissions[1][0].metric, 'sfpowerscripts.deploys');
  assert.equal(submissions[1][0].type, 'count');
  assert.equal(submissions[1][0].points[0][1], 1);
  assert.deepEqual(submissions[1][0].tags, ['stage:test']);

  client.reporter = { report: async () => { throw new Error('offline delivery failure'); } };
  sender.sendCountMetric('failed', []);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(messages.length, 1);
  assert.match(messages[0][0], /Unable to transmit DataDog metrics due to Error: offline delivery failure/);
});

test('StatsD metrics retain their wire messages when Datadog environment variables are set', () => {
  const StatsD = require('hot-shots');
  const oldEnv = process.env.DD_ENV;
  const oldHost = process.env.DD_AGENT_HOST;
  process.env.DD_ENV = 'staging';
  process.env.DD_AGENT_HOST = '127.0.0.1';
  let client;
  try {
    client = new StatsD({
      mock: true, host: '127.0.0.1', port: 8125, protocol: 'udp', prefix: 'sfpowerscripts.',
      datadog: false, includeDataDogTags: false,
    });
    client.timing('elapsed', 45, { stage: 'test' });
    client.gauge('value', 3, ['stage:test']);
    client.increment('count', { stage: 'test' });
    assert.deepEqual(client.mockBuffer, [
      'sfpowerscripts.elapsed:45|ms|#stage:test',
      'sfpowerscripts.value:3|g|#stage:test',
      'sfpowerscripts.count:1|c|#stage:test',
    ]);
  } finally {
    if (client) client.close();
    if (oldEnv === undefined) delete process.env.DD_ENV;
    else process.env.DD_ENV = oldEnv;
    if (oldHost === undefined) delete process.env.DD_AGENT_HOST;
    else process.env.DD_AGENT_HOST = oldHost;
  }
});

test('Salesforce XML parsing and entitlement serialization retain their shapes', () => {
  const { XMLParser, XMLBuilder } = require('fast-xml-parser');
  const parser = new XMLParser();
  const settings = parser.parse(
    '<EntitlementSettings><enableEntitlementVersioning>true</enableEntitlementVersioning>' +
    '<label>R&amp;D</label></EntitlementSettings>'
  );
  const manifest = parser.parse(
    '<Package><types><members>A__c</members><name>CustomField</name></types>' +
    '<version>61.0</version></Package>'
  );
  assert.deepEqual(settings, { EntitlementSettings: { enableEntitlementVersioning: true, label: 'R&D' } });
  assert.deepEqual(manifest, { Package: { types: { members: 'A__c', name: 'CustomField' }, version: 61 } });

  const builder = new XMLBuilder({ format: true, ignoreAttributes: false, attributeNamePrefix: '@_' });
  const xml = builder.build({
    EntitlementProcess: { '@_xmlns': 'urn:test', name: 'Approval', versionNumber: 2, versionMaster: 'v1' },
  });
  assert.equal(xml,
    '<EntitlementProcess xmlns="urn:test">\n' +
    '  <name>Approval</name>\n' +
    '  <versionNumber>2</versionNumber>\n' +
    '  <versionMaster>v1</versionMaster>\n' +
    '</EntitlementProcess>\n');
});

test('profile SQLite cache preserves JSON values, replaces keys and persists across connections', () => {
  const { default: SQLiteKeyValue } = require('@flxbl-io/sfprofiles/lib/utils/sqlitekv');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp-sqlite-contract-'));
  const database = path.join(dir, 'cache.db');
  let cache;
  try {
    cache = new SQLiteKeyValue(database);
    cache.init();
    assert.equal(cache.get('missing'), null);
    const key = "profile'; DROP TABLE kv; --";
    const value = { enabled: false, count: 0, label: 'caf\u00e9', entries: ['one', null] };
    cache.set(key, value);
    assert.deepEqual(cache.get(key), value);
    cache.set(key, { enabled: true });
    cache.set('false', false);
    cache.set('zero', 0);
    cache.sqlite.close();
    cache = new SQLiteKeyValue(database);
    cache.init();
    assert.deepEqual(cache.get(key), { enabled: true });
    assert.equal(cache.get('false'), false);
    assert.equal(cache.get('zero'), 0);
    assert.equal(cache.sqlite.prepare('SELECT COUNT(*) AS count FROM kv').get().count, 3);
  } finally {
    if (cache?.sqlite?.open) cache.sqlite.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

afterEach(() => {
  logger.logLevel = initialLevel;
  logger.isLogsDisabled = initialDisabled;
  chalk.level = initialColor;
});

test('logger filters low severity and treats null severity as INFO', () => {
  const calls = [];
  const sink = { log: (...args) => calls.push(args) };
  logger.log('hidden', LoggerLevel.DEBUG, sink);
  logger.log('visible', null, sink);
  logger.log('warning', LoggerLevel.WARN, sink);
  assert.deepEqual(calls, [['visible', 30], ['warning', 40]]);
});

test('disabled and void loggers suppress output', () => {
  logger.disableLogs();
  logger.log('hidden', LoggerLevel.ERROR, { log() { assert.fail('unexpected log'); } });
  assert.equal(new VoidLogger().log('hidden', LoggerLevel.ERROR), undefined);
});

test('file logger strips ANSI and appends platform newlines', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp-logger-'));
  try {
    const file = path.join(dir, 'output.log');
    const sink = new FileLogger(file);
    sink.log('\u001b[31mred\u001b[0m', LoggerLevel.INFO);
    sink.log('plain', LoggerLevel.ERROR);
    assert.equal(fs.readFileSync(file, 'utf8'), `red${os.EOL}plain${os.EOL}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('header remains centered at 90 characters', () => {
  let output;
  logger.printHeaderLine('sfp', (s) => s, LoggerLevel.INFO, { log: (s) => { output = s; } });
  assert.equal(output, '-'.repeat(43) + 'sfp' + '-'.repeat(44));
});

// Exercise the published merge implementation without constructing an org client.
const merge = Object.create(ProfileMerge.prototype);
test('profile class merge normalizes singletons, updates duplicates and sorts', () => {
  const profile = { classAccesses: { apexClass: 'Zebra', enabled: 'true' }, custom: 'keep' };
  const result = merge.mergeClasses(profile, [
    { apexClass: 'Zebra', enabled: 'false' }, { apexClass: 'Alpha', enabled: 'true' },
  ]);
  assert.equal(result, profile);
  assert.deepEqual(result, { custom: 'keep', classAccesses: [
    { apexClass: 'Alpha', enabled: 'true' }, { apexClass: 'Zebra', enabled: 'false' },
  ] });
});

test('profile field merge preserves hidden when omitted and accepts explicit false', () => {
  const profile = { fieldPermissions: [{ field: 'Account.Name', hidden: 'true', readable: 'false', editable: 'false' }] };
  merge.mergeFields(profile, [{ field: 'Account.Name', readable: 'true', editable: 'true' }]);
  assert.equal(profile.fieldPermissions[0].hidden, 'true');
  merge.mergeFields(profile, [{ field: 'Account.Name', hidden: 'false', readable: 'true', editable: 'false' }]);
  assert.deepEqual(profile.fieldPermissions, [{ field: 'Account.Name', hidden: 'false', readable: 'true', editable: 'false' }]);
});

test('profile layout merge replaces layouts for incoming objects only', () => {
  const profile = { layoutAssignments: [
    { layout: 'Account-Old' }, { layout: 'Contact-Keep' },
  ] };
  merge.mergeLayouts(profile, [{ layout: 'Account-New' }, { layout: 'Account-New', recordType: 'Account.Business' }]);
  assert.deepEqual(profile.layoutAssignments, [
    { layout: 'Account-New' }, { layout: 'Account-New', recordType: 'Account.Business' }, { layout: 'Contact-Keep' },
  ]);
});

test('profile app merge initializes missing lists and is idempotent', () => {
  const apps = [{ application: 'Sales', default: 'true', visible: 'true' }];
  const profile = {};
  merge.mergeApps(profile, apps);
  merge.mergeApps(profile, apps);
  assert.deepEqual(profile, { applicationVisibilities: apps });
});

test('profile XML round trip preserves permission values through merge', async () => {
  const xml = require('xml2js');
  const input = '<?xml version="1.0"?><Profile xmlns="http://soap.sforce.com/2006/04/metadata"><classAccesses><apexClass>Zebra</apexClass><enabled>true</enabled></classAccesses></Profile>';
  const parsed = await xml.parseStringPromise(input, { explicitArray: false });
  merge.mergeClasses(parsed.Profile, [{ apexClass: 'Alpha', enabled: 'false' }]);
  const output = new xml.Builder().buildObject(parsed);
  const roundTrip = await xml.parseStringPromise(output, { explicitArray: false });
  assert.deepEqual(roundTrip.Profile.classAccesses, [
    { apexClass: 'Alpha', enabled: 'false' }, { apexClass: 'Zebra', enabled: 'true' },
  ]);
  assert.equal(roundTrip.Profile.$.xmlns, 'http://soap.sforce.com/2006/04/metadata');
});

test('console sink uses stdout for ERROR and omits FATAL and HIDE', () => {
  const { ConsoleLogger } = require('@flxbl-io/sfp-logger');
  const original = console.log;
  const calls = [];
  logger.disableColor();
  logger.logLevel = LoggerLevel.TRACE;
  console.log = (...args) => calls.push(args);
  try {
    const sink = new ConsoleLogger();
    for (const level of [10, 20, 30, 40, 50, 60, 70]) sink.log('message', level);
    assert.deepEqual(calls, Array.from({ length: 5 }, () => ['message']));
  } finally { console.log = original; }
});

test('custom sink retains Error identity and shares deep-import singleton state', () => {
  const deep = require('@flxbl-io/sfp-logger/lib/SFPLogger').default;
  assert.equal(deep, logger);
  deep.logLevel = LoggerLevel.ERROR;
  const calls = [];
  const sink = { log: (...args) => calls.push(args) };
  const error = new Error('failure');
  logger.log('hidden', LoggerLevel.WARN, sink);
  logger.log(error, LoggerLevel.ERROR, sink);
  assert.deepEqual(calls, [[error, 50]]);
});

test('headers bypass severity filtering and reject headers longer than 90', () => {
  logger.logLevel = LoggerLevel.ERROR;
  const calls = [];
  const sink = { log: (...args) => calls.push(args) };
  logger.printHeaderLine(null, s => s, LoggerLevel.DEBUG, sink);
  assert.deepEqual(calls, [['-'.repeat(90), 20]]);
  assert.throws(() => logger.printHeaderLine('x'.repeat(91), s => s, 30, sink), RangeError);
});

test('profile duplicate input uses last incoming value but retains pre-existing duplicates', () => {
  const profile = { classAccesses: [
    { apexClass: 'A', enabled: 'true' }, { apexClass: 'A', enabled: 'true' },
  ] };
  merge.mergeClasses(profile, [{ apexClass: 'A', enabled: 'true' }, { apexClass: 'A', enabled: 'false' }]);
  assert.deepEqual(profile.classAccesses, [
    { apexClass: 'A', enabled: 'false' }, { apexClass: 'A', enabled: 'true' },
  ]);
});

test('published profile writer retains false, removes empty lists and supplies metadata namespace', async () => {
  const Writer = require('@flxbl-io/sfprofiles/lib/impl/metadata/writer/profileWriter').default;
  const xml = require('xml2js');
  const profile = { custom: false, classAccesses: [], fieldPermissions: [
    { field: 'Account.Name', readable: false, editable: true },
  ] };
  const output = new Writer().toXml(profile);
  assert.equal(output.includes('\r'), false);
  const parsed = await xml.parseStringPromise(output, { explicitArray: false });
  assert.equal(parsed.Profile.custom, 'false');
  assert.equal(parsed.Profile.classAccesses, undefined);
  assert.deepEqual(parsed.Profile.fieldPermissions, { field: 'Account.Name', readable: 'false', editable: 'true' });
  assert.equal(parsed.Profile.$.xmlns, 'http://soap.sforce.com/2006/04/metadata');
});

test('profile retrieval normalizes singleton and null responses and propagates client errors', async () => {
  const Retriever = require('@flxbl-io/sfprofiles/lib/impl/metadata/retriever/profileRetriever').default;
  const calls = [];
  let response = { fullName: 'Admin' };
  const retriever = new Retriever({ metadata: { read: async (...args) => {
    calls.push(args);
    if (response instanceof Error) throw response;
    return response;
  } } });
  // Stub adjacent remote operations; retain the published orchestration method.
  retriever.fetchPermissionsWithValue = async names => { calls.push(['permissions', names]); return []; };
  retriever.handlePermissions = async profile => { calls.push(['handle', profile.fullName]); };
  retriever.completeObjects = async (profile, flag) => { calls.push(['complete', flag]); return profile; };
  assert.deepEqual(await retriever.loadProfiles(['Admin']), [{ fullName: 'Admin' }]);
  assert.deepEqual(calls, [['permissions', ['Admin']], ['Profile', ['Admin']], ['handle', 'Admin'], ['complete', false]]);
  response = null;
  assert.deepEqual(await retriever.loadProfiles(['Missing']), []);
  response = new Error('remote failure');
  await assert.rejects(retriever.loadProfiles(['Admin']), /remote failure/);
});

test('zip and tar artifacts round trip metadata and source through paths with spaces', () => {
  const Fetcher = require('../lib/core/artifacts/ArtifactFetcher').default;
  const Zip = require('adm-zip');
  const tar = require('tar');
  const original = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp artifact '));
  try {
    process.chdir(dir);
    const metadata = { name: 'core', version: '1.2.3' };
    const files = { 'artifact_metadata.json': JSON.stringify(metadata), 'changelog.json': '{}', 'source/example.txt': 'source\n' };
    const zip = new Zip();
    for (const [name, body] of Object.entries(files)) {
      zip.addFile(`core_sfpowerscripts_artifact/${name}`, Buffer.from(body));
      const target = path.join(dir, 'package', name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, body);
    }
    fs.mkdirSync('artifacts');
    zip.writeZip('artifacts/core_sfpowerscripts_artifact_1.2.3.zip');
    tar.c({ sync: true, gzip: true, file: 'artifacts/core_sfpowerscripts_artifact_1.2.4.tgz' }, ['package']);
    const results = Fetcher.fetchArtifacts('artifacts');
    assert.equal(results.length, 2);
    for (const result of results) {
      assert.deepEqual(JSON.parse(fs.readFileSync(result.packageMetadataFilePath)), metadata);
      assert.equal(fs.readFileSync(path.join(result.sourceDirectoryPath, 'example.txt'), 'utf8'), 'source\n');
      assert.equal(fs.readFileSync(result.changelogFilePath, 'utf8'), '{}');
    }
    assert.equal(path.basename(Fetcher.findArtifacts('artifacts', 'core')[0]), 'core_sfpowerscripts_artifact_1.2.4.tgz');
    assert.throws(() => Fetcher.fetchArtifacts('missing'), /does not exist/);
    assert.throws(() => Fetcher.missingArtifactDecider([], false), /Artifact not found/);
    assert.equal(Fetcher.missingArtifactDecider([], true), true);
    fs.mkdirSync('corrupt');
    fs.writeFileSync('corrupt/core_sfpowerscripts_artifact_1.0.0.zip', 'invalid');
    assert.throws(() => Fetcher.fetchArtifacts('corrupt'));
  } finally {
    process.chdir(original);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('ZIP archives with duplicate entry names are rejected before extraction', () => {
  const Zip = require('adm-zip');
  const zip = new Zip({ noSort: true });
  zip.addFile('a.txt', Buffer.from('first'));
  zip.addFile('b.txt', Buffer.from('second'));
  const bytes = Buffer.from(zip.toBuffer());
  for (let at = bytes.indexOf('a.txt'); at >= 0; at = bytes.indexOf('a.txt', at + 5)) {
    bytes.write('b.txt', at);
  }
  assert.throws(() => new Zip(bytes, { noSort: true }).getEntries(), /Duplicate entry name/);
});

test('Lodash preserves deep clones and rejects unsafe template import keys', () => {
  const lodash = require('lodash');
  const original = { releases: [{ name: 'core', artifacts: ['core'] }] };
  const clone = lodash.cloneDeep(original);
  clone.releases[0].artifacts.push('feature');
  assert.deepEqual(original.releases[0].artifacts, ['core']);
  assert.throws(() => lodash.template('ok', { imports: { 'value=1': true } }),
    /Invalid.*imports.*option/);
});

test('build dependency batches preserve independent roots and reject cycles or missing nodes', () => {
  const Sorter = require('../lib/impl/parallelBuilder/BatchingTopoSort').default;
  const sorter = new Sorter();
  assert.deepEqual(sorter.sort({ core: ['feature'], independent: [], feature: ['app'], app: [] }),
    [['core', 'independent'], ['feature'], ['app']]);
  assert.throws(() => sorter.sort({ a: ['b'], b: ['a'] }), /cycles detected/);
  assert.throws(() => sorter.sort({ a: ['missing'] }), /Missing package/);
});

test('artifact and profile glob patterns preserve file and directory matches', () => {
  const { globSync } = require('glob');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp glob '));
  try {
    for (const file of [
      'pkg/core_sfpowerscripts_artifact_1.0.zip',
      'pkg/feature_sfpowerscripts_artifact_1.0.tgz',
      'pkg/unrelated.zip',
      'pkg/profiles/Admin.profile-meta.xml',
      'other/profiles/User.profile-meta.xml',
    ]) {
      const target = path.join(dir, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, 'fixture');
    }
    const relativeMatches = pattern => globSync(pattern, { cwd: dir, absolute: true })
      .map(file => path.relative(dir, file)).sort();
    assert.deepEqual(relativeMatches('**/*sfpowerscripts_artifact*.@(zip|tgz)'), [
      path.join('pkg', 'core_sfpowerscripts_artifact_1.0.zip'),
      path.join('pkg', 'feature_sfpowerscripts_artifact_1.0.tgz'),
    ]);
    assert.deepEqual(relativeMatches('**/profiles/'), [
      path.join('other', 'profiles'), path.join('pkg', 'profiles'),
    ]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('release ordering follows unique project packages without mutating input', () => {
  const Sorter = require('../lib/impl/release/ReleaseDefinitionSorter').default;
  const input = [
    { release: 'feature', artifacts: { feature: '1.0.0', common: '1.0.0' } },
    { release: 'core', artifacts: { core: '1.0.0', common: '1.0.0' } },
  ];
  const original = JSON.parse(JSON.stringify(input));
  const project = { packageDirectories: ['core', 'common', 'feature'].map(packageName => ({ package: packageName, versionNumber: '1.0.0.0' })) };
  const result = new Sorter().sortReleaseDefinitions(input, project, new VoidLogger());
  assert.deepEqual(result.map(r => r.release), ['core', 'feature']);
  assert.deepEqual(input, original);
});

test('local release YAML validates required fields and baseline-org constraints', async () => {
  const Loader = require('../lib/impl/release/ReleaseDefinitionLoader').default;
  const original = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp release '));
  try {
    process.chdir(dir);
    fs.writeFileSync('release.yml', 'release: local\nartifacts:\n  core: 1.0.0-1\n');
    const loaded = await Loader.loadReleaseDefinition('release.yml');
    assert.equal(loaded.release, 'local');
    assert.deepEqual(loaded.artifacts, { core: '1.0.0-1' });
    fs.writeFileSync('release.yml', 'release: local\nartifacts:\n  <<: &base {core: 1.0.0-1}\n  feature: 2.0.0-1\n');
    const merged = await Loader.loadReleaseDefinition('release.yml');
    assert.deepEqual(merged.artifacts, { core: '1.0.0-1', feature: '2.0.0-1' });
    fs.writeFileSync('release.yml', 'release: local\n');
    await assert.rejects(Loader.loadReleaseDefinition('release.yml'), /schema requirements/);
    fs.writeFileSync('release.yml', 'release: local\nartifacts:\n  core: 1.0.0-1\nbaselineOrg: example\nskipIfAlreadyInstalled: false\n');
    await assert.rejects(Loader.loadReleaseDefinition('release.yml'), /skipIfAlreadyInstalled/);
    fs.writeFileSync('release.yml', 'release: [unterminated');
    await assert.rejects(Loader.loadReleaseDefinition('release.yml'), /Unable to read/);
    await assert.rejects(Loader.loadReleaseDefinition('missing.yml'), /Unable to read/);
  } finally {
    process.chdir(original);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('all shipped JSON schemas compile and retain representative validation boundaries', () => {
  const Ajv = require('ajv');
  const fixtures = [
    ['sfdx-project', { packageDirectories: [{ path: 'force-app', default: true }] }, {}],
    ['release-defn', { release: 'local', artifacts: { core: '1.0.0' } }, {}],
    ['release-config', {}, null],
    ['pooldefinition', { tag: 'sample', maxAllocation: 1 }, {}],
  ];
  for (const [name, valid, invalid] of fixtures) {
    const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'resources', 'schemas', `${name}.schema.json`)));
    const validate = new Ajv({ allErrors: true }).compile(schema);
    assert.equal(validate(valid), true, `${name}: valid fixture`);
    assert.equal(validate(invalid), false, `${name}: invalid fixture`);
    assert.ok(validate.errors.length, `${name}: validation errors`);
  }
});

test('artifact and package version comparisons retain prerelease and core ordering', () => {
  const semver = require('semver');
  assert.deepEqual(semver.sort(['1.9.0', '1.10.0', '1.10.0-beta.1']),
    ['1.9.0', '1.10.0-beta.1', '1.10.0']);
  assert.equal(semver.diff('1.2.3-4', '1.2.3-5'), 'prerelease');
  assert.equal(semver.gt('1.2.3-5', '1.2.3-4'), true);
  assert.equal(semver.rcompare('1.2.3-5', '1.2.3-4'), -1);
  assert.equal(semver.coerce('1.2.3.4')?.version, '1.2.3');
  assert.equal(semver.compare(semver.coerce('1.2.3.4'), semver.coerce('1.2.2.NEXT')), 1);
});

test('fs-extra preserves artifact copy, move, and JSON file behavior', async () => {
  const fse = require('fs-extra');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp filesystem '));
  try {
    const source = path.join(dir, 'source');
    fse.ensureDirSync(path.join(source, 'nested'));
    fse.outputFileSync(path.join(source, 'nested', 'artifact.txt'), 'artifact');
    fse.writeJSONSync(path.join(source, 'metadata.json'), { version: 1 });
    fse.copySync(source, path.join(dir, 'sync copy'));
    await fse.copy(source, path.join(dir, 'async copy'));
    await fse.move(path.join(dir, 'async copy', 'nested', 'artifact.txt'), path.join(dir, 'moved.txt'));
    assert.equal(fse.readFileSync(path.join(dir, 'sync copy', 'nested', 'artifact.txt'), 'utf8'), 'artifact');
    assert.deepEqual(fse.readJSONSync(path.join(dir, 'sync copy', 'metadata.json')), { version: 1 });
    assert.equal(fse.readFileSync(path.join(dir, 'moved.txt'), 'utf8'), 'artifact');
    assert.equal(fse.pathExistsSync(path.join(dir, 'async copy', 'nested', 'artifact.txt')), false);
    await fse.remove(path.join(dir, 'async copy'));
    assert.equal(fse.pathExistsSync(path.join(dir, 'async copy')), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('forceignore filtering preserves negation and nested path matching', () => {
  const IgnoreFiles = require('../lib/core/ignore/IgnoreFiles').default;
  const ignore = require('ignore');
  const rules = '*.tmp\n!important.tmp\nforce-app/**/Secret.cls\nnode_modules/\n';
  const paths = [
    'force-app/main/default/classes/Account.cls',
    'force-app/main/default/classes/Secret.cls',
    'notes.tmp',
    'important.tmp',
    'node_modules/pkg/index.js',
  ];
  assert.deepEqual(new IgnoreFiles(rules).filter(paths),
    ['force-app/main/default/classes/Account.cls', 'important.tmp']);
  const matcher = ignore().add(rules);
  assert.equal(matcher.ignores(path.join('force-app', 'main', 'default', 'classes', 'Secret.cls')), true);
  assert.equal(matcher.ignores('important.tmp'), false);
});

test('rimraf removes stale profile-diff output before org-dependent work', async () => {
  const rimraf = require('rimraf');
  const ProfileDiff = require('@flxbl-io/sfprofiles/lib/impl/source/profileDiff').default;
  const { Sfpowerkit } = require('@flxbl-io/sfprofiles/lib/utils/sfpowerkit');
  const original = Sfpowerkit.getProjectDirectories;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp rimraf '));
  const output = path.join(dir, 'output');
  const stopped = new Error('offline profile probe complete');
  try {
    fs.mkdirSync(output);
    fs.writeFileSync(path.join(output, 'old.txt'), 'stale');
    assert.equal(rimraf.sync(output), true);
    assert.equal(fs.existsSync(output), false);
    fs.mkdirSync(output);
    fs.writeFileSync(path.join(output, 'old.txt'), 'stale');
    Sfpowerkit.getProjectDirectories = async () => { throw stopped; };
    const targetOrg = { getConnection: () => ({ getUsername: () => 'offline' }) };
    const diff = new ProfileDiff([], null, targetOrg, output);
    await assert.rejects(diff.diff(), error => error === stopped);
    assert.equal(fs.existsSync(output), false);
  } finally {
    Sfpowerkit.getProjectDirectories = original;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('generated release YAML preserves null spelling and key order', async () => {
  const Generator = require('../lib/impl/release/ReleaseDefinitionGenerator').default;
  const yaml = require('js-yaml');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp generated release '));
  const generator = Object.create(Generator.prototype);
  generator._releaseConfiguration = { releaseName: 'config', releasedefinitionProperties: { changelog: null } };
  generator.releaseName = 'local';
  generator.metadata = null;
  generator.branch = '';
  try {
    const result = await generator.generateReleaseDefintion({ core: '1.0.0-1' }, {}, { getRepositoryPath: () => dir });
    assert.match(result.releaseDefinitonYAML, /^release: local\nreleaseConfigName: config\nmetadata: ~\n/);
    assert.match(result.releaseDefinitonYAML, /\nchangelog: ~\n$/);
    assert.equal(fs.readFileSync(path.join(dir, 'local.yml'), 'utf8'), result.releaseDefinitonYAML);
    assert.deepEqual(yaml.load(result.releaseDefinitonYAML, { schema: yaml.YAML11_SCHEMA }).artifacts,
      { core: '1.0.0-1' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('profile tab reconciliation normalizes singletons and removes missing components', async () => {
  const Actions = require('@flxbl-io/sfprofiles/lib/impl/source/profileActions').default;
  const Retriever = require('@flxbl-io/sfprofiles/lib/impl/metadata/retriever/metadataRetriever').default;
  const original = Retriever.prototype.isComponentExistsInProjectDirectoryOrInOrg;
  const calls = [];
  Retriever.prototype.isComponentExistsInProjectDirectoryOrInOrg = async name => {
    calls.push(name); return name === 'Account';
  };
  try {
    const actions = new Actions({ getConnection: () => ({}) });
    const singleton = { tabVisibilities: { tab: 'Account', visibility: 'DefaultOn' } };
    await actions.reconcileTabs(singleton);
    assert.deepEqual(singleton.tabVisibilities, [{ tab: 'Account', visibility: 'DefaultOn' }]);
    const missing = { tabVisibilities: [{ tab: 'Missing', visibility: 'Hidden' }] };
    await actions.reconcileTabs(missing);
    assert.deepEqual(missing.tabVisibilities, []);
    assert.deepEqual(calls, ['Account', 'Missing']);
  } finally { Retriever.prototype.isComponentExistsInProjectDirectoryOrInOrg = original; }
});

test('build selection respects stage ignores, explicit selection and prepare alias handling', () => {
  const Build = require('../lib/impl/parallelBuilder/BuildImpl').default;
  const Config = require('../lib/core/project/ProjectConfig').default;
  const original = Config.getSFDXProjectConfig;
  Config.getSFDXProjectConfig = () => ({ packageDirectories: [
    { package: 'core', versionNumber: '1.0.0.0' },
    { package: 'ignored', versionNumber: '1.0.0.0', ignoreOnStage: ['BUILD'] },
    { package: 'aliased', versionNumber: '1.0.0.0', aliasfy: true },
    { package: 'data', versionNumber: '1.0.0.0', aliasfy: true, type: 'data' },
    { package: 'unversioned' },
  ] });
  logger.disableLogs();
  try {
    const build = Object.create(Build.prototype);
    build.props = { currentStage: 'build' };
    assert.deepEqual(build.getPackagesToBeBuilt('.'), ['core', 'aliased', 'data']);
    assert.deepEqual(build.getPackagesToBeBuilt('.', ['core', 'ignored']), ['core']);
    build.props.currentStage = 'prepare';
    assert.deepEqual(build.getPackagesToBeBuilt('.'), ['core', 'ignored', 'data']);
  } finally { Config.getSFDXProjectConfig = original; }
});

test('project validation rejects invalid names and source build-number keywords', () => {
  const Validation = require('../lib/ProjectValidation').default;
  const validation = Object.create(Validation.prototype);
  const pkg = { package: 'core', versionNumber: '1.0.0.0', path: 'force-app', type: 'source' };
  validation.projectConfig = { packageDirectories: [pkg] };
  assert.doesNotThrow(() => validation.validatePackageNames());
  pkg.package = 'not a valid name';
  assert.throws(() => validation.validatePackageNames(), /alphanumeric/);
  pkg.package = 'x'.repeat(39);
  assert.throws(() => validation.validatePackageNames(), /38 characters/);
  pkg.package = 'core';
  pkg.versionNumber = '1.0.0.NEXT';
  assert.throws(() => validation.validatePackageBuildNumbers(), /NEXT.*LATEST/);
});

test('published profile merge reads and writes XML, deletes selected stale profiles and rejects malformed XML', async () => {
  const MetadataFiles = require('@flxbl-io/sfprofiles/lib/impl/metadata/metadataFiles').default;
  const originalLoad = MetadataFiles.prototype.loadComponents;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp profile merge '));
  const file = path.join(dir, 'Admin.profile-meta.xml');
  const stale = path.join(dir, 'Stale.profile-meta.xml');
  const input = '<Profile xmlns="http://soap.sforce.com/2006/04/metadata"><classAccesses><apexClass>Local</apexClass><enabled>true</enabled></classAccesses><loginHours><mondayStart>0</mondayStart></loginHours></Profile>';
  MetadataFiles.prototype.loadComponents = () => {};
  logger.disableLogs();
  try {
    fs.writeFileSync(file, input);
    fs.writeFileSync(stale, input);
    const instance = new ProfileMerge({ getConnection: () => ({}) });
    instance.getRemoteProfilesWithLocalStatus = async () => ({
      added: [], updated: [{ name: 'Admin', path: file }], deleted: [{ name: 'Stale', path: stale }],
    });
    instance.profileRetriever.loadProfiles = async names => {
      assert.deepEqual(names, ['Admin']);
      return [{ fullName: 'Admin', classAccesses: [{ apexClass: 'Remote', enabled: false }] }];
    };
    instance.reconcileTabs = async () => {};
    const result = await instance.merge(['fixture'], ['Admin'], undefined, true);
    assert.equal(result.updated[0].path, file);
    assert.equal(fs.existsSync(stale), false);
    const xml = require('xml2js');
    const profile = (await xml.parseStringPromise(fs.readFileSync(file), { explicitArray: false })).Profile;
    assert.deepEqual(profile.classAccesses, [
      { apexClass: 'Local', enabled: 'true' }, { apexClass: 'Remote', enabled: 'false' },
    ]);
    assert.equal(profile.loginHours, undefined); // Omission removes existing login restrictions.
    assert.equal(profile.$.xmlns, 'http://soap.sforce.com/2006/04/metadata');
    const first = fs.readFileSync(file, 'utf8');
    await instance.merge(['fixture'], ['Admin'], undefined, false);
    assert.equal(fs.readFileSync(file, 'utf8'), first);
    fs.writeFileSync(file, '<Profile><broken></Profile>');
    await assert.rejects(instance.merge(['fixture'], ['Admin'], undefined, false), /Unexpected close tag/);
  } finally {
    MetadataFiles.prototype.loadComponents = originalLoad;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('build completion schedules dependencies in order and records partial failure without building descendants', async () => {
  const Build = require('../lib/impl/parallelBuilder/BuildImpl').default;
  const Stats = require('../lib/core/stats/SFPStatsSender').default;
  const originalCount = Stats.logCount;
  const originalCwd = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp build failure '));
  const events = [];
  Stats.logCount = (...args) => events.push(args);
  logger.disableLogs();
  try {
    process.chdir(dir);
    fs.mkdirSync('.sfpowerscripts/logs', { recursive: true });
    const build = Object.create(Build.prototype);
    Object.assign(build, {
      props: { isQuickBuild: true }, packagesBuilt: [], failedPackages: [], generatedPackages: [],
      packagesToBeBuilt: ['feature', 'app', 'independent'], packagesInQueue: ['core'], packageCreationPromises: [],
      parentsToBeFulfilled: { feature: ['core'], app: ['feature'], independent: ['core'] },
      childs: { feature: ['app'], app: [], independent: [] },
      printPackageDetails() {}, getPriorityandTypeOfAPackage: () => ({ priority: 5, type: 'source' }),
      limiter: { schedule: (options, fn) => Promise.resolve().then(fn) },
      createPackage: async (type, name) => {
        events.push(['create', name]);
        if (name === 'feature') throw new Error('fixture build failure');
        return { packageName: name };
      },
    });
    build.queueChildPackages({ packageName: 'core' });
    await Promise.all(build.packageCreationPromises);
    assert.deepEqual(events.filter(e => e[0] === 'create'), [['create', 'feature'], ['create', 'independent']]);
    assert.deepEqual(build.failedPackages, ['feature', 'app']);
    assert.deepEqual(build.generatedPackages, [{ packageName: 'independent' }]);
    assert.deepEqual(build.packagesBuilt, ['core', 'independent']);
    assert.deepEqual(build.packagesToBeBuilt, []);
    assert.deepEqual(build.packagesInQueue, []);
    assert.match(fs.readFileSync('.sfpowerscripts/logs/feature', 'utf8'), /fixture build failure/);
  } finally {
    Stats.logCount = originalCount;
    process.chdir(originalCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('release generator retries rejected pushes but bails on other Git and non-Git errors', async () => {
  const Generator = require('../lib/impl/release/ReleaseDefinitionGenerator').default;
  const { GitError } = require('simple-git');
  const generator = Object.create(Generator.prototype);
  generator.logger = new VoidLogger();
  let attempts = 0;
  generator.execHandler = async () => {
    attempts++;
    if (attempts < 3) throw new GitError(undefined, 'failed to push some refs');
    return { release: 'local', artifacts: { core: '1.0.0' } };
  };
  assert.deepEqual(await generator.exec(), { release: 'local', artifacts: { core: '1.0.0' } });
  assert.equal(attempts, 3);
  for (const error of [new GitError(undefined, 'invalid ref'), new Error('invalid release')]) {
    attempts = 0;
    generator.execHandler = async () => { attempts++; throw error; };
    await assert.rejects(generator.exec(), actual => actual === error);
    assert.equal(attempts, 1);
  }
});

test('release handler currently swallows workflow errors and still cleans up its temporary repository', async () => {
  const Generator = require('../lib/impl/release/ReleaseDefinitionGenerator').default;
  const Git = require('../lib/core/git/Git').default;
  const { GitError } = require('simple-git');
  const original = Git.initiateRepoAtTempLocation;
  const events = [];
  Git.initiateRepoAtTempLocation = async () => ({
    getRepositoryPath: () => '/fixture/repository',
    deleteTempoRepoIfAny: () => events.push('cleanup'),
  });
  try {
    const generator = Object.create(Generator.prototype);
    generator.logger = new VoidLogger();
    generator.fetchFromGitRef = async () => {
      events.push('fetch');
      throw new GitError(undefined, 'failed to push some refs');
    };
    // Unlike a rejected execHandler, a caught workflow error never reaches the
    // outer retry loop. This is inherited behavior, not a recommended contract.
    assert.equal(await generator.exec(), undefined);
    assert.deepEqual(events, ['fetch', 'cleanup']);
  } finally { Git.initiateRepoAtTempLocation = original; }
});

test('Apex validation chooses tests and coverage and preserves remote failure results', async () => {
  const { ApexTestValidator } = require('../lib/impl/validate/ApexTestValidator');
  const { ValidationMode } = require('../lib/impl/validate/ValidateImpl');
  const Trigger = require('../lib/core/apextest/TriggerApexTests').default;
  const original = Trigger.prototype.exec;
  const calls = [];
  let response = { id: 'test-job', result: false, message: 'one test failed' };
  Trigger.prototype.exec = async function () {
    calls.push({ target: this.target_org, tests: this.testOptions, coverage: this.coverageOptions });
    if (response instanceof Error) throw response;
    return response;
  };
  logger.disableLogs();
  try {
    const pkg = { packageName: 'core', packageType: 'source', isApexFound: true,
      packageDescriptor: {}, apexTestClassses: ['CoreTest'], apexClassWithOutTestClasses: ['Core'] };
    const validator = new ApexTestValidator('fixture-org', pkg, {
      validationMode: ValidationMode.FAST_FEEDBACK, coverageThreshold: 85, disableParallelTestExecution: true,
    }, new VoidLogger());
    assert.equal(await validator.validateApexTests(), response);
    assert.equal(calls[0].target, 'fixture-org');
    assert.equal(calls[0].tests.specifiedTests, 'CoreTest');
    assert.equal(calls[0].tests.synchronous, true);
    assert.equal(calls[0].coverage.isPackageCoverageToBeValidated, false);
    pkg.packageType = 'diff';
    await validator.validateApexTests();
    assert.equal(calls[1].coverage.isIndividualClassCoverageToBeValidated, true);
    assert.equal(calls[1].coverage.coverageThreshold, 85);
    assert.deepEqual(calls[1].coverage.classesToBeValidated, ['Core']);
    response = new Error('mocked transport failure');
    await assert.rejects(validator.validateApexTests(), actual => actual === response);
    pkg.packageDescriptor.skipTesting = true;
    assert.deepEqual(await validator.validateApexTests(), { id: null, result: true, message: 'No Tests To Run' });
    assert.equal(calls.length, 3);
  } finally { Trigger.prototype.exec = original; }
});

test('package merger converts local source in order and separates data and unlocked artifacts', async () => {
  const Manager = require('../lib/core/package/packageMerger/PackageMergeManager').default;
  const Builder = require('../lib/core/package/SfpPackageBuilder').default;
  const tmp = require('tmp');
  const originalBuilder = Builder.buildPackageFromProjectDirectory;
  const originalTemp = tmp.dirSync;
  const originalCwd = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp package merge '));
  const tempDirs = [];
  const built = [];
  tmp.dirSync = options => { const result = originalTemp(options); tempDirs.push(result); return result; };
  Builder.buildPackageFromProjectDirectory = async (sink, project, name) => {
    built.push({ name, a: fs.readFileSync(path.join(project, 'force-app/main/default/classes/A.cls'), 'utf8'),
      b: fs.readFileSync(path.join(project, 'force-app/main/default/classes/B.cls'), 'utf8') });
    return { packageName: name };
  };
  logger.disableLogs();
  try {
    process.chdir(dir);
    for (const [project, classes] of [['one', { A: 'public class A {}' }],
      ['two', { A: 'public class A { public Integer value; }', B: 'public class B {}' }]]) {
      fs.mkdirSync(`${project}/force-app/main/default/classes`, { recursive: true });
      fs.mkdirSync(`${project}/forceignores`);
      fs.writeFileSync(`${project}/forceignores/.buildignore`, '');
      for (const [name, body] of Object.entries(classes)) {
        fs.writeFileSync(`${project}/force-app/main/default/classes/${name}.cls`, body);
        fs.writeFileSync(`${project}/force-app/main/default/classes/${name}.cls-meta.xml`,
          '<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata"><apiVersion>61.0</apiVersion><status>Active</status></ApexClass>');
      }
    }
    const one = { packageType: 'source', projectDirectory: 'one', packageDirectory: 'force-app', packageDescriptor: {} };
    const two = { ...one, projectDirectory: 'two' };
    const data = { packageType: 'data' };
    const unlocked = { packageType: 'unlocked' };
    const result = await new Manager([one, data, two, unlocked], new VoidLogger()).mergePackages();
    assert.deepEqual(result.mergedPackages, [one, two]);
    assert.deepEqual(result.skippedPackages, [data, unlocked]);
    assert.deepEqual(result.unlockedPackages, [unlocked]);
    assert.deepEqual(built, [{ name: 'merged', a: 'public class A { public Integer value; }', b: 'public class B {}' }]);
    assert.deepEqual(result.mergedPackage, { packageName: 'merged' });
    // Existing behavior removes the returned project directory before returning.
    assert.equal(fs.existsSync(result.mergedProjectDirectory), false);
  } finally {
    Builder.buildPackageFromProjectDirectory = originalBuilder;
    tmp.dirSync = originalTemp;
    for (const temp of tempDirs) temp.removeCallback();
    process.chdir(originalCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
