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
