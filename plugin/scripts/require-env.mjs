import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';
import {URL} from 'node:url';

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

const required = ['WXT_PUBLIC_CONVEX_URL', 'WXT_PUBLIC_WEB_URL'];

for (const name of required) {
  if (!process.env[name]?.trim()) {
    globalThis.console.error(`${name} is required to build the Recoil River extension.`);
    process.exit(1);
  }
}

function parseUrl(name, allowLocalHttp) {
  let url;
  try {
    url = new URL(process.env[name]);
  } catch {
    globalThis.console.error(`${name} must be a valid URL.`);
    process.exit(1);
  }

  const localHttp = allowLocalHttp &&
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  if (url.protocol !== 'https:' && !localHttp) {
    globalThis.console.error(`${name} must use HTTPS outside local development.`);
    process.exit(1);
  }
}

parseUrl('WXT_PUBLIC_CONVEX_URL', true);
parseUrl('WXT_PUBLIC_WEB_URL', true);
