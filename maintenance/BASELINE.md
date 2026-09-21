# Upstream baseline evidence

Recorded 2026-09-21. Phases 0 and 1 are **in progress**, not acceptance-complete.
No runtime, application dependency, lockfile, or application source was changed.

This document preserves the original measurements. The subsequent
[test-only repairs](TEST-REPAIRS.md) make all 193 Jest tests pass on Windows;
those results do not replace the historical failures below.

## Inputs and isolation

- Upstream commit: `3838dd0f6dd72da9ab11a93693758fbaec55ec90`.
- Implementation parent: `13823ce1`; publication-disable checkpoint: `e1cd67dc`.
- Host: Windows 10 (`Windows_NT 10.0.19045`), x64.
- SHA-256 of the checked-out lockfile bytes on this Windows host:
  `b4a434182a33529465dd94c3b106e188c3f3b31d837b21221e6982c618431dfd`.
  The root and both successful clean checkouts have the same hash. Git checkout
  newline conversion may give Linux a different byte hash; compare the Git blob too.
- Separate detached worktrees: `.maintenance/baseline-20`, `baseline-22`,
  and `baseline-24`, each created at the upstream commit with no dependencies.
  Only the named maintenance test harness files were copied into these checkouts.
  Neither the untracked `packages/` drafts nor the workspace's `node_modules` were used.
- Node 20.20.2/npm 10.8.2 and Node 22.23.2/npm 10.9.8 were downloaded from
  `https://nodejs.org/dist/` after querying its release index. ZIP SHA-256 values
  were checked against each release's official `SHASUMS256.txt` before extraction.
  Node 24.12.0/npm 11.6.2 is the pre-existing system installation.
  These are diagnostic inputs, not a newly selected production target.
- Docker is unavailable; `wsl` exposes the installation/help interface, with no
  usable Linux runner. No GitHub checks were dispatched or pushed.
- Salesforce CLI and Java were not executed. Java discovery uses empty `java`
  and `javac` files under a temporary home; these are not runnable tools.

## Commands and results

Run each command with the specified Node directory first on PATH. Installation
uses the registry; behavioral tests use the offline runner described below.

| Command | Node 20.20.2 | Node 22.23.2 | Node 24.12.0 |
| --- | --- | --- | --- |
| `npm ci --no-audit --no-fund` | Exit 0, 1282 packages | Exit 0, 1282 packages | Exit 1, native build failure |
| `npm run build` | Exit 0 | Exit 0 | Not attempted after install failure |
| SQLite in-memory `select 1 as value` | Exit 0, `{ value: 1 }` | Exit 0, `{ value: 1 }` | Not runnable |
| Offline characterization | 22 pass, twice | 22 pass, twice | Not claimed |
| Offline CLI smoke | 4 pass | 4 pass | Not claimed |
| Full inherited Jest suite through offline runner | Exit 1; 173 pass, 18 fail, 2 skip | Same counts and failing assertions | Not attempted |

SQLite probe:

```sh
node -e "const db=require('better-sqlite3')(':memory:'); console.log(db.prepare('select 1 as value').get()); db.close()"
```

The full-suite comparison command is:

```sh
node maintenance/run-offline.cjs jest --silent --verbose --coverage --detectOpenHandles --json --outputFile=../jest-results.json
```

This invokes the unchanged Jest configuration and all existing suites, with the
same coverage/open-handle options as `npm test`. It adds a process/network guard
and isolated environment; it is not an unrestricted `npm test` result.

The [Node 20 structured evidence](evidence/windows-node20-jest.json) and
[Node 22 reproduction](evidence/windows-node22-jest.json) record every suite and
each failing assertion. Raw local output remains under `.maintenance/`
(`install-20.log`, `install-22.log`, `install-24.log`, `build-20.log`, `build-22.log`,
`native-20.log`, `native-22.log`, `jest-20.log`, and `jest-20.json`). Those local
logs are not required inputs to the committed tests.

## Install-script inspection and native blocker

Reviewed the installed package manifests and the relevant script implementations
before the clean install. Root `prepare` runs Husky; `@swc/core` validates its
native binary and may install a WASM fallback; `better-sqlite3` runs
`prebuild-install || node-gyp rebuild --release`. Scripts were enabled throughout.
The successful SQLite queries prove an actual native binding loads on Node 20/22.

Node 24 installation reports:

```text
No prebuilt binaries found (target=24.12.0 runtime=node arch=x64 libc= platform=win32)
Could not find any Visual Studio installation to use
```

The failing package is inherited `better-sqlite3@11.5.0`, reached through
sfprofiles. Python 3.12.10 is found; Visual Studio C++ tools are absent. This
establishes an installation blocker on this host, not proof of C++ source
incompatibility on all Node 24 hosts. Do not turn off install scripts to claim a
pass. Owner: runtime/native maintenance. Review trigger: phase-3 compatibility
checkpoint, after the earlier behavior/internalization gates are satisfied.

## Inherited failures and environment assumptions

All entries below were observed on the unmodified upstream application and
dependencies. No failing assertion was weakened or removed.

| Surface | Count on Windows/Node 20 | Classification and next action |
| --- | --- | --- |
| `EntitlementVersionFilter.test.ts` | 5 failures | Virtual-tree fixtures contain POSIX paths; SDR looks up Windows-separated paths and reports missing files. Test-platform owner: normalize fixture paths in a separate test repair, then verify Linux and Windows. |
| `FTAnalyzer.test.ts`, `FHTAnalyzer.test.ts` | 3 failures each | Expected tracking fields are undefined. A focused diagnostic exposed the caught error: `/main/default/object/Test__c/fields/AccountManager__c.field-meta.xml: File or folder not found`. Package-analysis owner: repair virtual-tree fixture paths across platforms while preserving assertions. |
| `FileSystem.test.ts` | 1 failure | Expected relative paths use `/`; actual paths use Windows `\\`. Test-platform owner: make expected native path semantics explicit. |
| `Git.test.ts` | 6 failures | Guard rejects real Git subprocesses. This is an offline-harness incompatibility, **not an established application regression**. Git-test owner: mock the process boundary or provide a separately constrained local-Git integration lane. |
| `SFPackageBuilder.test.ts` | 2 skipped tests | Already skipped upstream; the harness does not introduce these skips. Build owner: restore meaningful stubbed builder coverage before accepting phase 1. |

The full suite reports 40 suites: 34 passed, 5 failed, 1 skipped. It attempted
13 prohibited subprocess calls, which independently make the offline gate fail
even if test code swallows an exception. The CI full-suite step remains failing
until these issues are repaired; there is no blanket exclusion or allowlist of
failing assertions.

Earlier harness attempts exposed two additional environment assumptions:

- Salesforce core starts a Pino worker for log files on import. The runner uses
  its supported `SF_DISABLE_LOG_FILE`/`SFDX_DISABLE_LOG_FILE` settings.
- `find-java-home` eagerly starts Windows registry subprocesses on import. The
  runner supplies temporary discovery fixtures for both Java and javac.

Both are harness accommodations, not production code repairs. CLI help/version
then pass. Unknown build flags expose a rejected oclif error on stderr and exit
**1**, even though that error carries `exitCode: 2`; the smoke test captures the
observed process exit code.

Most org-related inherited tests already use `TestContext`, fake connections,
or process mocks. These ran against isolated homes without real authentication.
Git integration explicitly needs a real executable and local repository writes.
Virtual metadata fixture paths need platform repair; the existing ZIP fixtures
are tracked. No live-org compatibility is inferred from this baseline.

## Reproduction and rollback

Create a new detached worktree at the upstream commit, copy `offline.cjs`,
`run-offline.cjs`, `characterization.test.cjs`, `cli-smoke.test.cjs`,
`offline-guard.test.cjs`, `mutation-case.cjs`, and `mutations.test.cjs` from this
checkpoint into its `maintenance/` directory, and run the commands above with a
fresh `npm ci`. For the implementation checkpoint itself, use a fresh checkout
and the documented npm test scripts after building.

Do not copy `packages/`, existing dependencies, or compiled output into the
baseline. To roll back the harness checkpoint, revert that commit; dependency
resolution is unchanged. Keep `e1cd67dc` in place unless publishing workflows
are deliberately being restored after their ownership/credential review.
