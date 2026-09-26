# Review of pre-existing vendor drafts

Read-only audit on 2026-09-21; no draft or dependency configuration changed.
See [machine-readable evidence](evidence/published-draft-audit.json).

Fetched the exact tarball URLs in the committed lockfile, verified each archive's
SHA-512 against both the lockfile and draft provenance, then compared every
published file's SHA-256 with the provenance and draft bytes. Logger 5.0.1 has
6 published files; sfprofiles 5.2.2 has 136. All files match, with no missing or
modified published files. MIT licenses and copyright notices are present.

These results make the drafts useful candidates for a later import, not accepted
internal dependencies. Their JavaScript/declarations are the published source
form currently available locally. The provenance's older claim that the upstream
repositories are unavailable was not independently rechecked by this file audit.

Before importing:

- Replace inherited build scripts: both clean commands delete `lib`, which holds
  the only implementation in these drafts. Neither includes the TypeScript source
  or `tsconfig.json` required to rebuild it.
- Add narrowly scoped ignore exceptions: the root `lib` rule currently hides
  both implementations from Git.
- Make packages private, preserve names and deep paths, and establish explicit
  local resolution with one shared logger instance.
- Verify consumer packaging. The root currently has no workspaces, its `files`
  list excludes `packages`, and its dependencies still resolve to published npm
  packages. Draft presence does not change what the CLI imports.
- Reuse the same published-package contracts against the imported implementations;
  do not update library versions in the import checkpoint.
- Retain exact tarball integrity, per-file hashes, licenses, retrieval dates and
  a separate modification history when package manifests are adapted.

Phase-1 Linux validation remains a prerequisite under `MIGRATION.md`. No workspace
links, bundling prototype, vendored source commit, or packed-consumer result is
claimed by this audit.

## Subsequent logger import (2026-09-25)

The Linux phase-1 gate subsequently passed. Logger is now imported with its
original non-manifest bytes and a private workspace manifest. The advertised
GitHub repositories for logger and sfprofiles returned HTTP404 on this date.
See packages/sfp-logger/MAINTENANCE.md, PACKAGING.md and VALIDATION.md for current
import changes and consumer evidence; the audit above records the original drafts.
