# Controlled dependency batches

## Batch 1: `tmp` path validation

- Direct runtime dependency: `tmp` 0.2.5 → 0.2.7. The root manifest pins 0.2.7 exactly; the lockfile changes only that package entry and its root declaration. Bundled transitive copies are outside this batch.
- Reason: the upstream [path traversal advisory](https://github.com/raszi/node-tmp/security/advisories/GHSA-ph9p-34f9-6g65) affects earlier releases including 0.2.5; a [follow-up advisory](https://github.com/raszi/node-tmp/security/advisories/GHSA-7c78-jf6q-g5cm) identifies a non-string bypass in 0.2.6 and names 0.2.7 as patched. The [0.2.7 release](https://github.com/raszi/node-tmp/releases/tag/v0.2.7) remains the registry latest at review.
- Compatibility review: repository call sites use `dirSync({ unsafeCleanup: true })` with generated names. Both 0.2.5 and 0.2.7 pass default-directory, nested-content, repeated-cleanup behavior in a focused local probe. The 0.2.7 tarball matches the registry and lockfile SHA512. A focused 0.2.7 probe rejects string traversal and non-string `prefix`, `postfix`, and `template` values (12 cases) without creating files outside the intended directory.
- Required gate: fresh `npm ci`, build, offline contracts including the new path-validation check, Jest, and packed consumer passed on hosted Node 24 Windows/Linux in [review run 36794351524](https://github.com/evan-hyer/sfp-community-maintenance/actions/runs/36794351524). The [full-container run 36794348891](https://github.com/evan-hyer/sfp-community-maintenance/actions/runs/36794348891) passed. Optional Node 26 diagnostic jobs failed as expected and do not extend the support policy. Batch accepted at `99717003`.

## Batch 2: `simple-git` unsafe configuration hardening

- Direct runtime dependency: `simple-git` 3.19.1 -> 3.36.0, the latest 3.x release at review. The 4.x migration remains in the Git/network utility batch because `src/core/git/GitIdentity.ts` imports the removed `simple-git/promise` path.
- Reason: the upstream [case-insensitive `protocol.allow` advisory](https://github.com/advisories/GHSA-r275-fr43-pm7q) affects 3.19.1 and is patched in 3.32.3. The [3.36.0 release](https://github.com/steveukx/git-js/releases/tag/simple-git%403.36.0) also hardens exploitable configuration keys and task environment variables. The baseline local probe rejected lowercase `protocol.allow` but accepted uppercase `PROTOCOL.ALLOW`.
- Compatibility review: the existing Git and release contracts exercise this package's public API. A focused offline contract requires lowercase, uppercase, and mixed-case unsafe config keys to fail in the library before spawning Git. Keep the existing default import and `simple-git/promise` path until the 4.x migration.
- Required gate: the focused isolated 3.36.0 security/status probe, syntax, and diff checks pass. Clean hosted [review run 37139520514](https://github.com/evan-hyer/sfp-community-maintenance/actions/runs/37139520514) passes required Windows and Ubuntu Node 24 jobs, including source, contracts, Jest, packed consumer, and aliases; [full-container run 37139516676](https://github.com/evan-hyer/sfp-community-maintenance/actions/runs/37139516676) passes. Optional Node 26 diagnostics still fail outside the support policy. Batch accepted at `eaeb8450`.

## Batch 3: remove unused `handlebars`

- Root `handlebars` 4.7.8 is affected by the upstream [template compilation advisory](https://github.com/handlebars-lang/handlebars.js/security/advisories/GHSA-2w6w-674q-4c4q) and other advisories fixed in [4.7.9](https://github.com/handlebars-lang/handlebars.js/releases/tag/v4.7.9), the registry latest at review.
- No source, generated `lib`, workspace, test, or maintenance code imports `handlebars`. The lockfile has no dependent package other than the root declaration. Remove the unused direct dependency and bundle entry instead of carrying the package in consumers.
- Required gate: verify only `handlebars` and orphaned dependencies leave the lockfile; run clean hosted Windows/Linux Node 24 source and packed-consumer checks and the full container before accepting the batch.
