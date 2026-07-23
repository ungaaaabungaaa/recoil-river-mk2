import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';

for (const filename of ['.env.local', '.env']) {
  const path = join(process.cwd(), filename);
  if (!existsSync(path)) {
    continue;
  }
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

if (!process.env.WXT_PUBLIC_CONVEX_URL?.trim()) {
  globalThis.console.log(
    '[recoil-river/plugin] Skipping WXT prepare; WXT_PUBLIC_CONVEX_URL is not set. The extension build will validate it.',
  );
  process.exit(0);
}

const command = process.platform === 'win32' ? 'wxt.cmd' : 'wxt';
const result = spawnSync(command, ['prepare'], {
  stdio: 'inherit',
});

if (result.error) {
  globalThis.console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
