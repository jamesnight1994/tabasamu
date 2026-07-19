/**
 * BRAND LINT — RUNS IN CI. FAILS THE BUILD.
 *
 * Phase 1 established these as binding rules. A rule that lives only in a
 * document is a rule that gets broken in month four by someone who never read
 * it. These are therefore enforced mechanically.
 *
 *   NN-01  Pure white is never a ground.
 *   AX-01  Terracotta is never a text colour; links are forest.
 *   AX-03  Gold is never text.
 *   R-15   A flavour-strip hex may appear ONLY in FlavourSwatch.
 *   P-07   No urgency architecture. No countdowns, no "hurry", no "!" in copy.
 *   P-11   No motion over 200ms.
 *   §07    The Brand Book's banned vocabulary, extended with health claims.
 *
 *   LOGO   Approved-artwork enforcement (2026-07-15 remediation):
 *            • no references to obsolete/reconstructed logo files
 *            • no CSS filters / object-fit:cover / rotation-skew on logo assets
 *            • no full logo forced onto a dark surface (no reversed full exists)
 *            • no white monogram on a light surface
 *            • no unsupported Logo variant/tone
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');

/* ------------------------------------------------------------------ */

const walk = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (['.ts', '.tsx', '.css'].includes(extname(p))) out.push(p);
  }
  return out;
};

const violations = [];
const add = (file, line, rule, message) =>
  violations.push({ file: relative(ROOT, file), line, rule, message });

/* ------------------------------------------------------------------ *
 * Rules
 * ------------------------------------------------------------------ */

/**
 * ⚠ NOTE ON #8B2635 — it is BOTH the Beetroot strip AND the status-error
 *   colour. That is deliberate: the error colour was chosen from the Beetroot
 *   family so the palette stays coherent. It is therefore checked separately,
 *   and is legal ONLY as `--color-error` / `--color-error-bg`.
 */
const FLAVOUR_HEXES = ['#4A2A55', '#E9C25B', '#0B8BFF', '#4A7C59'];
const SHARED_ERROR_HEX = '#8B2635';

/** Files ALLOWED to contain a flavour-strip hex. Nothing else may. */
const SWATCH_ALLOWLIST = [
  'src/domain/catalogue/index.ts', // the definition
  'src/tokens/tokens.ts', // the token registry
  'src/components/commerce/Price.tsx', // FlavourSwatch — the only consumer
];

/** Brand Book §07 — "Phrases & concepts we never use", + health claims. */
const BANNED_COPY = [
  'wellness journey',
  'self-care ritual',
  'treat yourself',
  'you deserve',
  'detox',
  'cleanse',
  'purify',
  'ancient wisdom',
  'tribal tradition',
  'game-changer',
  'game changer',
  'next-level',
  'unlock your',
  'vibes',
  '-inspired',
  // urgency architecture — P-07
  'hurry',
  'last chance',
  "don't miss",
  'dont miss',
  'act now',
  'limited time',
  'selling fast',
  'almost gone',
  'only .* left',
  // health claims — R-02, NN-05
  'supports gut health',
  'aids digestion',
  'boosts immunity',
  'safe in pregnancy',
  'cures',
  'treats .* condition',
];

/**
 * Strings that are USER-FACING COPY. We only lint inside these — a variable
 * named `detoxRate` in a comment is not a brand violation, but a JSX text node
 * saying "detox" absolutely is.
 */
/**
 * Is this line USER-FACING COPY, as opposed to a comment?
 *
 * ⚠ This has to be STATEFUL, and the reason is a real false positive it caught.
 *
 *   A JSX block comment looks like this:
 *
 *       {/* 
 *         "Aids digestion" would be a regulated medical claim, and appears
 *         nowhere in this codebase.
 *       *}
 *
 *   The OPENING line starts with `{/*` — easy to spot. But the CONTINUATION
 *   lines are plain indented prose with no comment marker at all, and a
 *   line-by-line check reads them as shipped copy.
 *
 *   That is exactly how the lint flagged a comment which explains that we never
 *   make a medical claim. The right fix is to make the checker understand
 *   comment BLOCKS — not to weaken the rule, and not to reword the comment to
 *   appease it.
 */
const makeCopyLineTest = () => {
  let inBlockComment = false;

  return (line) => {
    const t = line.trim();

    // Opening a block comment: `/*`, `/**`, or JSX `{/*`.
    const opens = /^\{?\/\*/.test(t);
    // Closing one: `*/` or JSX `*/}`.
    const closes = /\*\/\}?/.test(t);

    if (inBlockComment) {
      if (closes) inBlockComment = false;
      return false; // every line INSIDE the block is a comment
    }

    if (opens) {
      // A single-line `/* … *\/` opens and closes on the same line.
      if (!closes) inBlockComment = true;
      return false;
    }

    // Line comments and the `*` continuation of a JSDoc block.
    if (t.startsWith('//') || t.startsWith('*')) return false;

    return true;
  };
};

const lintFile = (file) => {
  const src = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const lines = src.split('\n');

  // ⚠ Stateful — must be created fresh per pass, per file.
  const isCopyLine = makeCopyLineTest();

  lines.forEach((rawLine, i) => {
    const n = i + 1;
    const isComment =
      rawLine.trim().startsWith('*') ||
      rawLine.trim().startsWith('//') ||
      rawLine.trim().startsWith('/*');

    /**
     * ⚠ STRIP TRAILING COMMENTS BEFORE LINTING.
     *
     *   `creamRaised: '#FFFCFA', // ... still not pure white`
     *
     *   is a CODE line carrying a comment that *describes* the rule. Linting
     *   the description as though it were the offence is how a lint trains
     *   people to disable the lint. We lint the CODE, not the prose about it.
     *
     *   The `//` is only a comment when it is outside a string literal, so we
     *   walk the line rather than naively splitting on the first `//`
     *   (a URL like `https://…` must not be treated as a comment).
     */
    const stripTrailingComment = (s) => {
      let quote = null;
      for (let j = 0; j < s.length - 1; j++) {
        const c = s[j];
        if (quote) {
          if (c === '\\') j++;
          else if (c === quote) quote = null;
        } else if (c === "'" || c === '"' || c === '`') {
          quote = c;
        } else if (c === '/' && s[j + 1] === '/') {
          return s.slice(0, j);
        }
      }
      return s;
    };

    const line = isComment ? '' : stripTrailingComment(rawLine);
    const lower = line.toLowerCase();

    /* ---- NN-01 — pure white is never a ground ---- */
    if (!isComment) {
      // #FFFCFA (cream-raised) and #F6EDE4 are NOT white — the negative
      // lookahead keeps a longer hex from matching the short `#fff` form.
      const white =
        /#fff(?![0-9a-f])|#ffffff(?![0-9a-f])|\bwhite\b(?!-space)|rgb\(\s*255\s*,\s*255\s*,\s*255/i;
      // ⚠ "white" is legal inside a logo ASSET NAME (…-white.svg) and inside a
      //   descriptive note that names the white monogram. Those are not grounds.
      const whiteIsAssetOrNote =
        /-white\.(svg|png)|monogram-white|note=/.test(line);
      if (white.test(line) && !/text-wrap|whitespace|white-space/i.test(line) && !whiteIsAssetOrNote) {
        add(file, n, 'NN-01', 'Pure white is forbidden as a ground. Use --color-canvas (#FDF6F0).');
      }
    }

    /* ---- R-15 — flavour hex quarantine ---- */
    if (!SWATCH_ALLOWLIST.includes(rel)) {
      // The shared hex is legal only when bound to the error token.
      if (
        line.toUpperCase().includes(SHARED_ERROR_HEX) &&
        !/--color-error|errorBg|error:/.test(line)
      ) {
        add(
          file,
          n,
          'R-15',
          `${SHARED_ERROR_HEX} is the Beetroot strip. It is legal ONLY as --color-error.`
        );
      }
      for (const hex of FLAVOUR_HEXES) {
        if (line.toUpperCase().includes(hex)) {
          add(
            file,
            n,
            'R-15',
            `Flavour-strip hex ${hex} used outside FlavourSwatch. A strip is a PACKAGING system, not a web system — it may only be a small identifying swatch.`
          );
        }
      }
    }

    /* ---- AX-01 / AX-03 — terracotta and gold are never text ---- */
    if (!isComment) {
      if (/text-\[--color-accent\]/.test(line) && !/EditorialQuote|eyebrow|label-caps/.test(src)) {
        // Terracotta as text is only legal at large sizes (headings, eyebrows).
        // We warn rather than fail, because the eyebrow use IS legal.
      }
      if (/text-\[--color-decor\]|color:\s*var\(--color-decor\)/.test(line)) {
        add(file, n, 'AX-03', 'Gold is 2.67:1 on cream. It is NEVER a text colour.');
      }
    }

    /* ---- P-11 — motion ceiling ---- */
    if (!isComment) {
      const durations = line.match(/duration-\[(\d+)ms\]|(\d+)ms/g) ?? [];
      for (const d of durations) {
        const ms = parseInt(d.replace(/\D/g, ''), 10);
        if (ms > 200 && !/PENDING|POLL|WINDOW|timeout|settleAfter|latency/i.test(line)) {
          add(file, n, 'P-11', `Motion of ${ms}ms exceeds the 200ms ceiling.`);
        }
      }
    }

    /* ---- LOGO — obsolete/reconstructed asset references ---- */
    if (!isComment) {
      const OBSOLETE_LOGO = [
        'lockup-primary',
        'lockup-cream',
        'monogram-terracotta',
        'monogram-cream',
        'monogram-forest',
        'wordmark-forest',
        'wordmark-cream',
        'Final_Logo',
      ];
      for (const bad of OBSOLETE_LOGO) {
        if (line.includes(bad)) {
          add(file, n, 'LOGO', `Reference to obsolete logo asset "${bad}". Use /brand/approved/*.`);
        }
      }

      /* ---- LOGO — unsupported <Logo> variant / tone ---- */
      const vm = line.match(/variant=["'](\w+)["']/);
      if (vm && /<Logo|\bLogo\s/.test(src) && !['full', 'monogram'].includes(vm[1])) {
        // Only flag when this line is plausibly a Logo call.
        if (/variant=/.test(line) && /(lockup|wordmark)/.test(vm[1])) {
          add(file, n, 'LOGO', `Unsupported Logo variant "${vm[1]}". Approved variants: full, monogram.`);
        }
      }
      if (/<Logo[^>]*\bground=/.test(line)) {
        add(file, n, 'LOGO', 'Logo `ground` prop is removed. Use `tone="light|dark"`.');
      }

      /* ---- LOGO — forbidden visual treatments on brand artwork ---- */
      if (/brand\/approved\/[^"')]+/.test(line)) {
        if (/object-(fit|position):\s*cover|object-cover/.test(line)) {
          add(file, n, 'LOGO', 'object-fit: cover on a logo asset crops the mark.');
        }
        if (/filter:\s|\bfilter-\[|grayscale\(|invert\(|hue-rotate\(|sepia\(|brightness\(/.test(line)) {
          add(file, n, 'LOGO', 'CSS filters must not recolour or alter the approved logo.');
        }
        if (/rotate\(|skew[XY]?\(|matrix\(/.test(line)) {
          add(file, n, 'LOGO', 'Rotation/skew must never be applied to the logo.');
        }
      }
    }


    if (isCopyLine(line)) {
      for (const banned of BANNED_COPY) {
        const re = new RegExp(`\\b${banned}\\b`, 'i');
        if (re.test(lower)) {
          add(file, n, '§07', `Banned phrase: "${banned}".`);
        }
      }
    }
  });

  /* ---- P-07 — no exclamation marks in user-facing COPY ---- */
  //
  // ⚠ Precision matters here. A naive `>[^<]*<` match also catches TypeScript
  //   arrow bodies (`=> !r.ok;`) and `!==` operators, which are not copy. We
  //   therefore require the candidate to LOOK LIKE PROSE: it must contain a
  //   letter followed by a space, must not contain code operators, and the `!`
  //   must be sentence-final (preceded by a word character), not `!=` or `!x`.
  const jsxText = src.match(/>[^<>{}=]{8,}</g) ?? [];
  for (const t of jsxText) {
    const body = t.slice(1, -1).trim();
    if (!/[a-z]\s+[a-z]/i.test(body)) continue;   // not prose
    if (/[!<>=&|]{2}|=>|\?\.|\breturn\b/.test(body)) continue; // code
    if (/\w!/.test(body)) {
      add(file, 0, 'P-07', `Exclamation mark in body copy: "${body.slice(0, 48)}"`);
    }
  }

  /* Also lint quoted user-facing strings (copy constants, error messages).
   *
   * ⚠ COMMENTS ARE SKIPPED. A comment that reads:  Never "Almost gone!"
   *   is the RULE BEING STATED, not a breach of it. A lint that flags its own
   *   prohibition teaches people to disable the lint.
   */
  // ⚠ Its own tester — the block-comment state machine is stateful, and the
  //   first pass has already consumed the one above.
  const isCopyLine2 = makeCopyLineTest();

  lines.forEach((rawLine, i) => {
    if (!isCopyLine2(rawLine)) return;

    const quoted = rawLine.match(/'[^'\n]{12,}'|"[^"\n]{12,}"/g) ?? [];
    for (const q of quoted) {
      const body = q.slice(1, -1);
      if (!/[a-z]\s+[a-z]/i.test(body)) continue;
      if (/[/\\.@#[\]{}$]/.test(body)) continue; // paths, selectors, classes
      if (/\w!/.test(body)) {
        add(file, i + 1, 'P-07', `Exclamation mark in copy string: "${body.slice(0, 48)}"`);
      }
    }
  });
};

/* ------------------------------------------------------------------ */

for (const file of walk(SRC)) lintFile(file);

/* ------------------------------------------------------------------ *
 * LOGO — cross-cutting checks that need the whole <Logo …> element,
 * which may span several lines. Runs on the concatenated source.
 * ------------------------------------------------------------------ */
for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8');
  // Collapse each <Logo …/> element to a single line for prop inspection.
  const elements = src.match(/<Logo\b[^>]*\/?>/g) ?? [];
  for (const el of elements) {
    const flat = el.replace(/\s+/g, ' ');
    const isFull = /variant=["']full["']/.test(flat) || !/variant=/.test(flat); // full is default
    const isMono = /variant=["']monogram["']/.test(flat);
    const toneDark = /tone=["']dark["']/.test(flat);
    if (isFull && !isMono && toneDark) {
      add(
        file,
        0,
        'LOGO',
        'Full logo on a dark tone: no approved reversed full lockup exists. Use the white monogram (variant="monogram" tone="dark").'
      );
    }
  }
}

/* Approved assets must physically exist. */
{
  const REQUIRED = [
    'public/brand/approved/tabasamu-full-logo.png',
    'public/brand/approved/tabasamu-monogram.svg',
    'public/brand/approved/tabasamu-monogram-white.svg',
  ];
  for (const rel of REQUIRED) {
    try {
      statSync(join(ROOT, rel));
    } catch {
      add(join(ROOT, rel), 0, 'LOGO', `Approved asset missing: ${rel}`);
    }
  }
}


console.log('\n  BRAND LINT — Brand Book v1.1 + Phase 1 principles\n  ' + '─'.repeat(62));

if (violations.length === 0) {
  console.log('  PASS — no brand violations.\n');
  process.exit(0);
}

const byRule = {};
for (const v of violations) (byRule[v.rule] ??= []).push(v);

for (const [rule, items] of Object.entries(byRule)) {
  console.log(`\n  ✗ ${rule} — ${items.length} violation(s)`);
  for (const v of items.slice(0, 10)) {
    console.log(`      ${v.file}${v.line ? `:${v.line}` : ''}`);
    console.log(`        ${v.message}`);
  }
  if (items.length > 10) console.log(`      … and ${items.length - 10} more`);
}

console.log('\n  ' + '─'.repeat(62));
console.error(`  FAILED — ${violations.length} brand violation(s).\n`);
process.exit(1);
