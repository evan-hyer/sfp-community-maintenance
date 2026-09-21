# Maintenance checkpoint validation

Updated 2026-09-21. This is a phase-0/1 progress record, not release readiness.

## Executable checks

After `npm ci` and `npm run build`:

| Command | Contract |
| --- | --- |
| `npm run test:characterization` | Published logger/profile behavior, mocked profile retrieval/reconciliation, artifact ZIP/tar contents and errors, project validation, build selection/dependency batches, release YAML and ordering |
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
  suites and 193 tests, with no skips or guard violations. Fresh-checkout
  reproduction of this checkpoint remains pending.
- Linux/container execution: unavailable locally and not claimed. CI is defined
  but has not run remotely. Node 20 is a historical diagnostic only; Node 22/24
  CI jobs are explicitly optional probes, not declarations of production support.

Coverage expectations are semantic: filtering/output and singleton contracts for
logger; permission values, duplicate precedence, namespace serialization,
idempotence and client error propagation for profiles; real archive contents and
failure cases; stage selection and ordering; CLI streams and exit codes. The
mutation probes demonstrate that representative behavior changes fail. Overall
coverage percentage is not used as a substitute for these contracts.

## Open acceptance work

1. Reproduce the repaired test/harness checkpoint from committed source on
   Windows and Linux. The primary Windows checkout passes all 193 Jest tests.
2. Complete phase-1 coverage for malformed profile XML through the package's own
   reader/merge entry point, full profile merge/reconcile workflows, artifact
   package merging, builder/validator/release retries and partial failures.
   Current tests cover local selection/order and mocked profile boundaries, not
   those entire workflows. The inherited builder suite is skipped.
3. Obtain two clean Windows/Linux runs from committed source and exercise fresh
   consumer tarballs after internalization. No consumer packaging is claimed yet.
4. Resolve Node 24 native installation at its dedicated compatibility checkpoint;
   refresh exact supported release versions before selecting the runtime target.

Phase 2 and dependency upgrades remain unstarted because the earlier gates have
not passed. The pre-existing vendor/registry scripts and `packages/` drafts remain
untracked and unmodified. No npm package, container, branch, or release was
pushed/published, and no live Salesforce operations were performed.
