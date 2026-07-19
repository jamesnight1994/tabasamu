# 57 · System Architecture (Consolidated)

The single canonical description of how the application is built. Supersedes
scattered architecture notes for handover purposes; per-phase ADRs (doc 15)
remain the historical record of *why* each choice was made.

---

## 1. Executive overview

Tabasamu Sips is a server-rendered React storefront (Next.js App Router) with
three audiences behind route groups: the **storefront** (public shopping), the
**account** area (authenticated self-service), and the **admin** back office.
All data access flows through a set of typed **ports**; today those ports are
satisfied by **in-memory mock adapters**, and the production handover is a
one-line switch to **HTTP adapters** the backend developer implements.

The guiding principle is a strict dependency inversion: **the UI depends on
interfaces, never on implementations.** This is what makes the backend a
pluggable component rather than an entangled rewrite.

## 2. Layered architecture

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION   React components (src/components, src/app)     │
│                No fetch. No business rules. Consumes hooks.   │
├─────────────────────────────────────────────────────────────┤
│ APPLICATION    Hooks, state, orchestration                   │
│                Calls the domain layer. Never calls HTTP.      │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN         Pure TypeScript (src/domain)                   │
│                Pricing, cart maths, delivery rules, phone     │
│                normalisation, validation, state machines.     │
│                ZERO React. ZERO HTTP. Fully unit-tested.      │
├─────────────────────────────────────────────────────────────┤
│ PORTS          Typed interfaces (src/ports)                   │
│                THE CONTRACT with the backend.                 │
├─────────────────────────────────────────────────────────────┤
│ ADAPTERS       MockAdapters (now)  →  HttpAdapters (backend)  │
│                Chosen at the composition root by one env var. │
└─────────────────────────────────────────────────────────────┘
```

**Enforcement:** `eslint-plugin-boundaries` encodes these layers as element
types with an allow-list of permitted imports. A component importing an adapter,
or a domain file importing React, is a lint error that fails CI. This is not a
convention that relies on discipline — it is mechanical.

## 3. Folder structure

```
tabasamu/
├── src/
│   ├── app/                  Next.js App Router (route groups + pages)
│   │   ├── (storefront)/     Public shopping surface
│   │   ├── (account)/        Authenticated customer self-service
│   │   ├── (admin)/          Back office (permission-gated)
│   │   ├── (auth)/           Sign-in / register / reset / verify
│   │   ├── layout.tsx        Root layout, fonts, Organization+WebSite JSON-LD
│   │   ├── globals.css       Design tokens as CSS custom properties
│   │   ├── manifest.ts robots.ts sitemap.ts   SEO/PWA generators
│   │   └── error.tsx loading.tsx not-found.tsx
│   ├── components/           Presentation, grouped by surface
│   │   ├── primitives/       Design-system atoms (Radix-backed)
│   │   ├── commerce/ shop/ storefront/ editorial/ admin/ …
│   ├── domain/               PURE business logic (see §2)
│   ├── ports/                Typed backend contract  ← THE HANDOVER
│   ├── adapters/
│   │   ├── mock/             In-memory reference implementation
│   │   ├── http/             Backend skeleton (throws NotImplemented)
│   │   └── index.ts          Composition root (env-driven adapter choice)
│   ├── content/              In-repo editorial copy (brand-linted)
│   ├── lib/                  config, errors, flags, logger, seo, analytics
│   └── tokens/               Design tokens (source of truth for CSS vars)
├── docs/                     All handover + phase documentation (this set)
├── scripts/                  check-contrast / check-brand / check-secrets
├── tests/                    Vitest unit + flow suites
├── public/                   Static assets (product imagery, icons, OG)
├── .env.example              Every env var, all placeholders
└── next.config.ts            Security headers, CSP, HSTS (prod-only)
```

## 4. Route reference

Route groups do not affect the URL. All routes are statically prerendered or SSG
except where a dynamic segment requires runtime params.

**Storefront** — `/`, `/shop`, `/shop/[slug]`, `/catalogue`, `/bundles/[slug]`,
`/cart`, `/checkout`, `/our-story`, `/ingredients`, `/faqs`, `/stockists`,
`/wholesale`, `/corporate`, `/contact`, `/delivery-and-returns`, `/privacy`,
`/terms`, `/accessibility`, `/cookie-preferences`.

**Account** (auth-guarded) — `/account`, `/account/orders`, `/account/orders/[id]`,
`/account/addresses`, `/account/subscriptions`, `/account/subscriptions/[id]`,
`/account/preferences`.

**Admin** (permission-gated) — `/admin`, plus `/admin/{products, inventory,
orders, customers, delivery, payments, promotions, subscriptions, content,
reports, audit, staff, settings}`.

**Auth** — `/signin`, `/register`, `/reset`, `/verify`.

**Generated** — `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`.

> Note: there are **no `route.ts` API handlers** in this frontend. Data access is
> via adapters, not Next API routes. The backend developer's API lives in a
> separate service; the HTTP adapter calls it. See doc 58.

## 5. Component architecture

Components are grouped by surface, not by type, so a feature's UI lives together.
Atoms live in `components/primitives/` and wrap Radix UI for accessible
behaviour (dialog, tabs, accordion, select, switch, radio, toast, checkbox,
visually-hidden). Higher-level components compose these and consume **hooks**;
they never call an adapter or `fetch` directly. Forms use `react-hook-form` +
`zod` resolvers, with the same domain validators the server will re-run.

## 6. State-management approach

- **Server/shared data** — fetched through hooks that call domain functions,
  which call ports. No global data store; each surface owns its fetching.
- **Local UI state** — React state/reducers within components.
- **Cross-cutting session/flags** — small context providers seeded at the root.
- **No browser storage of secrets or tokens.** The auth model returns only a
  session *descriptor*; any readable token is a token an XSS can steal, so there
  isn't one (httpOnly cookie, server-authoritative — D-55).

## 7. Styling & design-token system

- **Tokens** are defined once in `src/tokens/tokens.ts` and surfaced as CSS
  custom properties in `globals.css`. Tailwind 4 consumes them.
- **Brand palette (binding, from the Brand Book):** terracotta `#C05A2C`,
  forest green `#1D6B4F`, warm cream `#FDF6F0`, charcoal `#2D2D2D`, muted gold
  `#B8943E`. Pure white is forbidden; cream is the canvas.
- **Type:** Fraunces (display/headings) + DM Sans (body/UI) + JetBrains Mono
  (codes, batch numbers, order/M-PESA references).
- **Two custom gates protect the brand in CI:** `lint:brand` scans for forbidden
  vocabulary/urgency/off-palette usage; `lint:contrast` verifies every permitted
  colour pair meets WCAG 2.2 AA. Both must pass to ship.

## 8. Authentication assumptions

Provider-neutral behind `AuthService` (doc 33). The frontend supports
register / sign-in / sign-out / current-session / refresh / password-reset /
email-verification. It holds no token. The concrete mechanism (bespoke session
cookie vs a managed provider vs passwordless) is **D-53**; session lifetime and
refresh model is **D-55**; verification/reset email delivery is **D-54**.
Reset and verification flows are enumeration-safe (a valid-looking email always
returns "sent").

## 9. Data-fetching approach

Every read/write goes: component → hook → domain function → **port** → adapter.
The mock adapter answers in memory; the HTTP adapter (yours) answers over the
network. The `Result<T, E>` type carries expected failures as values (stock
errors, discount errors, auth errors) rather than exceptions, so the UI renders
the failure state instead of crashing. Unexpected failures raise `AppError`
(see §10).

## 10. Error handling

- **Expected, domain-level failures** → `Result<T, E>` discriminated unions. The
  UI switches on `error.kind` and shows the right message.
- **Unexpected failures** → `AppError` (`src/lib/errors`) with a category
  (`SERVER`, `VALIDATION`, …), a user-safe message, and an optional cause. The
  root `error.tsx` boundary catches render-time errors.
- **The HTTP adapter maps transport/backend errors** into these same shapes, so
  the UI's error handling does not change between mock and http.

## 11. Logging

A thin `logger` (`src/lib/logger`) with a level controlled by
`NEXT_PUBLIC_LOG_LEVEL`. It is deliberately minimal on the client (no PII, no
tokens). Server-side structured logging and error reporting (e.g. Sentry) are a
backend/infra concern — see doc 63 for the recommendation.

## 12. Feature flags

`src/lib/flags/` defines a typed `FeatureFlags` set, every member defaulting to
`false` because each gates a feature blocked on a client decision
(`FLAG_BLOCKERS` maps each flag to its decision ID). Flags are read through
`isEnabled()`; turning one on is a business decision, not a refactor.

## 13. Environment variables

The full list, with placeholders and the decision each is blocked on, lives in
`.env.example` and is documented in doc 30 (env guide) and doc 63. The only rule
that matters architecturally: **anything prefixed `NEXT_PUBLIC_` is bundled into
the browser and must never hold a secret.** `serverEnv()` throws if read in the
browser, and `lint:secrets` fails the build on a leaked secret.

## 14. Deployment assumptions

The frontend is a standard Next.js app; it deploys to any Node host or a
Next-compatible platform (Vercel, or a container). It needs the backend API URL
(`NEXT_PUBLIC_API_URL` / `API_BASE_URL`) and `NEXT_PUBLIC_ADAPTERS=http` to run
against a real backend. Security headers and a production-only HSTS are already
configured in `next.config.ts`; the CSP is honestly scoped to first-party and
must be widened (and `script-src` migrated to a nonce) before adding any
third-party origin. Full deployment steps: doc 63.
