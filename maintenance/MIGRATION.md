# Community maintenance migration

Started 2026-09-20 after 16:00 America/New_York. Scope: local/offline maintenance
and publication of source to the authorized user's GitHub fork; no npm releases
and no live Salesforce operations.

## Provenance

- Upstream: https://github.com/flxbl-io/sfp (MIT; original LICENSE retained).
- Baseline: `3838dd0f6dd72da9ab11a93693758fbaec55ec90`.
- GitHub reports archived; README announces May 2026 sunset, GitHub archive date
  is April 27, 2026. This is Community Edition, distinct from the continuing pro CLI.
- Fork: https://github.com/evan-hyer/sfp-community-maintenance.
- Existing Git Credential Manager authentication verified against `/user`.
- No applicable AGENTS.md found in C:\, C:\Repos, or the upstream checkout.

## Phases and rollback checkpoints

1. Preserve upstream as `maintenance-upstream`; install the original lockfile with
   lifecycle scripts disabled, record build/unit/CLI behavior, and add offline
   characterization coverage before dependency changes. Record pre-existing failures.
2. Identify logger/profile dependencies from the manifest and npm registry metadata.
   Preserve licensed source and exact distribution provenance in local packages;
   prove behavior against the baseline contracts before upgrades.
3. Adopt supported Node 24 LTS, checked against nodejs.org release schedule and
   distribution index. Upgrade compatible dependencies in separate commits; treat
   major Salesforce API migrations separately and require evidence before adopting.
4. Run clean install, build, static checks, upstream unit tests, fixture integration,
   and CLI smoke tests. Block unexpected regressions. Record audit limitations.
5. Replace inherited release automation with offline validation, review staged
   changes for secrets, push without force, and save final report and commit ledger.

Each phase is a commit/checkpoint. Roll back in a separate checkout at the preceding
commit and run `npm ci`; revert published commits instead of resetting shared history.
Never reuse generated lib/node_modules across checkpoints. Do not roll back to the
old runtime for production; baseline exists for comparison only.

## Validation boundaries

Tests must use mocks/local fixtures and block outbound requests. No authenticated
Salesforce org is used. Org deployment, scratch-org lifecycle, packaging services,
and telemetry provider delivery require separately authorized external validation.
Dependency audits identify known advisories, not proof of security. Deferred upgrades
and inherited failures will be enumerated in VALIDATION.md and FINAL-REPORT.md.
