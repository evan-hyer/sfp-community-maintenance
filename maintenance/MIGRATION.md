# Community maintenance migration plan

Updated 2026-09-25. Status: phases 0/1 validated on Windows and Linux; phase 2 is in progress.

## Implementation checkpoint

- `e1cd67dc`: inherited publishing/promotion workflows moved out of GitHub's executable workflow directory, without modifying their contents.
- `df1b3e19`: reproducible baseline plus initial offline contracts; `1dba3220`: test/harness repairs make all 40 Jest suites and 193 tests pass on Windows with zero skips or guard violations.
- `9c1c212b`: expanded 28-case workflow contracts. A fresh committed Windows checkout on Node 22.23.2/npm 10.9.8 passes install, build, real SQLite, 193 Jest tests, characterization twice, guard, mutations, and CLI checks; see [evidence](evidence/windows-clean-checkpoint.json). All 142 published vendor-draft files match verified locked archives; this does not complete internalization.
- Clean upstream Windows baselines use Node 20.20.2/npm 10.8.2 and Node 22.23.2/npm 10.9.8. Install/build and real SQLite probes pass; the full guarded Jest suite reproduces 173 passes, 18 failures, and 2 pre-existing skips on both runtimes.
- Offline runner, guard self-tests, published-package contracts, CLI smoke checks, and representative mutation probes are now exposed through npm scripts and CI. See [BASELINE.md](BASELINE.md) and [VALIDATION.md](VALIDATION.md) for scope, evidence, and remaining coverage.
- The Node 24.12.0 diagnostic install fails at inherited `better-sqlite3@11.5.0` (no prebuilt binary; no local Visual Studio C++ tools). Linux validation now runs locally in Ubuntu WSL2; container and remote checks have not run.
- Expanded contracts exercise profile XML merge/malformed input, artifact package merging, build partial failure, Apex selection, and release retries/cleanup against unchanged dependencies. The phase-1 Windows/Linux gate now passes; see [Linux evidence](evidence/linux-clean-checkpoint.json). Logger 5.0.1 is now a private workspace with unchanged implementation bytes. Windows source and isolated consumer checks pass; fresh committed-source and Linux import checks remain pending. sfprofiles source and helper drafts remain untracked; no dependency upgrades have been attempted.

## Objective and scope

Maintain sfp Community Edition as a usable Salesforce artifact and release CLI while incrementally adopting current libraries and supported Node.js versions. Preserve observed behavior first, internalize the logger and sfprofiles second, and then upgrade in independently reviewable steps.

This plan covers local implementation, offline validation, CI, and release readiness. This documentation change does not implement the migration, publish npm packages or containers, push commits, or run live Salesforce operations. Source publication and releases are separate execution steps.

## Provenance and observed baseline

- Upstream: https://github.com/flxbl-io/sfp; original MIT license retained.
- Upstream baseline: `3838dd0f6dd72da9ab11a93693758fbaec55ec90`.
- Existing planning checkpoint: `c2369937`.
- Fork: https://github.com/evan-hyer/sfp-community-maintenance.
- The previous migration record reports upstream archived on April 27, 2026; the inherited README announced a May 2026 sunset. Community Edition is separate from the continuing pro product.

| Area | Observed configuration | Consequence for migration |
| --- | --- | --- |
| Root package | `@flxbl-io/sfp` 39.8.0; npm lockfile | Preserve baseline resolution before editing ranges |
| Runtime | Engines `>=18`; PR/release CI Node 20; promotion workflow Node 14; containers Node 22 | Establish one explicit support policy across all entry points |
| Internalization candidates | logger 5.0.1; sfprofiles 5.2.2 | Import exact versions before upgrading their dependencies |
| Compiler/test stack | TypeScript ^5.4.5, NodeNext, ES2020; Jest/ts-jest 29 | Separate test tooling and module-system changes from application upgrades |
| Salesforce stack | core 8.19.0, SDR 12.21.5, packaging 4.12.0, source-tracking 7.3.11, apex-node 8.2.5 | Treat overlapping dependency and API migrations as a coordinated group |
| Packaging | Root `files` list excludes `packages`; no workspaces | A local link alone will not establish a distributable internal dependency |
| Local drafts | Untracked `maintenance/*.cjs` and `packages/sfp-logger`, `packages/sfprofiles` | Review as candidate work, not a completed or validated phase |

The package drafts contain provenance describing published JavaScript and declarations, with original TypeScript absent. Their inherited build scripts may therefore be unusable. The global `lib` ignore rule also hides vendored implementation files. Verify both before accepting an import. Do not commit unrelated untracked work with the planning change.

## Target policy and version discovery

As checked on 2026-09-21, the [official Node.js release table](https://nodejs.org/en/about/previous-releases) lists Node 24 as LTS, Node 26 as Current, and Node 18/20 as end of life. Use the newest verified Node 24 patch as the first production target. Exercise Node 26 in a separate compatibility lane, and reconsider the production target when it reaches LTS. Node 22 may be used as a supported diagnostic bridge; it is not the final target. Do not claim Node 26 support until its required checks pass.

At the start of each upgrade batch, query npm registry metadata and official changelogs for every root and internal dependency. Record installed lockfile version, declared range, latest stable version, chosen target, engine/peer requirements, module format, release-note URL, and verification date in `maintenance/DEPENDENCIES.md` (to be created). Use `npm outdated --all`, `npm ls --all`, and `npm view <package> version engines peerDependencies` as inputs, including development dependencies and native/transitive dependencies. A declared range is not an installed version.

The goal is latest stable libraries, not just the newest patch within existing ranges. Every package left behind latest must have an explicit blocker, impact, owner, and review trigger. Exclude prereleases unless separately justified. Freeze exact chosen versions in the lockfile for each checkpoint; refresh discovery rather than treating this document as a permanent version catalog.

## Phase 0: establish a reproducible baseline

1. Preserve the upstream commit and use a separate clean checkout for baseline runs so local drafts and generated output cannot affect results.
2. Record OS, architecture, Node/npm versions, commit, lockfile hash, install commands, and relevant external CLI versions. Start with the historical CI runtime for comparison only, then probe Node 22/24 without dependency edits.
3. Run a clean locked install, build, existing Jest suite, and local CLI help/version checks. Inspect install scripts first; an install with scripts disabled is a diagnostic and cannot prove native modules work.
4. Record every failure in `maintenance/BASELINE.md` (to be created), including command, exit code, reproducibility, cause where known, and whether it predates the migration. Inventory tests needing credentials, network, missing fixtures, or installed external tools.
5. Prevent inherited publish/promotion workflows from running during maintenance validation. Inventory npm, container, release, and credential assumptions before enabling fork CI.

**Gate:** another clean checkout reproduces the baseline, and failures have explicit classifications. Any minimum repair needed to run the baseline is isolated and explained; no broad upgrades occur here.

## Phase 1: characterize existing behavior

Characterization tests capture observable contracts, including awkward existing behavior; they do not redesign it. Use existing Jest infrastructure initially. Review the draft Node test-runner suite and either integrate it or expose a separate documented npm command that CI actually executes. Its current `.cjs` location is outside the Jest `testMatch` pattern.

| Surface | Required characterization |
| --- | --- |
| CLI | Help, version, command discovery, aliases, flag parsing, invalid input, exit codes, stdout/stderr separation |
| Logger | Levels and defaults, disabled logging, console/custom/file/void sinks, ANSI stripping, newline behavior, headers, error formatting, shared singleton state |
| Profiles | Missing and singleton XML entries, duplicates, sorting, explicit false versus omitted permissions, namespace preservation, merge precedence, idempotence, malformed input, reconcile/retrieve behavior through mocked clients |
| Artifacts and projects | Project validation, package metadata, artifact names and contents, round trips, dependency ordering, merge behavior, missing/corrupt inputs |
| Build/validate/release | Representative local workflows with stubbed Salesforce/process boundaries; selection, sequencing, retries, partial failure, and error propagation |
| Platform behavior | Paths with spaces, separators, newline conventions, temp-directory cleanup, child-process exit handling |

Implementation requirements:

- Run logger/profile contracts against the original published versions first. Reuse exactly those contracts against the internal copies in phase 2.
- Use small representative fixtures and focused semantic assertions. Normalize only nondeterminism such as timestamps, temporary paths, generated IDs, and color configuration; retain meaningful ordering and permission values.
- Block unexpected outbound network access, telemetry, authentication discovery, and real child-process commands in offline tests. Account for HTTP clients, fetch, and subprocesses rather than assuming one mock blocks everything.
- Reset environment variables, global logger state, timers, mocks, and filesystem fixtures after each case. Give subprocess checks timeouts.
- Demonstrate that representative deliberately changed outputs fail assertions. Do not regenerate snapshots merely to make an upgrade pass.
- Establish focused coverage expectations for these contracts; overall coverage percentage alone is not the acceptance criterion.
- Run the deterministic suite twice from clean state on Windows and Linux. Add required PR checks for build, existing offline unit tests, characterization, and CLI smoke tests.

**Gate:** deterministic tests pass against the unchanged dependencies; any inherited failures are narrowly documented with ownership. The new tests must fail on meaningful behavior changes, and unexpected network access must fail the offline gate.

## Phase 2: internalize logger and sfprofiles without upgrades

### Import and ownership

1. Import logger 5.0.1 first, then sfprofiles 5.2.2 under `packages/`. Preserve current import names and deep import paths, including `sfprofiles/lib/impl/source/*` and utility imports used by commands.
2. Verify tarball integrity and per-file hashes against provenance. Prefer recoverable upstream source matching these releases; if unavailable, explicitly maintain the published JavaScript and `.d.ts` files as the initial source form. Do not invent a TypeScript rebuild or silently replace these versions.
3. Keep each license, copyright, repository origin, exact version, retrieval date, distribution integrity, and modification history. Update third-party notices as needed.
4. Add narrowly scoped ignore exceptions for required vendored files, verify them with `git ls-files`, and ensure root clean/build operations do not delete the only maintained implementation.
5. Replace inherited package scripts with operations that work for the chosen source form. A later source reconstruction is a separate behavior-tested change.

### Resolution and distributable package

Use npm workspaces with explicit local dependencies as the initial development design, retaining the existing scoped names to avoid a broad import rewrite. Mark internal packages private to prevent accidental independent publication. Verify that root code and sfprofiles resolve the same local logger; duplicate logger singletons can change configuration behavior.

For distribution, prototype bundling both local runtime packages into the root npm artifact with appropriate dependency and bundle metadata. Include nested runtime dependencies, declarations, resources, and licenses. Do not rely on workspace symlinks or `file:` paths existing on a consumer machine. If npm packing cannot produce a self-contained result, use a separate documented build-copy strategy before this phase can pass.

Regenerate the lockfile with the pinned npm version. Inspect resolution changes and reject unrelated dependency upgrades. Check `npm ls` and runtime `require.resolve` for local logger/profile resolution, including from inside sfprofiles. Validate deep imports and resource lookup.

**Gate:** the unchanged characterization suite passes against both published and internal implementations; clean clone install/build succeeds; `npm pack` contains all required implementation and resource files; installation of that tarball outside the checkout with development dependencies omitted can run the CLI and representative logger/profile operations without fetching the two upstream packages. No implementation may depend on ignored or untracked local files. External runtime dependencies may still come from the registry.

## Phase 3: align Node.js and npm

1. Run phase 2 on the current baseline and target Node 24 with unchanged application dependencies. Identify engine, native ABI, ESM/CommonJS, TLS, and subprocess incompatibilities separately.
2. If a dependency blocks Node 24, make the smallest compatibility upgrade as its own tested checkpoint before changing the runtime baseline. In particular, verify sfprofiles' `better-sqlite3` installation and real local database operations; mocks cannot validate a native binding.
3. Pin an exact Node 24 patch and compatible npm version using a documented local version-manager file and package-manager metadata. Align root/internal engines, Node type declarations, CI, release/promotion jobs, and both Docker recipes with the declared support policy.
4. Make Node 24 on Windows and Linux required. Add Node 26 compatibility checks and record failures without presenting that lane as production support. Add other platforms before advertising support for them.
5. Announce the minimum runtime change and contributor setup instructions. Recheck the release schedule before merging, so the target does not become stale during implementation.

**Gate:** clean installation including native modules, builds, all required tests, packed CLI checks, and container runtime checks pass on the supported matrix. No active workflow retains an unsupported Node pin unintentionally.

## Phase 4: upgrade libraries in controlled batches

For every batch: discover targets, review official release notes, add missing contract cases, change only the selected group, regenerate the lockfile, inspect the graph, run focused checks followed by required gates, and commit with before/after versions and evidence. Avoid blanket upgrades and forced audit fixes. Advance one major at a time where migrations require intermediate steps; otherwise document why a direct jump is supported.

| Order | Dependency group | Main risks and required evidence |
| --- | --- | --- |
| 1 | Compatible patches/minors and urgent security fixes | Lockfile churn, runtime support, existing contract regressions |
| 2 | Logger and filesystem utilities: chalk, strip-ansi, fs-extra, glob, rimraf, ignore | ESM-only releases, sync/async API changes, output and path semantics |
| 3 | XML, archive, config, and data utilities: XML parsers, tar, adm-zip, yaml, ajv, lodash, semver | Permission serialization, archive paths, schema validation, malformed inputs |
| 4 | Network, git, metrics, rendering: axios, simple-git, retry/queue libraries, pino, telemetry SDKs, marked | Error/retry changes, transports, process handling, formatting, module loading |
| 5 | Salesforce family: core, kit, schemas, SDR, source-tracking, packaging, apex-node, jsforce | Shared type/API compatibility, auth, retrieve/deploy payloads, polling, result semantics |
| 6 | oclif core/plugins and CLI tooling | Command discovery, help, flags, hooks, manifest generation, exit behavior |
| 7 | TypeScript, Jest/ts-jest, test helpers, Babel/SWC, type packages, commit tooling | Compatible transformer/compiler versions, module resolution, deprecated tooling |
| 8 | Remaining dependencies and container tools, including apex-parser/apexlink/process wrapper | External executables, native/platform requirements, unmaintained packages |

This order may move a prerequisite earlier when required by engines or peer dependencies, but retain separate evidence and commits. Upgrade the Salesforce family across root and sfprofiles coherently; inspect duplicate versions and peer constraints before deduplicating. A private Salesforce test helper path in `jest.config.js` is a known migration point.

Retain the current module format initially. If latest libraries require ESM, create an explicit module migration checkpoint covering CLI bootstrap, deep imports, Jest transforms, internal packages, and packed output. Do not mix a repository-wide ESM conversion into an unrelated utility update.

**Gate per batch:** required matrix passes; changed behavior is either fixed or explicitly documented and covered; no unexplained lockfile changes; remaining outdated packages have actionable entries in the dependency ledger.

## Phase 5: release readiness and ongoing maintenance

1. Run validation from a fresh clone using only committed files and the lockfile. Use `npm ci` in CI rather than an unconstrained install.
2. Build and generate the oclif manifest; inspect `npm pack --dry-run`, create the actual tarball, and install it into an isolated consumer directory. Test both CLI executable aliases and internal package resolution with production dependencies only.
3. Update full/lite container recipes to install the tested fork artifact instead of silently installing upstream sfp. Test build, CLI startup, and necessary external tool compatibility. Record immutable image/runtime inputs where practical.
4. Review inherited publish, promote, and release workflows for fork ownership, permissions, package names, registries, credentials, and artifact provenance. Establish fork-specific distribution metadata before any release; leave publishing disabled until configured.
5. Produce `maintenance/VALIDATION.md` and `maintenance/FINAL-REPORT.md` with commit ledger, platform/runtime matrix, failures, audit results, remaining blockers, and user-visible compatibility changes. Keep registry/network-dependent audits separate from offline behavioral tests.
6. Document separately authorized sandbox validation for retrieve/reconcile, build/deploy, Apex tests, package operations, and scratch-org lifecycle. Offline results do not prove Salesforce service compatibility; record this limitation until real validation is available.
7. Schedule dependency-update reviews and runtime lifecycle checks. Group low-risk updates, isolate majors, and retain the characterization gate on every change.

**Gate:** reproducible source and consumer installs, required CI and container checks, accurate documentation, and an explicit record of external validation status. Release readiness must not be confused with having published a release.

## Checkpoints, rollback, and stop conditions

Suggested commit sequence:

1. `docs: define community maintenance purpose and migration plan` (this change).
2. `test: record baseline and characterize existing behavior`.
3. `build: internalize sfp logger without behavior changes`.
4. `build: internalize sfprofiles and verify packed dependencies`.
5. `build: align supported Node and npm versions`.
6. One `chore(deps): ...` or migration commit per validated library group/major.
7. `ci: validate fork artifacts and document compatibility`.

Each implementation checkpoint records its parent, exact versions, commands, outcomes, and intentional changes. CI improvements may land earlier when needed to enforce the phase gates.

Stop a batch for unexplained contract differences, missing licenses/provenance, a non-reproducible install, native module failures, broken packed output, or new engine/peer conflicts. Reduce scope or resolve the cause before advancing. Track inherited failures narrowly; do not globally skip suites or lower assertions to conceal regressions.

Reproduce the preceding checkpoint in a separate checkout with fresh dependencies and generated output. Revert a shared change with a new commit rather than resetting shared history. Revert manifests, lockfile, runtime/CI configuration, and code together when they form one compatibility change. Historical unsupported runtimes are comparison tools, not a production rollback recommendation.

## Completion checklist

- [ ] Baseline and inherited failures are reproducible and documented.
- [ ] Offline characterization protects the CLI, logger, profiles, and representative artifact/release contracts.
- [ ] Logger and sfprofiles are committed internal dependencies with verified provenance and working consumer packaging.
- [ ] Supported Node/npm policy is consistent across development, CI, and containers.
- [ ] Direct and internal dependencies reach verified latest stable releases, or have explicit justified deferrals.
- [ ] Required tests, native-module checks, packed installation, and container checks pass from committed source.
- [ ] External Salesforce validation status and release limitations are explicit.
- [ ] README, dependency ledger, validation report, and rollback checkpoints match the delivered state.
