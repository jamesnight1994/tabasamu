# 56 · START HERE — Backend Developer Onboarding

**This is the first document to read.** It tells you, in order, exactly what this
project is, what is already built, what you must build, and how you will know
when you are done. Everything else in `docs/` is reference; this is the map.

**NestJS API (Phase 1 product catalogue):** lives under [`backend/`](../backend/). How to add endpoints and modules: [`backend/CONTRIBUTING.md`](../backend/CONTRIBUTING.md). Storefront ports still win for shapes; OpenAPI is in `docs/openapi.yaml`.

**Read time:** ~15 minutes. **Do not skip §3 (the one thing that matters) or §7 (the honesty rules).**

---

## 1. What this project is

Tabasamu Sips is a premium Kenyan kombucha brand. This repository is the
**complete, production-ready frontend** for its ecommerce website, built to be
handed to you — a backend developer — so you can connect a real backend
**without reverse-engineering any frontend assumptions**.

- **Stack:** Next.js 15.5 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind CSS 4 · Zod 4 · Vitest.
- **Architecture:** hexagonal / ports-and-adapters. Presentation → application → **domain** → **ports** → **adapters**. The dependency rule is lint-enforced: a component may not import an adapter, and the build fails if it does.
- **State today:** feature-complete as a frontend. 449 unit/flow tests green, 51 routes build clean, 7 quality gates pass, zero secrets in the bundle. It runs entirely against **in-memory mock adapters**. No backend is connected, and nothing pretends one is.

## 2. What is already done for you

You are **not** starting from a blank page. The following are complete and are **not your job to redesign**:

- **Every domain rule** — pricing, cart maths, money arithmetic (integer minor units, never floats), phone normalisation (`07…`/`+254…`/`7…` → `2547XXXXXXXX`), delivery-fee rule engine, order-state transition table, validation. All pure TypeScript, 100% unit-tested, zero framework imports. See `src/domain/`.
- **The full typed contract you implement against** — `src/ports/index.ts`. This *is* the interface between you and the frontend. 16 ports (repositories, services, gateways). Read it top to bottom; the comments explain every non-obvious market decision.
- **A reference mock backend** — `src/adapters/mock/`. It implements every port in memory with realistic behaviour (idempotency, reservations, state transitions, the M-PESA "pending → callback" dance). **This is your executable specification.** When in doubt about what a method should return, read the mock.
- **A typed HTTP adapter skeleton** — `src/adapters/http/`. Every method currently throws `NotImplemented`. **This is where your work goes.** It already type-checks against the ports, so you are filling in bodies, not designing shapes.
- **All documentation** — data model (58), OpenAPI spec (59, `openapi.yaml`), M-PESA guide (60), Stripe/card guide (61), admin guide (62), content/placeholder register (63), operations/deployment (64), plus the earlier per-phase docs (01–55).

## 3. THE ONE THING THAT MATTERS — Gate G2

There is a single, mechanical acceptance test for a clean handover:

> **The full flow test suite must run green against BOTH `MockAdapters` and
> `HttpAdapters`, with ZERO changes above the adapter layer.**

The composition root — `src/adapters/index.ts` — chooses the adapter set from one
environment variable:

```
NEXT_PUBLIC_ADAPTERS=mock   # today
NEXT_PUBLIC_ADAPTERS=http   # you, when your backend exists
```

Your job, reduced to one sentence: **make the http flow pass by implementing
`src/adapters/http/`, changing nothing above it.** If you find yourself needing
to edit a component, a hook, or a domain file to make the backend work, stop —
backend logic has leaked upward, and the boundary lint or a flow test will tell
you. The contract is the ports; honour it and the UI never knows the difference.

## 4. Run it locally, right now

```bash
npm ci                 # install exact locked versions
cp .env.example .env.local
npm run dev            # http://localhost:3000 — runs on mock adapters
```

Then prove the baseline before you touch anything:

```bash
npm run verify         # lint + typecheck + contrast + brand + tests
npm run build          # production build, 51 routes
```

All green is the state you inherited. Keep it green.

## 5. Your build order (recommended)

1. **Read** `src/ports/index.ts` and `src/adapters/mock/` side by side. The mock is the spec.
2. **Stand up the catalogue read path first** — `ProductRepository`, `CollectionRepository`, `InventoryService`. It is read-only, it unblocks the storefront, and it is the safest place to validate your HTTP plumbing, error mapping, and the `Result<T,E>` convention.
3. **Cart + delivery quote** — `CartRepository`, `DeliveryService`. Server-authoritative totals (recompute; the client's number is display-only).
4. **Checkout + orders** — `CheckoutService`, `OrderRepository`. Revalidation before every payment. Idempotency-guarded order creation.
5. **Payments** — `PaymentGateway` + the backend-only `WebhookHandler`. See doc 60 (M-PESA) and doc 61 (card). This is where the market-specific care lives; read those guides fully before writing a line.
6. **Auth, customer, addresses, preferences** — provider-neutral; wire to whatever the client chooses (D-53/54/55).
7. **Admin + subscriptions** — admin behind the permission matrix (doc 62); subscriptions stay flag-off until D-09 is answered.

## 6. The domain logic you must NOT reimplement divergently

These rules already exist as pure functions. Port them; do not write a second,
subtly-different copy on the server (a client/server pricing mismatch is the
classic "the price changed at checkout" bug):

| Logic | Source of truth |
|---|---|
| Cart subtotal, line totals, discount application | `src/domain/pricing/index.ts` |
| Money arithmetic (integer minor units) | `src/domain/shared/index.ts` (`money`, `Money`) |
| Phone normalisation | `src/domain/identity/phone.ts` |
| Delivery-fee rules | `src/domain/delivery/index.ts` |
| Order-state transitions | `src/domain/order/index.ts` (`canTransition`) |
| Validation | domain validators alongside each entity |

> **You still recompute and re-validate everything server-side** — the client's
> calculation is never authoritative. But use the *same rules*. The safest path
> is to port these functions to your server verbatim.

## 7. The honesty rules (non-negotiable — they govern the whole codebase)

This project has a strict discipline, encoded as `NN-` (never) rules and a
Client Decisions Register (doc 08). You inherit it:

- **NN-03 — No secret is ever in frontend code.** All secrets are `.env` placeholders, server-only, and `npm run lint:secrets` scans the built bundle and fails on a hit. Keep it that way.
- **NN-04 — Nothing is claimed operational until it is actually connected and tested.** The http adapter *throws* rather than returning a plausible fake, precisely so a fake cannot make G2 pass against nothing. Hold this line.
- **NN-05 — No business fact is invented.** Prices, nutrition, delivery zones/fees, legal copy, ingredient provenance — every one that is unconfirmed is a **registered placeholder** tied to a decision ID, and renders on the site as a visible "awaiting confirmation" panel. Your backend must not invent them either; it serves what the client confirms.
- **Feature flags** (`src/lib/flags/`) gate every feature that is blocked on a decision. A flag is off because building it would mean guessing a business rule. Turning one on is a business act, not a code cleanup.

## 8. What is explicitly NOT built (and why)

| Not built | Blocked on | Note |
|---|---|---|
| Subscriptions billing | **D-09** | M-PESA has no card-on-file; four candidate billing models produce different data models. Management state exists; **no charge moves money** until the model is chosen. |
| Card payments | **D-35** | Stripe may not settle KES for a Kenyan entity. Card rail may be Flutterwave/Pesapal/DPO instead. `PaymentGateway` is provider-agnostic so this is an adapter swap. |
| Build-a-Box | **D-06** | Box size (4/6/12) undecided. |
| Site search | **D-48** | Deliberately omitted — 6 SKUs do not warrant it. |
| Real prices, nutrition, zones, legal copy | **D-05/13/14/21/22/23/50 + ~20 more** | See doc 63 (Content & Placeholder Register) and doc 08. |

## 9. Where to go next

- **The data you'll persist:** doc 58 — Data Dictionary.
- **The endpoints you'll expose:** doc 59 — API Specification + `openapi.yaml`.
- **Payments, in depth:** doc 60 (M-PESA), doc 61 (Stripe/card).
- **Admin authorisation:** doc 62 — Admin Guide + permission matrix.
- **What the client still owes:** doc 63 — Content & Placeholder Register, and doc 08 — Client Decisions Register.
- **Running, building, deploying:** doc 64 — Operations & Deployment.
- **The full handover checklist:** doc 69 — Handover Checklist.

Welcome. The frontend is honest, tested, and waiting for a real backend behind
one clean interface. Build that, keep G2 green, and the handover is done.
