import { describe, it, expect } from 'vitest';

/**
 * PHASE 9 — QA, SECURITY & RELEASE READINESS
 *
 * Executable guards for the two hardening fixes made in Phase 9:
 *   §1  JSON-LD is serialised through the breakout-safe `jsonLdString`, so a
 *       `<` in any schema value cannot close the inline <script> early. [S-3]
 *   §2  the security-header set (CSP + friends) is present and correctly
 *       scoped, and `X-Powered-By` is suppressed. [S-1, S-2]
 *
 * These lock the fixes in: a regression (a bare `JSON.stringify`, a dropped
 * CSP directive, a re-enabled powered-by banner) fails the suite.
 */

import { jsonLdString } from '../../src/lib/seo/structured-data';

/* ================================================================== *
 * §1 — JSON-LD BREAKOUT ESCAPE  [S-3]
 * ================================================================== */

describe('Phase 9 · JSON-LD is breakout-safe', () => {
  it('escapes `<` so a value cannot close the <script> element early', () => {
    // A hostile-looking value that, unescaped, would inject markup.
    const out = jsonLdString({ name: 'Tabasamu </script><script>alert(1)' });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c'); // the escaped form is present
  });

  it('escapes every `<`, not just the first', () => {
    const out = jsonLdString({ a: '<', b: '<<', c: 'x<y<z' });
    expect(out.includes('<')).toBe(false);
  });

  it('returns an empty string for null (withholding stays safe)', () => {
    expect(jsonLdString(null)).toBe('');
  });

  it('still produces valid, parseable JSON after escaping', () => {
    const original = { '@type': 'WebSite', name: 'A <b> & c', url: 'https://x' };
    const serialised = jsonLdString(original);
    // The browser un-escapes \u003c when parsing JSON, so round-trips exactly.
    expect(JSON.parse(serialised)).toEqual(original);
  });
});

/* ================================================================== *
 * §2 — SECURITY HEADERS  [S-1, S-2]
 * ================================================================== */

describe('Phase 9 · security headers are configured', () => {
  it('next.config exposes a headers() function and suppresses X-Powered-By', async () => {
    const mod = await import('../../next.config');
    const config = mod.default as {
      poweredByHeader?: boolean;
      headers?: () => Promise<
        { source: string; headers: { key: string; value: string }[] }[]
      >;
    };

    expect(config.poweredByHeader).toBe(false);
    expect(typeof config.headers).toBe('function');

    const rules = await config.headers!();
    // A single catch-all rule covering every route.
    expect(rules.some((r) => r.source === '/:path*')).toBe(true);

    const all = rules.flatMap((r) => r.headers);
    const byKey = (k: string) => all.find((h) => h.key === k)?.value;

    // The core protective set is present.
    expect(byKey('Content-Security-Policy')).toBeTruthy();
    expect(byKey('X-Frame-Options')).toBe('DENY');
    expect(byKey('X-Content-Type-Options')).toBe('nosniff');
    expect(byKey('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(byKey('Permissions-Policy')).toContain('geolocation=()');
    expect(byKey('Strict-Transport-Security')).toBeTruthy();
  });

  it('the CSP denies by default and never allows a wildcard origin', async () => {
    const mod = await import('../../next.config');
    const config = mod.default as {
      headers: () => Promise<
        { headers: { key: string; value: string }[] }[]
      >;
    };
    const rules = await config.headers();
    const csp =
      rules
        .flatMap((r) => r.headers)
        .find((h) => h.key === 'Content-Security-Policy')?.value ?? '';

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    // No blanket wildcard that would defeat the policy.
    expect(csp).not.toMatch(/(script|connect|default)-src[^;]*\*/);
  });
});
