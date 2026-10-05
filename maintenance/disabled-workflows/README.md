# Inherited release automation (disabled)

These workflows were moved unchanged out of `.github/workflows` during phase 0.
GitHub cannot execute them here, including through reusable workflow calls.
Do not restore them until fork distribution and credentials are configured and
publication is explicitly authorized.

The inherited release workflow publishes `@flxbl-io/sfp`, creates releases, and
calls container build/promotion workflows for the `flxbl-io` namespace. Promotion
changes npm dist-tags; container workflows push/copy images and sign releases.
They assume NPM_TOKEN, GHA_TOKEN, DOCKER_USERNAME, DOCKER_SECRET/GITHUB_TOKEN,
SIGNING_SECRET and COSIGN_PASSWORD, plus GitHub deployment environments.
The milestone release-notes workflow also uses a write-capable GitHub token.
The Docker recipes install the published upstream CLI, not this checkout.

Moving these files is a reversible maintenance checkpoint; their old relative
workflow references intentionally do not resolve while disabled. Local validation
requires no publishing credentials. No package or container was published.
