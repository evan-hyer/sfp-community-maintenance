# Maintenance checkpoint validation

Updated 2026-09-26. Phases 0/1 pass on Windows and Linux; release readiness remains open.

Checkpoints: `e1cd67dc` disables inherited publishing; `df1b3e19` records the
original baseline; `1dba3220` repairs the offline test fixtures. The expanded
workflow contracts are committed as `9c1c212b`, without application or dependency edits.

## Executable checks

After `npm ci` and `npm run build`:

| Command | Contract |
| --- | --- |
| `npm run test:characterization` | Published logger/profile behavior, actual profile XML merge and malformed input, mocked retrieval/reconciliation, ZIP/tar contents, local metadata merging, project validation, build selection/dependencies/partial failure, Apex test selection and error propagation, release YAML/ordering/retries/cleanup |
| `npm run test:cli` | Version, command discovery/help, legacy build alias, flag errors and stdout/stderr separation |
| `npm run test:offline-guard` | Eleven blocked network/process entry points, including swallowed exceptions |
| `npm run test:mutations` | In-memory logger, merge, and artifact regressions must fail the unchanged contracts |
| `npm run test:offline -- --silent --verbose --coverage --detectOpenHandles` | Entire Jest suite; all 193 tests now pass on Windows after focused fixture/harness repairs |

Characterization is a separate Node test-runner suite; it is deliberately not
hidden outside Jest's `testMatch` without a runnable command. CI executes it
twice, plus the CLI, guard, mutation, build, and inherited-suite checks on Windows
and Linux. Branch-protection requirements have not been configured remotely.

The trusted runner starts a Node child with a 180-second timeout (300 seconds
for Jest), a fresh home/config/cache, disabled telemetry/log-file workers, and
Java discovery fixtures. The preload blocks HTTP(S), fetch, sockets, TLS, DNS,
UDP, HTTP/2, workers, and child processes. A violation file makes swallowed
attempts fail the runner. Tests explicitly stub Salesforce/process boundaries;
no real authentication, deployment, retrieval, Git fetch, or Java invocation is
allowed. Each runner removes its temporary home, and each contract restores its
own fixtures, logger state, color state, and method stubs.

## Evidence and gate status

- Windows/Node 20.20.2: clean install/build/native probe pass; 22 characterization
  cases pass twice; 4 CLI checks pass; 3 mutation checks pass. Guard probes pass (11).
- Windows/Node 22.23.2: separate clean install/build/native probe pass; 22
  characterization cases pass twice; 4 CLI checks pass.
- Windows/Node 24.12.0: clean install fails at the inherited SQLite dependency.
  No scripts-disabled install, build, or mocked native test is counted as a pass.
- Full inherited suite: both Node 20 and Node 22 have 173 passed, 18 failed,
  2 pre-existing skips, with the same failed assertions.
  See [baseline classifications](BASELINE.md) and its structured evidence.
- Subsequent [test-only repairs](TEST-REPAIRS.md): Windows/Node 20 passes all 40
  suites and 193 tests, with no skips or guard violations.
- Expanded workflow contracts: 28 cases cover the remaining representative
  phase-1 workflow surfaces. Reproduction from committed source is recorded
  separately below; these tests still execute the original published packages.
- Fresh committed checkout at `9c1c212b`, Windows/Node 22.23.2/npm 10.9.8:
  clean install with scripts, build, real SQLite probe, all 40 Jest suites/193
  tests, 28 characterization cases twice, 11 guard probes, 3 mutation probes,
  and 4 CLI checks pass. Git status stays clean. See
  [structured evidence](evidence/windows-clean-checkpoint.json).
- Draft provenance preparation: [142 published files match the locked archives](VENDOR-REVIEW.md),
  including licenses. This read-only audit does not import or reconfigure either
  package; both root dependencies still resolve to npm releases.
- Linux: a fresh committed Ubuntu 26.04.1 LTS/WSL2 checkout on Node 22.23.2
  passes install/build/SQLite, all 193 Jest tests, 28 contracts twice, 11 guard
  probes, 3 mutations, and 4 CLI checks. See [evidence](evidence/linux-clean-checkpoint.json).
  Container checks have not run. CI is defined but has not run remotely. Node 20 is a historical diagnostic only; Node 22/24
  CI jobs are explicitly optional probes, not declarations of production support.

Coverage expectations are semantic: filtering/output and singleton contracts for
logger; permission values, duplicate precedence, namespace serialization,
idempotence and client error propagation for profiles; real archive contents and
failure cases; stage selection and ordering; CLI streams and exit codes. The
mutation probes demonstrate that representative behavior changes fail. Overall
coverage percentage is not used as a substitute for these contracts.

## Open acceptance work

1. Windows and Linux committed-source reproduction are complete. Preserve this
   passing baseline while internalizing the packages.
2. Keep the representative workflow assertions when internalizing dependencies.
   The contracts now exercise actual profile XML merge/read/write, malformed XML,
   metadata merge precedence, build partial failure, Apex selection, and release
   retries/cleanup. Salesforce boundaries remain mocked; no live-org result is
   implied. Both inherited builder tests have been restored.
3. Internalization now passes fresh committed-source Windows/Linux checks with
   two characterization runs per platform and isolated consumer installation of
   the same Windows-built tarball. Preserve these packaging gates during upgrades.
4. Resolve Node 24 native installation at its dedicated compatibility checkpoint;
   refresh exact supported release versions before selecting the runtime target.

Phase 2 is complete. Logger 5.0.1 is imported as a private workspace;
[Windows source and consumer evidence](evidence/logger-windows-checkpoint.json)
passes, including both executable aliases. [Fresh Windows checks](evidence/logger-windows-clean-checkpoint.json) and
[Linux source/consumer checks](evidence/logger-linux-checkpoint.json) now pass. Dependency upgrades remain unstarted.
The sfprofiles5.2.2 source import now passes Windows build, both 28-case contract
runs, all193 Jest tests, guard/mutation checks and isolated offline consumer
installation, source/resource hashes, profile merge, SQLite, CLI and both aliases.
See [Windows source/consumer evidence](evidence/profiles-windows-checkpoint.json).
Fresh committed-source [Windows](evidence/profiles-windows-clean-checkpoint.json)
and [Linux](evidence/profiles-linux-checkpoint.json) checks also pass: 40 suites,
193 tests, zero failures or skips, two 28-case contracts, 11 guard probes,
3 mutation probes and 4 CLI checks on each platform. Linux installs the same
Windows-built artifact with development dependencies omitted and verifies both
packages' source/resources, profile merge, shared logger, real SQLite and aliases.
The pre-existing vendor/registry scripts remain
untracked and unmodified. No npm package, container, branch, or release was
pushed/published, and no live Salesforce operations were performed.

## Observed behavior retained by the expanded contracts

- Merging a remote profile that omits login restrictions removes the existing
  `loginHours` and `loginIpRanges`; explicit false permission values survive XML.
- Failed build packages and their descendants are marked failed; independently
  queued packages can still complete.
- The release retry wrapper retries rejected Git push errors and bails on other
  errors. Its current inner workflow handler catches errors and returns
  `undefined` after cleanup, so those caught errors do **not** reach the retry
  loop. The tests preserve this distinction instead of claiming reliable retries
  for all release failures. Correcting that is a separate behavior change.
- Metadata package merging applies source packages in order, separates data and
  unlocked packages, and deletes the returned temporary project before returning.
  The contract reads merged contents at the builder boundary before that cleanup.
