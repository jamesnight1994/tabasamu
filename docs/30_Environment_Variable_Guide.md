# Environment Variable Guide — Phase 5

**Status:** Reference. Every value below is a **placeholder**. No real secret is in the repo. [NN-03]

`lint:secrets` scans the built client bundle and fails the build if any secret-shaped value leaks into it.

---

## 1. The one rule

> **`NEXT_PUBLIC_*` is compiled into the browser bundle. Everything else stays on the server.**

A payment secret in a `NEXT_PUBLIC_` var is readable by anyone who opens dev tools. The split is mechanical:

- `src/lib/config/env.ts` — **client**, reads only `NEXT_PUBLIC_*`.
- `src/lib/config/server-env.ts` — **server**, `import 'server-only'` at the top so a build error fires if a component ever imports it.

---

## 2. Client variables (`NEXT_PUBLIC_*`) — safe in the browser

| Var | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_ADAPTERS` | `mock` \| `http` — the Gate G2 handover switch | `mock` |
| `NEXT_PUBLIC_SITE_URL` | canonical URL for SEO/OG | — |
| `CARD_PUBLIC_KEY` | card SDK publishable key (⚠ publishable only) | — ⛔ D-35 |

---

## 3. Server variables — NEVER in the browser

### M-PESA (⛔ D-31 / D-32)

| Var | Purpose |
|---|---|
| `MPESA_CONSUMER_KEY` | Daraja app key |
| `MPESA_CONSUMER_SECRET` | Daraja app secret |
| `MPESA_SHORTCODE` | Paybill/Till shortcode |
| `MPESA_PASSKEY` | Lipa na M-PESA passkey |
| `MPESA_ENVIRONMENT` | `sandbox` \| `production` |
| `MPESA_CALLBACK_URL` | HTTPS STK callback |

### Card (⛔ D-35)

| Var | Purpose |
|---|---|
| `CARD_PROVIDER` | `none` \| `stripe` \| `flutterwave` \| `pesapal` \| `dpo` |
| `CARD_SECRET_KEY` | server secret key |
| `CARD_WEBHOOK_SECRET` | webhook signature secret |

### Notifications (⛔ D-41)

| Var | Purpose |
|---|---|
| `SMS_API_KEY` | SMS sender (M-PESA-market customers expect SMS) |
| `EMAIL_API_KEY` | transactional email |

### Data / API

| Var | Purpose |
|---|---|
| `DATABASE_URL` | primary datastore |
| `API_BASE_URL` | backend base, used when `NEXT_PUBLIC_ADAPTERS=http` |

---

## 4. `.env.example`

The repo ships `.env.example` documenting every var above with placeholder values and a comment on which decision blocks each. Copy to `.env.local` and fill in **only** once the corresponding client decision is answered. An unanswered decision means the feature stays behind its flag — filling the var early does not enable it.

---

## 5. Verifying nothing leaked

```
npm run lint:secrets     # scans .next/static for secret-shaped strings
```

Runs in the verify gate. A server secret appearing in the client bundle fails the build. [NN-03]
