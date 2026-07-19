# 64 · Operations & Deployment

Everything needed to run, build, test, deploy, and maintain the frontend.
Consolidates the operational parts of docs 30 (env) and 54 (release/rollback)
into one runbook.

---

## 1. Prerequisites

- **Node.js 20+** (project uses Next.js 15.5 / React 19).
- **npm** (a `package-lock.json` is committed; use `npm ci` for reproducible installs).

## 2. Local setup

```bash
npm ci                       # exact locked install
cp .env.example .env.local   # all placeholders; safe defaults for local
npm run dev                  # http://localhost:3000 (mock adapters)
```

Local runs on **mock adapters** — no backend, no network, fully functional
storefront/account/admin against in-memory data.

## 3. Development commands

| Command | Does |
|---|---|
| `npm run dev` | Dev server (Turbopack), hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint + import-boundary rules |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint:brand` | Brand-voice + palette gate |
| `npm run lint:contrast` | WCAG 2.2 AA contrast gate |
| `npm run lint:secrets` | Scans the built bundle for leaked secrets |
| `npm test` | Vitest unit + flow suite |
| `npm run test:coverage` | Tests with coverage |
| `npm run test:e2e` | Playwright (needs a browser download; see note) |
| `npm run verify` | lint + typecheck + contrast + brand + tests (the gate bundle) |

> **Playwright note:** the browser binary download is egress-restricted in some
> sandboxes; `test:e2e` needs a machine that can fetch the browser. The unit/flow
> suite (`npm test`) has no such dependency.

## 4. Build guide

```bash
npm run build     # produces .next/ ; 51 routes prerendered/SSG
npm start         # or deploy the build to your platform
```

A clean build is a release gate. Confirm it before every deploy.

## 5. Testing guide

- **Unit + flow:** `npm test` — 449 assertions across domain, adapters, and
  full user flows (cart → checkout, account arc, admin workflows).
- **The handover gate (G2):** with a real backend, set
  `NEXT_PUBLIC_ADAPTERS=http` and run the flow suite; it must pass unchanged
  above the adapter layer. That is the acceptance test for the backend.
- **Brand/contrast/secrets:** run as part of `npm run verify`; all three must
  pass to ship.

## 6. Deployment guide

The frontend is a standard Next.js app (static/SSG + SSR). Deploy to any Node
host or Next-compatible platform (Vercel or a container).

1. Set production env (see §7): real `NEXT_PUBLIC_APP_URL`,
   `NEXT_PUBLIC_APP_ENV=production` (enables prod robots, HSTS, https-upgrade),
   `NEXT_PUBLIC_ADAPTERS=http` and `NEXT_PUBLIC_API_URL` once the backend exists.
2. Put all server-only secrets in the platform's **secret store**, never the repo.
3. `npm ci && npm run build` in CI; deploy the immutable build.
4. **Before enabling any third-party origin** (analytics, payment SDK), add it to
   the CSP in `next.config.ts`, and migrate `script-src` to a **nonce** model.
5. Smoke-test the deployed URL: routes 200, unknown → 404, security headers
   present, checkout reaches the payment step.

## 7. Environment variable guide

Full annotated list is `.env.example` and doc 30. The rules that matter:

- **`NEXT_PUBLIC_*` is bundled into the browser — never a secret.**
- Server-only vars (M-PESA, card, email/SMS, auth, DB, session) are read via
  `serverEnv()`, which throws if called client-side, and are scanned out of the
  bundle by `lint:secrets`.
- Every payment/notification/auth secret is a **placeholder** blocked on a client
  decision (docs 08, 63). Populate them only when the decision is answered.

Key production values to set: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_ENV=production`,
`NEXT_PUBLIC_ADAPTERS=http`, `NEXT_PUBLIC_API_URL`/`API_BASE_URL`, the M-PESA set
(D-31/32), the card set (D-35), notification providers (D-40/41), and the auth
set (D-53/54/55).

## 8. Backup assumptions

The **frontend is stateless** — nothing to back up beyond the source repo and the
immutable build artifacts. **All persistent data (products, orders, customers,
payments, audit log) lives in the backend the developer builds**, and its backup
policy is a backend/infra concern:

- Regular automated database backups with tested restores.
- The **audit log and payment records are append-only** and must be retained per
  finance/legal requirements (DPA 2019 — D-43).
- Uploaded media (product imagery) backed up with the object store.

## 9. Monitoring recommendations

- **Uptime + route health** on the deployed URL (checkout path especially).
- **Backend payment health** — alert on a growing `manual_reconciliation` /
  `unknown` payment queue (a rising queue means callbacks are being lost).
- **Core Web Vitals** (LCP/INP) from real Nairobi devices once deployed.
- **CSP violation reports** — wire a `report-uri`/`report-to` when a reporting
  endpoint exists, so a blocked legitimate origin is caught fast.

## 10. Error reporting recommendations

- Client: the built-in `logger` is intentionally minimal (no PII/tokens). Add a
  client error reporter (e.g. Sentry) at the root error boundary if desired —
  scrub PII, and add its origin to the CSP first.
- Server (backend): structured logging + error reporting on the API, with payment
  events (initiate/callback/reconcile/refund) traced end-to-end for support.

## 11. Release process

1. `npm run verify` green locally and in CI.
2. `npm run build` clean.
3. Confirm no new secret in the bundle (`lint:secrets`).
4. Tag the release; deploy the immutable build.
5. Smoke-test the deployed URL (§6.5).
6. For a launch (not just a frontend deploy), complete the launch checklist in
   doc 69 — backend connected, payments tested, decisions answered.

## 12. Rollback process

The frontend is a **stateless** deployment, so rollback is a **redeploy of the
previous immutable build** — there is no frontend-owned data migration to
reverse.

**Trigger conditions:** a previously-green gate regresses in the deployed build
(5xx on a route, broken checkout step, a CSP that blocks a needed origin), or a
security-header misconfiguration blocks legitimate traffic.

**Procedure:** redeploy the last known-good build; if the cause was a CSP/origin
change, correct `next.config.ts` and redeploy forward instead. Backend rollbacks
(schema, data) are the backend's own runbook and are independent of the frontend.

## 13. Maintenance guide

- **Dependencies:** keep Next.js/React and the Radix set patched; re-run
  `npm run verify` + `npm run build` after any bump.
- **Boundary lint:** the `eslint-plugin-boundaries` config emits v6→v7 deprecation
  *warnings* (non-blocking). Migrating `rules` → `policies` and legacy selectors
  is a low-priority tidy-up (see doc 68).
- **Brand/content:** all editorial copy is brand-linted; new copy must pass
  `lint:brand` (no forbidden vocabulary, no urgency — P-07).
- **Placeholders:** as each client decision is answered (docs 08, 63), replace the
  placeholder with the confirmed value and remove it from the register; the
  matching feature flag or `Pending` field then goes live.
- **Security:** widen the CSP only deliberately, one origin at a time; pursue the
  `script-src` nonce migration as the standing hardening task.
