# Internal package distribution

Build the CLI and its command manifest, then create the consumer tarball:

```sh
npm run build
npm run manifest
npm run pack:maintenance
```

The last command writes the tarball under `.maintenance/`. An optional destination
can be passed after `--`. It does not publish anything.

The source checkout uses private npm workspaces and explicit local dependencies.
The distributed artifact bundles all locked runtime dependencies, including the
maintained packages, licenses,
provenance, declarations and their nested runtime dependencies. Consumer metadata
uses version dependencies, without workspace links or repository lifecycle scripts.

With npm 10.9.8, bare `npm pack` places the logger's nested `fs-extra` under
`packages/sfp-logger/node_modules`, while its importer is bundled under
`node_modules/@flxbl-io/sfp-logger`. That would resolve the wrong filesystem-library
version in a consumer. `maintenance/pack.cjs` first packs into a temporary tree,
materializes nested dependencies beside their bundled importers, and packs that
tree. It never changes the development links. Temporary staging is removed on
success or failure. Use this staging command for consumer artifacts.

Logger implementation bytes remain those of published 5.0.1. sfprofiles remains
the published dependency until its separate source import checkpoint. Its unchanged
installed package is already bundled to keep its logger import in the same module
tree; leaving sfprofiles external lets npm hoist it beside a second registry logger. A successful
workspace build alone does not establish consumer compatibility; validate the
actual artifact outside the checkout with development dependencies omitted.

The staged artifact includes a shrinkwrap derived from the committed lockfile,
with workspace paths translated into bundled module paths. The shrinkwrap alone did not prevent npm10 from re-resolving external dependencies
in the tested bundled artifact. Therefore the final artifact bundles the full runtime
graph from the locked installation. This trades artifact
size for reproducibility without changing source dependency ranges or versions. All direct logger importers (sfprofiles, apexlink, and the process
wrapper) are bundled alongside logger to preserve one singleton; their published
implementation and dependency versions remain unchanged.
