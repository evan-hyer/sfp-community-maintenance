'use strict';
// npm's workspace bundling places nested dependencies under packages/, rather
// than beside their bundled importer. Materialize that layout in a staging
// directory before producing the consumer artifact. Never mutate workspace links.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const tar = require('tar');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, '.maintenance'));
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'sfp pack '));
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run through npm run pack:maintenance');
function pack(cwd, destination) {
  const result = spawnSync(process.execPath, [npm, 'pack', '--ignore-scripts', '--json', '--pack-destination', destination], {
    cwd, encoding: 'utf8', windowsHide: true, timeout: 300000, maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) throw result.error || new Error(result.stderr);
  return JSON.parse(result.stdout)[0];
}
try {
  fs.mkdirSync(output, { recursive: true });
  const first = pack(root, stage);
  const content = path.join(stage, 'content');
  fs.mkdirSync(content);
  tar.x({ file: path.join(stage, first.filename), cwd: content, strip: 1, sync: true });
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json')));
  for (const workspace of manifest.workspaces) {
    const source = path.join(root, workspace);
    const internal = JSON.parse(fs.readFileSync(path.join(source, 'package.json')));
    const target = path.join(content, 'node_modules', internal.name);
    if (!fs.existsSync(path.join(target, 'package.json'))) throw new Error(`Missing bundle: ${internal.name}`);
    const nested = path.join(source, 'node_modules');
    if (fs.existsSync(nested)) fs.cpSync(nested, path.join(target, 'node_modules'), { recursive: true, dereference: true });
    manifest.dependencies[internal.name] = internal.version;
    const installedPath = `node_modules/${internal.name}`;
    lock.packages[installedPath] = { ...lock.packages[workspace], inBundle: true };
    for (const key of Object.keys(lock.packages)) {
      if (key.startsWith(workspace + '/')) {
        lock.packages[installedPath + key.slice(workspace.length)] = { ...lock.packages[key], inBundle: true };
        delete lock.packages[key];
      }
    }
    delete lock.packages[workspace];
  }
  delete manifest.workspaces;
  // Consumers receive built output, not repository maintenance/lifecycle tools.
  delete manifest.scripts;
  // The temporary tree is owned by this process; packages/ only contains the
  // misplaced nested dependencies emitted by the initial npm workspace pack.
  fs.rmSync(path.join(content, 'packages'), { recursive: true, force: true });
  fs.writeFileSync(path.join(content, 'package.json'), JSON.stringify(manifest, null, 4) + '\n');
  lock.packages[''] = { ...lock.packages[''], dependencies: manifest.dependencies };
  delete lock.packages[''].workspaces;
  fs.writeFileSync(path.join(content, 'npm-shrinkwrap.json'), JSON.stringify(lock, null, 4) + '\n');
  const result = pack(content, output);
  for (const name of manifest.bundleDependencies) {
    if (!result.bundled.includes(name)) throw new Error(`Bundle omitted ${name}`);
  }
  console.log(JSON.stringify(result, null, 2));
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
}
