# Authentication Contract — Phase 6

**Status:** Specification for the backend. **No auth provider is connected.** [NN-04]
**Provider-neutral by construction.** ⛔ D-53 (mechanism/provider), D-54 (email delivery), D-55 (session model), D-56 (social — not built).
**Frontend surface:** `src/domain/identity/auth.ts` + `AuthService` in `src/ports/index.ts`.

---

## 0. The one architectural commitment

The frontend commits to **no auth vendor**. It depends on the `AuthService` interface and the `Session` shape, and nothing else. Firebase, Supabase, Auth0, or a bespoke Express backend all satisfy this contract; choosing between them (D-53) changes an adapter, not a line of UI. This is the same seam as Gate G2 elsewhere in the system.

---

## 1. What the frontend may hold — and what it must not

| Holds (a descriptor) | Never holds |
|---|---|
| `customerId`, `email`, `displayName` | the session token / credential |
| `emailVerified` | a password (beyond format-validating a new one) |
| `expiresAt` (to pre-empt a 401) | anything that authorises a request |

⚠ **The authorising credential is an httpOnly cookie the JavaScript cannot read.** A token in `localStorage` or React state is a token an XSS can exfiltrate. The `Session` object is a *cache of the server's answer to "who am I?"*, not a capability. [D-55]

---

## 2. `AuthService` — the operations

```
register(input: ValidRegistration)      → Result<Session, AuthError>
signIn(email, password)                 → Result<Session, AuthError>
signOut()                               → void
currentSession()                        → Session | null      // reads the cookie
refresh()                               → Result<Session, AuthError>
requestPasswordReset(email)             → RequestResetResult   // always 'sent'
completePasswordReset(token, newPw)     → CompleteResetResult
verifyEmail(token)                      → Result<true, …>
resendVerification(email)               → Result<true, AuthError>
```

The backend implements each against its chosen mechanism. The mock implements them in-memory with realistic behaviour (see §5).

---

## 3. `AuthError` — the states that matter

| Kind | Meaning | UI behaviour |
|---|---|---|
| `invalid_credentials` | wrong email **or** password | ONE generic message — never says which |
| `rate_limited` | too many attempts | show wait time; **disable the form** |
| `locked` | account temporarily locked | show unlock time |
| `unverified` | correct password, email not verified | route to **resend**, not to "wrong password" |
| `network` / `server` | transport / backend failure | retryable message |

⚠ **`invalid_credentials` is deliberately ambiguous.** "No account with that email" is an enumeration oracle — it lets an attacker map who has an account. Email and password are wrong together or right together, as far as the user is told.

---

## 4. Enumeration resistance — a hard requirement

Three flows must NOT reveal whether an email has an account:

1. **Sign-in** — same `invalid_credentials` for unknown email and wrong password.
2. **Password reset request** — always returns `{ kind: 'sent' }`. The UI says "if that email has an account, a link is on its way."
3. **Resend verification** — always returns ok.

The backend MUST preserve this. A 200-vs-404, a timing difference, or a different message defeats it.

---

## 5. Behaviours the mock enforces (so the UI is built against them)

- **Rate limiting:** 5 failed sign-ins within a 5-minute window → `rate_limited` with a real `retryAfterMs`. A successful reset clears the counter.
- **Verification gate:** a freshly registered account is `emailVerified: false` and **cannot sign in** until verified — sign-in returns `unverified`, not success.
- **Reset tokens:** single-use; an invalid/expired/forged token returns `invalid_token` (one message for all three).
- **Session TTL:** 30 minutes (the assumed D-55 default). `currentSession()` is the source of truth.

⚠ The mock stores plaintext passwords in a Map because it is throwaway in-memory dev data. **The real adapter hashes server-side (argon2/bcrypt).** This is stated so nobody mistakes the mock for a pattern.

---

## 6. Password policy (D-54)

NIST 800-63B-aligned and configurable (`PasswordPolicy`): length is the control (min 10, max 128), common-password rejection on, **no composition rules** (no "must contain a symbol" — that produces `Password1!` and worse UX). The client validates a *new* password's format as a courtesy; the authoritative check (incl. a full breached-password list) is server-side.

---

## 7. What must be confirmed before auth goes live

| # | Decision | Blocks |
|---|---|---|
| D-53 | Mechanism + provider | every method's implementation |
| D-54 | Email provider + token lifetimes | verification, reset delivery |
| D-55 | Session TTL + refresh model | `refresh`, cookie policy |
| D-56 | Social login (if approved) | not built; would add providers |

Until D-53/D-54 are answered, **auth cannot be enabled and the code does not pretend it is.** The mock lets the entire UI be built and tested; the http adapter throws `NotImplemented`. [NN-04]
