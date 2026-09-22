# Offline baseline test repairs

Parent: `df1b3e19`. Verified 2026-09-21 on Windows x64, Node 20.20.2/npm 10.8.2.
Application source, dependency declarations, and the lockfile are unchanged.

The complete guarded Jest suite now passes: **40 suites, 193 tests, zero skips,
zero failures, zero prohibited subprocess/network attempts**. Command:

```sh
npm run test:offline -- --silent --verbose --coverage --detectOpenHandles
```

[Structured results](evidence/windows-test-repairs.json) retain each suite's
status. The original failures remain recorded in `BASELINE.md` and its evidence;
they were not overwritten with the repaired results.

| Repair | Why it is necessary |
| --- | --- |
| Normalize virtual metadata directory and XML paths in entitlement/feed/history fixtures | SDR's virtual-tree keys must use the same native path separators as its lookups. Existing semantic assertions remain unchanged. |
| Use native relative paths in filesystem expectations | The implementation returns `path.relative` results, which intentionally use Windows separators on Windows. |
| Mock only the Git client in repository-copy tests | File copying and ignore matching still run against real files. Process setup, commits and fetch are unnecessary for those assertions. Added assertions verify the requested fetch and safe-directory configuration. Corrected an ignored-path typo so the test checks a file that actually exists. |
| Restore both skipped builder tests | Update the obsolete project-config mock method; target the read mock only at `package.xml`; stub conversion/analyzer boundaries and restore mocks after each case. All original builder result assertions now pass. |
| Disable Jest Watchman detection in the offline runner | Jest used `execFile` to probe Watchman and caught the blocked exception. This was the extra prohibited subprocess beyond the Git fixture's 12 attempts. `--no-watchman` removes the optional probe explicitly. |
| Limit Jest discovery roots to this checkout's `tests/` | The inherited broad glob could discover duplicate suites inside `.maintenance` worktrees. Exactly 40 suites are now discovered, without excluding any suite in the real test directory. |
| Include call stacks in guard violation evidence | A swallowed subprocess attempt can now be traced to its caller without logging command arguments or environment values. |

The inherited symlink-copy case still only executes its link assertions on
non-Windows platforms. These tests no longer establish real Git transport
compatibility; they explicitly characterize repository copying with a mocked
Git boundary. The characterization suite separately exercises archive extraction
and temporary-directory cleanup.

The first full run from the primary checkout accidentally discovered nested
baseline worktrees; it was stopped and is not accepted evidence. The corrected
discovery run found exactly 40 suites, and the subsequent full run passed in
98.598 seconds. An attempted Windows directory-junction extension was reverted
because copying it required symlink privileges; no production behavior was
changed to accommodate it.

Fresh committed-source reproduction passes on Windows/Node 22.23.2 at
`9c1c212b`; see [clean-checkout evidence](evidence/windows-clean-checkpoint.json).
Linux checks remain required before the phase-1 matrix gate is accepted. Revert this test/harness checkpoint as a unit
to restore the precisely recorded baseline; there are no dependency changes to
roll back.
