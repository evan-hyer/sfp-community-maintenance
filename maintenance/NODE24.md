# Node 24 compatibility checkpoint

Native compatibility validated, 2026-09-26. Phase 2 is accepted at `d06c850c`;
full Node 24 production support still requires the remaining runtime gates.

The [official release index](https://nodejs.org/dist/index.json) identifies
Node 24.21.0 as the current 24 LTS patch, bundled with npm 11.19.0. The Windows
archive SHA256 matches [official checksums](https://nodejs.org/dist/v24.21.0/SHASUMS256.txt):
`158f7685b44de51f6c0df1d153526cbcd3e1bc739a8dfc607721cef75de9e541`.
The existing extracted copy was incomplete; re-extraction restored npm.
Compatibility testing initially retains npm 10.9.8 to separate native/runtime
behavior from package-manager changes.

A fresh Windows install of the unchanged internalized dependency graph on
Node 24.21.0 fails at better-sqlite3 11.5.0: no matching prebuilt binary and no
local Visual Studio C++ toolchain. This reproduces the older 24.12.0 diagnostic;
it does not establish that a source build fails on a correctly equipped host.

## Focused dependency change

Upgrade only better-sqlite3 11.5.0 to 12.1.0. The lockfile comparison preserves
every other package version and integrity. Root and sfprofiles engine floors
move to Node 20 because this dependency drops Node 18; the production runtime
policy will be aligned separately after platform gates pass.

[12.0.0](https://github.com/WiseLibs/better-sqlite3/releases/tag/v12.0.0)
introduces Node 24 support but lacks final ABI 137 binaries.
[12.1.0](https://github.com/WiseLibs/better-sqlite3/releases/tag/v12.1.0)
updates node-abi and provides ABI 137 Windows/Linux x64 binaries. This is a
minimal compatibility step, not the final library modernization target.

Reviewed intervening releases update SQLite through 3.49.2, add missing error
codes, adjust prebuild environments and reject Promise-returning transactions
([11.10.0 notes](https://github.com/WiseLibs/better-sqlite3/releases/tag/v11.10.0)).
The sfprofiles cache uses synchronous prepare/run/all calls and no transaction
callback. Its implementation remains byte-for-byte unchanged.

A new offline contract exercises the real cache: missing keys, JSON false/zero,
Unicode, replacement, parameterized keys and persistence across database
connections. It passes against 11.5.0 on Node 22 before the upgrade. The first
main-workspace attempt exposed a missing native binding; rebuilding 11.5.0
restored it and all 29 contracts passed. Earlier clean/consumer results are
unaffected. Consumer validation also checks the locked SQLite version and actual
cache operations, in addition to a direct SQL query.

## Source validation

Node 22.23.2 Windows regression validation passes install/build, 29 contracts,
11 guard probes, 3 mutation probes, 4 CLI tests and all 193 Jest tests in 40 suites.
Node 24.21.0 Windows and Linux both pass clean dependency installation with scripts
enabled, build, two 29-contract runs, guard/mutation/CLI checks and all 193 Jest
tests with zero skips. Linux additionally runs both workspace syntax checks.
These runs apply the focused candidate files to the phase-2 validation checkouts;
committed-source reproduction follows the checkpoint commit.

## Packaged consumer validation

The same Windows-built tarball passes production consumer upgrade installation
on Windows and Ubuntu WSL2 with Node 24.21.0/npm 10.9.8. Lifecycle scripts are
enabled and development dependencies omitted. Both platforms pass original
implementation/resource hashes, shared logger identity, locked dependencies,
profile merge, real native SQLite/cache operations, four guarded CLI checks and
both executable aliases. Existing isolated consumers were upgraded because of
limited disk space; these are not fresh-prefix installation results.

See [Windows evidence](evidence/sqlite-windows-checkpoint.json) and
[Linux evidence](evidence/sqlite-linux-checkpoint.json), including the shared
artifact SHA512. Source dependency installations were fresh on both platforms.

## Pending gates

- Fresh committed-source reproduction of this compatibility checkpoint.
- Exact runtime/npm policy, CI, Node 26 compatibility lane and container checks.
