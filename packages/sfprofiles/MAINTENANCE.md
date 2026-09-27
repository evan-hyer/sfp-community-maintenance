# Maintained source and import history

Imported from published 5.2.2 with unchanged JavaScript, declarations and resources.
PROVENANCE.json retains original archive integrity, per-file hashes, retrieval date,
license and repository origin. The advertised GitHub repository returned HTTP404
on 2026-09-25; the archive contains no original TypeScript source.

2026-09-25 manifest adaptations: private workspace, explicit local logger dependency,
syntax-only build, removed destructive clean/compiler scripts and unused development
dependencies. Runtime versions remain unchanged. The maintained source must never
be deleted by a clean step. Root staging packaging converts local dependencies to
version metadata and includes licenses/provenance in the full runtime bundle.

2026-09-26 native compatibility change: better-sqlite3 11.5.0 → 12.1.0,
the first release with prebuilt binaries for Node 24's final ABI. The package
engine floor follows that dependency's removal of Node 18 support. All other
dependency versions and published implementation/resource bytes remain unchanged.
See ../../maintenance/NODE24.md for validation and release-note review.

2026-09-27 runtime-policy candidate: the private workspace engine declaration
aligns with the root Node 24.21.0 target. Implementation bytes are unchanged.
See ../../maintenance/RUNTIME.md for policy and remaining gates.
