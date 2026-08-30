/**
 * SECRET SCANNER — RUNS AFTER `next build`. FAILS THE BUILD.
 *
 * ⚠ NN-03: NO SECRET EVER ENTERS THE FRONTEND BUNDLE.
 *
 * This scans the BUILT output for credential-shaped strings. It is the
 * mechanical backstop behind `serverEnv()`: if someone imports a server module
 * into a client component, the secret is inlined into the JS bundle and shipped
 * to every visitor. That mistake is silent, common, and catastrophic — an
 * M-PESA consumer secret in a public bundle is a live financial exposure.
 *
 * Verifying it by eye does not scale. So we grep the artefact.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BUILD = join(ROOT, '.next');

if (!existsSync(BUILD)) {
  console.error('\n  No .next build found. Run `npm run build` first.\n');
  process.exit(1);
}

/** Server-only env var NAMES. None may appear in a client chunk. */
const SERVER_ONLY = [
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET',
  'MPESA_PASSKEY',
  'MPESA_SHORTCODE',
  'CARD_SECRET_KEY',
  'CARD_WEBHOOK_SECRET',
  'EMAIL_API_KEY',
  'EMAIL_PASS',
  'SMS_API_KEY',
  'API_SERVICE_TOKEN',
  'DATABASE_URL',
  'SESSION_SECRET',
];

/** Credential SHAPES — catches a real key even if the var name was renamed. */
const SHAPES = [
  { name: 'Stripe live secret', re: /sk_live_[A-Za-z0-9]{16,}/ },
  { name: 'Stripe test secret', re: /sk_test_[A-Za-z0-9]{16,}/ },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private key block', re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: 'Bearer token', re: /Bearer\s+[A-Za-z0-9_\-.]{24,}/ },
  { name: 'Mongo/Postgres URI with password', re: /(mongodb|postgres(ql)?):\/\/[^:]+:[^@]+@/ },
  { name: 'Generic long hex secret', re: /['"][a-f0-9]{48,}['"]/i },
];

/** The CLIENT bundle. Server chunks legitimately reference server env names. */
const CLIENT_DIRS = [join(BUILD, 'static')];

const walk = (dir) => {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (['.js', '.mjs', '.json', '.css'].includes(extname(p))) out.push(p);
  }
  return out;
};

const files = CLIENT_DIRS.flatMap(walk);
const hits = [];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const rel = file.replace(ROOT, '');

  for (const name of SERVER_ONLY) {
    // A bare mention of the NAME is enough to investigate — Next inlines
    // `process.env.X` at build time, so the name appearing in a client chunk
    // means the VALUE was very likely inlined with it.
    if (src.includes(name)) {
      hits.push({ file: rel, kind: 'server env name in client bundle', detail: name });
    }
  }

  for (const shape of SHAPES) {
    const m = src.match(shape.re);
    if (m) {
      hits.push({
        file: rel,
        kind: 'credential-shaped string',
        detail: `${shape.name}: ${m[0].slice(0, 12)}…`,
      });
    }
  }
}

console.log('\n  SECRET SCAN — client bundle\n  ' + '─'.repeat(62));
console.log(`  Scanned ${files.length} client asset(s) in .next/static`);

if (hits.length === 0) {
  console.log('  PASS — no secrets found in the client bundle. [NN-03]\n');
  process.exit(0);
}

for (const h of hits) {
  console.log(`\n  ✗ ${h.kind}`);
  console.log(`      ${h.file}`);
  console.log(`      ${h.detail}`);
}
console.error(`\n  FAILED — ${hits.length} potential secret(s) in the CLIENT bundle. [NN-03]\n`);
process.exit(1);
