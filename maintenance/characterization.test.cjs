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

test('build dependency batches preserve independent roots and reject cycles or missing nodes', () => {
  const Sorter = require('../lib/impl/parallelBuilder/BatchingTopoSort').default;
  const sorter = new Sorter();
  assert.deepEqual(sorter.sort({ core: ['feature'], independent: [], feature: ['app'], app: [] }),
    [['core', 'independent'], ['feature'], ['app']]);
  assert.throws(() => sorter.sort({ a: ['b'], b: ['a'] }), /cycles detected/);
  assert.throws(() => sorter.sort({ a: ['missing'] }), /Missing package/);
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
