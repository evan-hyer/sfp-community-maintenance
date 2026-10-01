# Controlled dependency batches

## Batch 1: `tmp` path validation

- Direct runtime dependency: `tmp` 0.2.5 → 0.2.7. The root manifest pins 0.2.7 exactly; the lockfile changes only that package entry and its root declaration. Bundled transitive copies are outside this batch.
- Reason: the upstream [path traversal advisory](https://github.com/raszi/node-tmp/security/advisories/GHSA-ph9p-34f9-6g65) affects earlier releases including 0.2.5; a [follow-up advisory](https://github.com/raszi/node-tmp/security/advisories/GHSA-7c78-jf6q-g5cm) identifies a non-string bypass in 0.2.6 and names 0.2.7 as patched. The [0.2.7 release](https://github.com/raszi/node-tmp/releases/tag/v0.2.7) remains the registry latest at review.
- Compatibility review: repository call sites use `dirSync({ unsafeCleanup: true })` with generated names. Both 0.2.5 and 0.2.7 pass default-directory, nested-content, repeated-cleanup behavior in a focused local probe. The 0.2.7 tarball matches the registry and lockfile SHA512. A focused 0.2.7 probe rejects string traversal and non-string `prefix`, `postfix`, and `template` values (12 cases) without creating files outside the intended directory.
- Required gate: fresh `npm ci`, build, offline contracts including the new path-validation check, Jest, packed consumer, and full container on hosted Node 24 Windows/Linux. Record the run IDs and outcome before accepting this batch.
