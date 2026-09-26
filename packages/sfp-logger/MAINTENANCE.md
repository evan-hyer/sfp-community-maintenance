# Maintained source and import history

Imported from the exact published 5.0.1 archive; see PROVENANCE.json for original
file hashes, integrity, retrieval date, repository origin and license.

2026-09-25: the advertised GitHub repository returned HTTP 404 to an unauthenticated
request. Original TypeScript is not present in the archive. The published JavaScript
and declarations are the maintained source; no TypeScript rebuild is claimed.

Local manifest changes: private workspace, no standalone publish configuration,
syntax-only build, and no inherited clean/compiler scripts or unused development
tooling. Runtime dependencies and implementation bytes are unchanged. Added explicit
license/provenance/maintenance files to the package list. The root bundles this
package for consumers and keeps the original import name and deep paths.

Consumer artifact: run npm run build, npm run manifest, then npm run pack:maintenance.
The staging pack materializes nested runtime dependencies at their consumer paths,
removes workspace-only metadata and replaces bundled file references with versions.
Bare npm pack is diagnostic only: npm10 misplaces nested workspace dependencies.
