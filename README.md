# Tabasamu Sips — Ecommerce

Premium caffeine-free rooibos kombucha, brewed in Nairobi. Six flavours, 1 Litre.

**Status:** feature-complete, release-ready **frontend**, awaiting a backend. Runs
entirely on in-memory mock adapters. 449 tests green, 51-route production build
clean, all 7 quality gates passing, no secrets in the bundle.

> **Backend developer? Start with [`docs/56_START_HERE_Backend_Developer.md`](docs/56_START_HERE_Backend_Developer.md).**
> It is the map to everything below.

---

## Quick start

```bash
npm ci                       # exact locked install (Node 20+)
cp .env.example .env.local   # all placeholders; safe for local
npm run dev                  # http://localhost:3000 (mock adapters)
```

## Verification

```bash
npm run verify   # lint + typecheck + contrast + brand + tests
npm run build    # production build (51 routes)
```

All green is the state to preserve.

## Architecture in one paragraph

Hexagonal / ports-and-adapters. The UI depends on **typed interfaces**
(`src/ports`), never on implementations. Today those interfaces are satisfied by
**mock adapters** (`src/adapters/mock`); the production handover is a one-line
switch — `NEXT_PUBLIC_ADAPTERS=http` — to the **HTTP adapters** the backend
developer implements (`src/adapters/http`). The dependency rule (a component may
not import an adapter) is lint-enforced and fails the build if broken. Pure
business logic lives in `src/domain` with zero framework imports.

**The handover acceptance test (Gate G2):** the flow suite runs green against
**both** mock and http adapters with zero changes above the adapter layer.

## Stack

Next.js 15.5 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind CSS 4 ·
Zod 4 · Radix UI · Vitest.

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` · `npm run typecheck` | Static checks + import boundaries |
| `npm run lint:brand` · `lint:contrast` · `lint:secrets` | Brand, WCAG AA, secret-scan gates |
| `npm test` · `test:coverage` · `test:e2e` | Vitest suite (449) · coverage · Playwright |
| `npm run verify` | The gate bundle |

## Brand logo assets

Approved logo artwork lives in **`public/brand/approved/`**
(`tabasamu-full-logo.png`, `tabasamu-monogram.svg`,
`tabasamu-monogram-white.svg`, plus the derived favicon / apple-touch / manifest
icon set and the `og-default.png` social card). Verbatim approved sources are kept
in `public/brand/_reference/`.

Render via the `Logo` component only — `variant="full" | "monogram"`,
`tone="light" | "dark"`. The full logo is light-surface only; dark surfaces use
the white monogram (there is no reversed full lockup). The brand lint
(`npm run lint:brand`) fails the build on obsolete assets, unsupported
variants/tone, CSS filters/crops/rotation on logos, and a full logo on a dark
surface. See **`docs/logo-remediation/HANDOVER.md`** for how to add new
placements.

## Documentation

All handover documentation is in [`docs/`](docs). Key entry points:

- **[56 · START HERE](docs/56_START_HERE_Backend_Developer.md)** — backend onboarding
- **[57 · System Architecture](docs/57_System_Architecture.md)**
- **[58 · Data Dictionary](docs/58_Data_Dictionary.md)** · **[59 · API Spec](docs/59_API_Specification.md)** + [`openapi.yaml`](docs/openapi.yaml)
- **[60 · M-PESA Guide](docs/60_MPESA_Payment_Guide.md)** · **[61 · Stripe/Card Guide](docs/61_Stripe_Card_Payment_Guide.md)**
- **[62 · Admin Guide](docs/62_Admin_Guide.md)** · **[63 · Content & Placeholder Register](docs/63_Content_and_Placeholder_Register.md)**
- **[64 · Operations & Deployment](docs/64_Operations_and_Deployment.md)**
- **[68 · Known Issues](docs/68_Known_Issues.md)** · **[69 · Handover Checklist](docs/69_Handover_Checklist.md)**
- **[08 · Client Decisions Register](docs/08_Client_Decisions_Register.md)** — what the client still owes

## The honesty rules (they govern the whole codebase)

- **No secret in frontend code** — all `.env` placeholders, server-only, bundle-scanned. [NN-03]
- **Nothing claimed operational until connected and tested** — the http adapter throws rather than faking. [NN-04]
- **No business fact invented** — unconfirmed prices, nutrition, delivery rules, and legal copy render as visible "awaiting confirmation" placeholders tied to a decision ID. [NN-05]

## What is not built (and why)

Subscriptions (D-09), card payments (D-35), build-a-box (D-06), site search
(D-48 — deliberately omitted), and real prices/nutrition/delivery/legal copy are
blocked on client decisions and gated behind feature flags. See docs 63 and 08.
