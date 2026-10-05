# Runtime alignment

Validated policy checkpoint, 2026-09-28, source head `316d4e44`.

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

The [hosted review run](https://github.com/evan-hyer/sfp-community-maintenance/actions/runs/36481800782)
passes both required Node 24 jobs: Windows in 16m47s and Ubuntu in 3m3s.
These clean checkouts tested the PR merge `d629d4f` of source head `316d4e44`.
All 193 Jest tests in 40 suites, both 29-contract runs, guard/mutation/CLI
checks and fresh production consumers passed. See
[hosted evidence](evidence/runtime-policy-hosted.json), including retained failures.

The earlier hosted Windows consumer install exceeded the harness's 300-second
limit. With foreground npm logging and a 900-second installation-only limit on
hosted Windows, it completed in about 453 seconds and all assertions passed.
Assertions retain their 300-second limits; no application dependency changed.
Optional Node 26 jobs still fail during installation: Linux exposes a
better-sqlite3/V8 compilation incompatibility; Windows fails compiler discovery
after finding no prebuilt binary. Node 26 remains unsupported.

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

The initial local full-image attempt was blocked by host disk capacity (about
1.6 GiB free after the lite build). An apt simulation confirms that `chromium-driver`
resolves to Ubuntu's `chromium-chromedriver` snap transition, bringing in
`chromium-browser`, snapd and systemd. This is a simulation, not an observed
full-build failure. `chromium-bsu` is a game rather than the browser.
The validated full-image recipe replaces the game and snap transition
with standalone Chrome for Testing and ChromeDriver **137.0.7151.55**. This is
the Chrome revision specified by the published
[Puppeteer 24.10.0 revisions](https://unpkg.com/puppeteer-core@24.10.0/lib/esm/puppeteer/revisions.js),
which browserforce 5.0.0 pins. Both archives come from the official
[version metadata](https://googlechromelabs.github.io/chrome-for-testing/137.0.7151.55.json);
the installer verifies SHA256 values recorded from those HTTPS downloads.
These are locally observed checksums, not a separately signed upstream manifest.
`PUPPETEER_EXECUTABLE_PATH` selects the shared browser; `PUPPETEER_SKIP_DOWNLOAD`
avoids a duplicate Puppeteer download. Chromium command aliases and a matching
`chromedriver` remain available. Browserforce and the other pinned tools remain.
The distribution changes from Ubuntu's Chromium snap to Chrome for Testing.
Chrome 137 is intentionally the inherited Puppeteer revision, not the latest
browser; browser/plugin upgrades remain a later dependency batch. Hosted
Puppeteer data-page and ChromeDriver startup checks pass without external networking.

After additional user cleanup, about 4 GiB was available. A no-install apt
estimate for the candidate's combined OS/runtime packages required 248 MB of
archives and 1000 MB installed, before Node, the browser, sfp, Salesforce CLI,
plugins and image export storage. A complete full-image build was not started
under that initial capacity constraint. After authorized reclamation of four
obsolete generated dependency directories and unused research archives, a
guarded full build started with about 5.45 GiB free. All Dockerfile RUN stages
passed, including browser archive verification/version checks, sfp aliases and
pinned external-tool/plugin installation. During image export, the host disk
watchdog cancelled the recorded build client when free space reached
1,321,271,296 bytes, below its 1.25 GiB reserve. Docker exited 130; the follow-on
runtime checks correctly skipped. About 1.34 GiB remained afterward.
This is a storage cancellation, not a completed full-image build or runtime
test failure. The subsequent hosted validation resolves the full-image gate.

The [hosted full-container run](https://github.com/evan-hyer/sfp-community-maintenance/actions/runs/36481793994)
passes from source head `316d4e44`, including image export, native/cache/hash
checks, four CLI contracts, aliases, pinned plugin versions, Java/tool startup,
Puppeteer with Chrome 137 and ChromeDriver. The Linux amd64 container runs with
`--network none`. Its artifact SHA512 and image ID are in the hosted evidence;
hosted jobs build independent artifacts, distinct from the earlier shared local
Windows-built artifact. Phase 3 validation gates pass. Live Salesforce, ARM64,
dependency modernization and release readiness remain outside this checkpoint.

The dedicated [full-container workflow](../.github/workflows/container-validation.yml)
runs on a standard `ubuntu-24.04` GitHub-hosted runner, with a 60-minute
limit. It triggers on pushes to `maintenance/container-validation` or manual
dispatch, builds the fork artifact with Node 24.21.0/npm 10.9.8, builds the full
image, and runs the reusable checks under `--network none`. It uses read-only
repository permissions and does not persist checkout credentials. Results and
digests go to job logs and the job summary; no cache, artifact or image upload
is configured. No secrets or Salesforce authentication are required.

For this public repository, standard hosted-runner usage is free under
[GitHub's documented billing policy](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
Larger paid runners are not selected. The successful runs above establish this
checkpoint's hosted results; no package or container release was published.
