/**
 * CONTRAST AUDIT — runs in CI.
 * Verifies every foreground/background pair the design system permits.
 * Exits non-zero on a violation. AX-01/02/03 are enforced here, not remembered.
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/tokens/tokens.ts', import.meta.url), 'utf8');
const hex = (name) => {
  const m = src.match(new RegExp(`${name}:\\s*'(#[0-9A-Fa-f]{6})'`));
  if (!m) throw new Error(`token not found: ${name}`);
  return m[1];
};

const P = {
  terracotta: hex('terracotta'),
  forest: hex('forest'),
  cream: hex('cream'),
  charcoal: hex('charcoal'),
  gold: hex('gold'),
  charcoalMuted: hex('charcoalMuted'),
  charcoalSubtle: hex('charcoalSubtle'),
  creamRaised: hex('creamRaised'),
};

const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// name, fg, bg, required ratio, context
const CHECKS = [
  ['body text', P.charcoal, P.cream, 4.5, 'normal'],
  ['body text on raised card', P.charcoal, P.creamRaised, 4.5, 'normal'],
  ['secondary text', P.charcoalMuted, P.cream, 4.5, 'normal'],
  ['link (forest)', P.forest, P.cream, 4.5, 'normal'],
  ['focus ring', P.forest, P.cream, 3.0, 'ui'],
  ['PRIMARY CTA — charcoal/cream [D-04a]', P.cream, P.charcoal, 4.5, 'normal'],
  ['forest CTA', P.cream, P.forest, 4.5, 'normal'],
  ['terracotta CTA (LARGE only)', P.cream, P.terracotta, 3.0, 'large'],
  ['placeholder (large only)', P.charcoalSubtle, P.cream, 3.0, 'large'],
];

// Pairs that MUST fail — proving the guardrails are real, not decorative.
const MUST_FAIL = [
  ['gold as body text', P.gold, P.cream, 4.5],
  ['terracotta as body text [AX-01]', P.terracotta, P.cream, 4.5],
];

let bad = 0;
console.log('\n  CONTRAST AUDIT — WCAG 2.2 AA\n  ' + '─'.repeat(62));
for (const [name, fg, bg, req, ctx] of CHECKS) {
  const r = ratio(fg, bg);
  const ok = r >= req;
  if (!ok) bad++;
  console.log(
    `  ${ok ? '✓' : '✗'} ${name.padEnd(40)} ${r.toFixed(2).padStart(6)}:1  (need ${req}, ${ctx})`
  );
}
console.log('  ' + '─'.repeat(62));
console.log('  Guardrails — these MUST fail, and are therefore forbidden as text:');
for (const [name, fg, bg, req] of MUST_FAIL) {
  const r = ratio(fg, bg);
  const correctlyForbidden = r < req;
  if (!correctlyForbidden) {
    bad++;
    console.log(`  ✗ ${name} unexpectedly PASSES — guardrail is stale`);
  } else {
    console.log(`  ✓ ${name.padEnd(40)} ${r.toFixed(2).padStart(6)}:1  correctly forbidden`);
  }
}
console.log('  ' + '─'.repeat(62));

if (bad) {
  console.error(`\n  FAILED — ${bad} contrast violation(s).\n`);
  process.exit(1);
}
console.log('  PASS — all permitted pairs meet WCAG 2.2 AA.\n');
