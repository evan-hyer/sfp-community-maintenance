#!/bin/sh
set -eu
# Match puppeteer@24.10.0, pinned by sfdx-browserforce-plugin@5.0.0.
# Hashes recorded from the official Chrome for Testing HTTPS downloads.
test "$(dpkg --print-architecture)" = amd64
version=137.0.7151.55
base="https://storage.googleapis.com/chrome-for-testing-public/$version/linux64"
curl -fsSLo /tmp/chrome.zip "$base/chrome-linux64.zip"
curl -fsSLo /tmp/chromedriver.zip "$base/chromedriver-linux64.zip"
echo 'ffedd41a261f26e2e60e5d1692e0955c292caffafd15865344d21b845554a3d4  /tmp/chrome.zip' | sha256sum -c -
echo '57b44a6b5193511898eb1c26b3eae8378a763a6d09e7687b801a799d58e7e90d  /tmp/chromedriver.zip' | sha256sum -c -
mkdir -p /opt/chrome-for-testing
unzip -q /tmp/chrome.zip -d /opt/chrome-for-testing
unzip -q /tmp/chromedriver.zip -d /opt/chrome-for-testing
ln -s /opt/chrome-for-testing/chromedriver-linux64/chromedriver /usr/local/bin/chromedriver
for command in chromium chromium-browser google-chrome; do
    ln -s /opt/chrome-for-testing/chrome-linux64/chrome "/usr/local/bin/$command"
done
rm /tmp/chrome.zip /tmp/chromedriver.zip
chromium --version
chromedriver --version
