# Runtime alignment

Candidate policy, 2026-09-27; validation is in progress.

The production target is Node **24.21.0**, with npm **10.9.8**. `.nvmrc`,
`.node-version`, root package-manager metadata, internal package engines, CI
and container installation use this policy. Engines intentionally restrict the
supported major to 24. Node 22 results remain historical regression evidence;
Node 26.10.0 is a nonblocking diagnostic lane, not an advertised runtime.

The [official release index](https://nodejs.org/dist/index.json) was checked on
2026-09-27. npm 10.9.8 supports Node 24 and retains the already validated
workspace packaging behavior. Installing Node 24 alone supplies npm 11; run
`npm install --global npm@10.9.8` before `npm ci`.

Node declarations are pinned to `@types/node@24.0.0`, which supports the existing
TypeScript 5.5.2 compiler. The latest 24.x declarations (24.19.0 at verification)
require TypeScript 5.6 and are deferred to the compiler/tooling upgrade batch.
`undici-types` changes to 7.8.0 as required by these declarations. The existing
Node 22.17.2/undici 6.21.0 declarations are retained under `@inquirer/core` to
honor its narrower dependency. No application dependency version changes here.

## Required checks

The Windows/Linux Node 24 CI job runs workspace syntax checks, build, guard
probes, two contract runs, CLI checks, mutation checks, the complete Jest suite,
manifest generation, packaging and fresh production consumer installation.
`npm run test:consumer` validates the packaged implementations and native cache,
four CLI contracts and both installed executable aliases. Installation enables
lifecycle scripts so native bindings must actually work.

The workflow has been edited locally; no remote CI run is implied.

Local candidate validation passes on Windows and Ubuntu WSL2 with fresh
dependency installs: workspace syntax checks, build, two 29-contract runs,
11 guard probes, 3 mutation probes, 4 CLI contracts and all 193 Jest tests in
40 suites, with no failures or skips. The same Windows-built artifact passes
fresh production consumer installs on both platforms, including native cache,
source/resource hashes, profile merge, shared logger identity and both aliases.
See [Windows evidence](evidence/runtime-policy-windows.json) and
[Linux evidence](evidence/runtime-policy-linux.json) for the artifact hash and
candidate checkout details. These checks precede the runtime-policy commit.

The first Windows consumer run passed installation, implementation checks and
CLI contracts, then failed because the alias harness supplied Windows
backslashes in its NODE_OPTIONS preload path. Quoted forward slashes fixed the
harness; the complete fresh-consumer retry passed. The unchanged source checks
and artifact were reused, and the initial failure remains in the evidence.

The isolated Windows Node 26.10.0/npm 10.9.8 native installation probe fails at
better-sqlite3 12.1.0: its engines exclude Node 26, no matching binary is found,
and fallback compilation cannot find Visual Studio C++ tools. This does not
establish source incompatibility on an equipped host or a full application
matrix result. See [diagnostic evidence](evidence/node26-windows-native-diagnostic.json).

## Containers

From the repository root, after build and manifest generation:

```sh
npm run pack:maintenance
docker build -f dockerfiles/sfp-lite.Dockerfile -t sfp-maintenance:lite .
docker build -f dockerfiles/sfp.Dockerfile -t sfp-maintenance:full .
```

Both images require `.maintenance/flxbl-io-sfp-39.8.0.tgz`. They fail if it is
missing, instead of silently installing upstream sfp. The build context excludes
everything except that artifact and the container recipes. The Node archive is
SHA256-verified and currently restricted to validated Linux amd64. Ubuntu 24.04
remains the base distribution. Full-image Salesforce/tool/plugin versions remain
inherited; their upgrades are a later dependency batch.
The Ubuntu manifest is pinned by digest; Yarn is pinned to verified 1.22.22.

The lite image builds locally on Linux amd64 and passes offline checks with
`--network none`: native SQLite/cache, original source/resource hashes, shared
logger, profile merge, four CLI contracts and both executable aliases. See
[container evidence](evidence/runtime-policy-containers.json). The original
PowerShell build wrapper returned 1 despite completed image export; a cached
confirmation captured Docker exit 0 explicitly. Eight inherited LABEL-format
warnings remain.

Full-image validation remains blocked by host disk capacity (about 1.6 GiB free
after the lite build). An apt simulation confirms that `chromium-driver`
resolves to Ubuntu's `chromium-chromedriver` snap transition, bringing in
`chromium-browser`, snapd and systemd. This is a simulation, not an observed
full-build failure. `chromium-bsu` is a game rather than the browser.
The full recipe is unchanged pending validation. A proposed correction is to
install a pinned standalone browser and matching driver with verified hashes,
retaining browserforce and all other pinned tools, then test actual browser and
driver startup. Its browser distribution/version change requires explicit
documentation and testing; merely dropping these packages would not validate
the intended browser capability.

The full build and external-tool startup gates remain required before this
policy checkpoint is accepted. Source and packed-consumer checks do not
establish live Salesforce compatibility.
