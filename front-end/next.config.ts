import type { NextConfig } from "next";

/**
 * ─────────────────────────────────────────────────────────────────────
 * PHASE 9 — SECURITY HEADERS & RELEASE HARDENING
 * ─────────────────────────────────────────────────────────────────────
 *
 * Phase 8 shipped the trust/SEO layer but left the HTTP response itself
 * unhardened: the header probe in the Phase 9 QA returned no CSP, no
 * clickjacking protection, no MIME-sniffing guard, and a `X-Powered-By`
 * banner advertising the framework. These headers are the cheapest, highest-
 * leverage security control a static/SSR frontend has, and none of them
 * depends on the (still absent) backend. [S-1, S-2]
 *
 * ⚠ WHAT THIS IS, AND IS NOT.
 *
 *   This is a PRAGMATIC CSP for a site that today serves only first-party
 *   assets and inline JSON-LD, with NO third-party scripts connected (analytics
 *   is specified but unwired — doc 46). It is honestly scoped to what the site
 *   actually does, not aspirational.
 *
 *   `script-src` includes `'unsafe-inline'` because the JSON-LD blocks in the
 *   root layout are inline `<script>` tags and there is no nonce pipeline yet.
 *   `style-src` includes `'unsafe-inline'` because the design system uses a
 *   handful of inline `style={{…}}` values (swatches, hatch patterns) and
 *   Next.js injects inline styles.
 *
 *   ⛔ THE PRODUCTION HARDENING STEP (for the backend/infra owner at G2):
 *      move to a NONCE-based `script-src` (Next.js `middleware` + per-request
 *      nonce) and drop `'unsafe-inline'` from scripts. That requires a request
 *      pipeline this frontend does not own yet, so it is documented, not faked.
 *      When a third-party (analytics vendor, payment SDK) is chosen, its origin
 *      must be ADDED here explicitly — the default-deny below will otherwise
 *      block it, which is the correct, safe failure. [S-1]
 *
 *   `connect-src` currently allows only `'self'`. When `NEXT_PUBLIC_API_URL`
 *   points at a real backend origin, that origin must be added here.
 */

/**
 * "Is this a production deployment?" — true when EITHER signal says so.
 *
 * `NODE_ENV` is set to `production` by `next build` / `next start` and is the
 * conventional, reliable deployment signal. `NEXT_PUBLIC_APP_ENV` lets a
 * staging deployment (NODE_ENV=production but APP_ENV=staging) opt OUT of HSTS
 * and https-upgrade, which is correct — you do not want to HSTS-pin a staging
 * host. So: production-hardening applies when NODE_ENV is production UNLESS
 * APP_ENV explicitly names a non-production environment.
 */
const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
const isProd =
  (process.env.NODE_ENV === "production" && appEnv !== "development" && appEnv !== "staging") ||
  appEnv === "production";

/** Hosted Medusa origin from env (Render, Medusa Cloud, etc.) — for CSP + next/image. */
const apiOrigin = (() => {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
})();

const apiCspOrigin = apiOrigin ? `${apiOrigin.protocol}//${apiOrigin.host}` : null;

const apiRemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = apiOrigin
  ? [
      {
        protocol: apiOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: apiOrigin.hostname,
        ...(apiOrigin.port ? { port: apiOrigin.port } : {}),
        pathname: "/**",
      },
    ]
  : [];

/**
 * Built as an array of directives so it is readable and diff-able. Kept in
 * sync with the site's real asset origins — every entry is justified.
 */
const contentSecurityPolicy = [
  // Nothing loads by default; every source below is an explicit allowance.
  `default-src 'self'`,
  // Inline scripts = JSON-LD only. See the note above re: nonce migration.
  `script-src 'self' 'unsafe-inline'`,
  // Inline styles = design-system swatches + Next.js injected styles.
  `style-src 'self' 'unsafe-inline'`,
  // Local Medusa + optional hosted API (NEXT_PUBLIC_API_URL) for product media.
  `img-src 'self' data: http://localhost:9000 http://127.0.0.1:9000${apiCspOrigin ? ` ${apiCspOrigin}` : ""}`,
  // Self-hosted woff2 (Fraunces, DM Sans) — no Google Fonts network fetch.
  `font-src 'self'`,
  // XHR/fetch: self + local Medusa + optional hosted Store API.
  `connect-src 'self' http://localhost:9000 http://127.0.0.1:9000${apiCspOrigin ? ` ${apiCspOrigin}` : ""}`,
  // This site is never legitimately framed.
  `frame-ancestors 'none'`,
  // Constrain the <base> element (defends against base-tag injection).
  `base-uri 'self'`,
  // No <form> posts to a foreign origin.
  `form-action 'self'`,
  // No plugins / <object> / <embed>.
  `object-src 'none'`,
  // Upgrade any stray http subresource to https in production only.
  ...(isProd ? [`upgrade-insecure-requests`] : []),
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    // Belt-and-braces clickjacking guard alongside `frame-ancestors`.
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Stop MIME-sniffing a response into an executable type.
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Leak only the origin cross-site; full path stays same-origin.
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Deny powerful features the site does not use.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    // ⚠ HSTS — production only. Sending this on http://localhost would pin the
    //   dev machine to https and break local development. Two years + preload
    //   is the standard once the production domain is genuinely https-only.
    key: "Strict-Transport-Security",
    value: isProd ? "max-age=63072000; includeSubDomains; preload" : "max-age=0",
  },
];

const nextConfig: NextConfig = {
  // Required for the production Docker image (copies a minimal standalone server).
  output: "standalone",

  // [S-2] Remove the `X-Powered-By: Next.js` framework-fingerprint banner.
  poweredByHeader: false,

  images: {
    // localhost/127.0.0.1 + medusa: local Docker. Extra hosts from NEXT_PUBLIC_API_URL
    // (e.g. Render onrender.com) for Vercel preview / hosted Medusa.
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "9000", pathname: "/**" },
      { protocol: "http", hostname: "medusa", port: "9000", pathname: "/**" },
      ...apiRemotePatterns,
    ],
  },

  async headers() {
    return [
      {
        // Apply the security headers to every route.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  // Repo root has its own yarn.lock (orchestrator). Pin Turbopack to this package.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
