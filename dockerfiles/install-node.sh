#!/bin/sh
set -eu
# Validated Linux x64 runtime. Other architectures need their own checksum/gates.
test "$(dpkg --print-architecture)" = amd64
version=24.21.0
archive="node-v${version}-linux-x64.tar.xz"
curl -fsSLo "/tmp/$archive" "https://nodejs.org/dist/v${version}/$archive"
echo "fd8e59d5a511510f6a298afb548f18c7d2b1be404d8b4a27d94fbe49f56cb2d6  /tmp/$archive" | sha256sum -c -
tar -xJf "/tmp/$archive" -C /usr/local --strip-components=1
rm "/tmp/$archive"
npm install --global npm@10.9.8
test "$(node --version)" = v24.21.0
test "$(npm --version)" = 10.9.8
