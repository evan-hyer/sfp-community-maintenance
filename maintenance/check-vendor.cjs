'use strict';
// Published JS is maintained source, so build means syntax validation, not deletion.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
function check(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) check(file);
    else if (entry.name.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true, timeout: 30000 });
      if (result.error || result.status !== 0) throw result.error || new Error(result.stderr);
    }
  }
}
check(path.join(process.cwd(), 'lib'));
