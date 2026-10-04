# sfp Community Maintenance

This repository maintains the open-source sfp Community Edition CLI for teams using modular Salesforce development and artifact-based delivery. Its purpose is to preserve existing workflows while bringing the runtime, dependencies, and maintenance practices up to date in small, verifiable steps.

sfp builds Salesforce metadata and code into versioned artifacts, validates changes, and orchestrates installation and release across environments. It also provides tools for package dependencies, profiles, Apex tests, scratch-org pools, changelogs, and metrics. Keeping the same artifact through successive environments helps teams reproduce releases and understand what was deployed.

## Why this fork exists

The inherited upstream README announced the sunset of Community Edition in May 2026. This fork provides a place to maintain that code independently. It is based on [flxbl-io/sfp](https://github.com/flxbl-io/sfp), retains the upstream MIT license and attribution, and is separate from sfp pro, sfp server, and codev.

The immediate priority is compatibility and maintainability. The work is planned in this order:

1. Establish characterization tests that capture current behavior before changing dependencies.
2. Bring `@flxbl-io/sfp-logger` and `@flxbl-io/sfprofiles` into the repository as internal dependencies, preserving their behavior and licenses.
3. Upgrade Node.js and libraries incrementally, with a tested checkpoint for each dependency group or major migration.
4. Validate the packaged CLI and container builds, document compatibility changes, and establish repeatable maintenance checks.

The [comprehensive migration plan](maintenance/MIGRATION.md) defines the baseline, test coverage, package integration approach, upgrade order, acceptance gates, and rollback procedure. Baseline and offline characterization work has begun; the acceptance gates remain open. See the [baseline evidence](maintenance/BASELINE.md) and [validation ledger](maintenance/VALIDATION.md).

## Current state

The root package is still the inherited `@flxbl-io/sfp` version `39.8.0`. It maintains logger `5.0.1` and sfprofiles `5.2.2` as private local workspaces, preserving their published implementation. The runtime target is Node 24.21.0 with npm 10.9.8. Source and packaged-consumer SQLite compatibility checks pass on Windows and Linux; runtime-policy and container validation remain in progress. See the [Node 24 checkpoint](maintenance/NODE24.md) and [runtime policy](maintenance/RUNTIME.md).

Package names and upstream links in package metadata have not yet been migrated to a fork-specific distribution. Inherited publishing and promotion workflows are [disabled](maintenance/disabled-workflows/README.md). Installing `@flxbl-io/sfp` from npm or using upstream container images does not install this fork. No fork release has been established.

## Working from source

Run these commands from the repository root, where `package.json` lives:

```sh
# Select Node 24.21.0 using .nvmrc or .node-version first.
npm install --global npm@10.9.8
npm ci
npm run build --workspaces
npm run build
node ./bin/run --help
```

Use the committed lockfile to reproduce dependency resolution. Historical Node 20/22 results and the old Node 24 native-install failure are recorded in the baseline. The focused better-sqlite3 12.1.0 checkpoint resolves native installation on Node 24.21.0. Node 26 is a diagnostic lane outside the declared support policy.

Run the existing Jest suite with:

```sh
npm test -- --runInBand
```

For guarded offline validation after building, run:

```sh
npm run test:offline-guard
npm run test:characterization
npm run test:cli
npm run test:mutations
npm run test:offline -- --silent --verbose --coverage --detectOpenHandles
```

The runner isolates authentication/configuration and blocks network access and real subprocesses. The original failures and skips are preserved in the baseline; focused test/harness repairs now make all 193 Jest tests pass on Windows. CI runs these commands without excluding failing suites. A fresh committed checkout on Windows/Node 22.23.2 also passes all checks, including both runs of the 28-case characterization suite. A fresh Ubuntu WSL2 checkout also passes the full matrix; see maintenance/VALIDATION.md. The characterization suite does not yet cover every contract in the migration plan.

After building, `node ./bin/run <command>` runs the local CLI. To expose the local `sfp` and `sfpowerscripts` commands globally during development, run `npm link` from the repository root.

Salesforce operations require the appropriate CLI tooling, authentication, and org permissions. Local characterization tests use fixtures and mocks without a live org; live deployment validation is tracked separately in the plan.

## Repository guide

| Path | Purpose |
| --- | --- |
| `src/commands/` | CLI commands and flags |
| `src/core/`, `src/impl/` | Packaging, validation, release, and supporting implementation |
| `tests/` | Existing Jest tests and fixtures |
| `messages/`, `resources/` | Runtime messages and supporting resources |
| `command-docs/` | Checked-in command reference; verify against local CLI help |
| `maintenance/MIGRATION.md` | Ordered maintenance plan and completion criteria |
| `dockerfiles/` | Inherited full and lite container recipes |

The container recipes currently install a published sfp package. Adapting them to validate and distribute this fork is part of the plan; there is no root Dockerfile for building and testing the checkout.

## Contributing maintenance changes

Start with the migration plan and keep changes small enough to review and revert independently. Add or extend behavior coverage before changing the code it protects. Include the tested Node.js/npm versions, relevant test results, and intentional behavior changes in each change description. Record upstream failures and deferred upgrades explicitly.

Use this fork's issue tracker for maintenance work. Inherited upstream support links and release automation do not establish support or publishing arrangements for this fork.

## License and attribution

The project retains the [MIT license](LICENSE), upstream copyright notices, and [Third Party Notices](Third%20Party%20Notices.md). Internalized dependencies must retain their own licenses and provenance records.

## Maintenance artifact packaging

Logger 5.0.1 and sfprofiles 5.2.2 are maintained as private workspaces under `packages/`.
Build with `npm run build`, generate the manifest with `npm run manifest`, and
create an artifact with `npm run pack:maintenance`. The staging pack bundles
the locked runtime graph for reproducible consumers; bare workspace `npm pack`
is not the validated distribution path. See [packaging details](maintenance/PACKAGING.md)
and [validation status](maintenance/VALIDATION.md). Both internal packages pass fresh committed-source validation on Windows and Linux, and the same Windows-built artifact passes isolated consumer checks on both platforms. Runtime alignment, dependency upgrades and release-readiness gates remain open.
