# Admin Workflow Test Plan — Phase 7

**68 admin assertions across three suites**, all passing (domain/matrix `admin.test.ts` 37, adapter `admin-adapter.test.ts` 11, workflows `admin-workflows.test.ts` 14, render `admin-render.test.tsx` 6). The ⚠ rows protect an authorisation boundary, a legal record, or a blocked-decision honesty rule.

---

## 1. RBAC — fail-closed (admin.test.ts)

| Risk | Assertion |
|---|---|
| ⚠ no session = no access | a null staff member can do nothing |
| ⚠ deactivated staff retain access | an inactive staff member can do nothing, whatever their role |
| super_admin gaps | super_admin can do everything in the matrix |
| ⚠ read-only role can mutate | finance_analyst has no mutating permission |
| ⚠ privilege escalation | only super_admin manages staff and feature flags |
| ⚠ money bar leak | order_manager cannot request refunds |
| commercial leak | content_editor has no commercial access |
| nav correctness | canAny drives nav visibility; every role has dashboard.view |

## 2. Audit catalogue (admin.test.ts)

| Risk | Assertion |
|---|---|
| unclassified action | every action has a reversibility classification |
| ⚠ money undoable | money-moving actions are irreversible |
| ⚠ notification undoable | a sent notification is irreversible |
| ⚠ stock "undo" | a stock adjustment is compensating, not reversible |

## 3. Stock movements (admin.test.ts)

| Risk | Assertion |
|---|---|
| no-op adjustment | rejects a zero delta |
| ⚠ silent recount | rejects a recount with no note |
| ⚠ negative stock | refuses to drive on-hand below zero |
| pool confusion | reserved/released affect a different pool than on-hand |
| ⚠ source of truth | on-hand is the SUM of movements — the audit trail is authoritative |

## 4. Promotions & CSV (admin.test.ts)

| Risk | Assertion |
|---|---|
| malformed code | rejects spaces; uppercases valid codes |
| ⚠ bad percentage | rejects a percentage outside 1–100 |
| ⚠ inverted window | rejects a window that ends before it starts |
| ⚠ corrupt export | CSV quotes commas, doubles quotes, quotes newlines; CRLF header |

## 5. Adapter enforcement (admin-adapter.test.ts)

| Risk | Assertion |
|---|---|
| ⚠ read-only mutates | finance_analyst cannot adjust inventory |
| audited mutation | store_manager CAN adjust, and it writes an audit event |
| ⚠ flag/staff escalation | only super_admin toggles flags / manages staff |
| ⚠ browser refund | a refund is requested (audited), never executed in the browser |
| money bar | order_manager cannot request a refund |
| ⚠ negative via adapter | adjustment rejects a would-go-negative |
| ⚠ faked revenue | dashboard revenue is Unavailable (D-14); counts are real |
| audit visibility | audit list empty for a role without audit.view |

## 6. Phase 7 workflows (admin-workflows.test.ts) — the newly-wired screens

| Risk | Assertion |
|---|---|
| ⚠ payment write from browser | reconcile FLAGS + audits; read-only role refused |
| payment lookup | list, reviewQueue subset, byReference all work |
| ⚠ data-request handling | deletion handling gated + audited |
| ⚠ faked LTV | customer lifetime value is Unavailable (D-14) |
| content gating | content_editor can publish (audited); finance cannot |
| ⚠ tax applied early | settings report tax OFF (D-16) |
| settings gating | a role without settings.edit is refused; a permitted one audited |
| ⚠ flag escalation | feature-flag toggle is super_admin-only + audited |
| ⛔ invented zones | delivery reports zero zones (D-21/22/23) |
| ⚠ audit accumulation | N consequential actions → N audit events; hidden without audit.view |

## 7. Render + RBAC-in-UI (admin-render.test.tsx)

| Risk | Assertion |
|---|---|
| screen shows only skeleton | payments screen renders the read-only notice + rows |
| ⚠ action visible to wrong role | Reconcile hidden from marketing; shown to store_manager |
| ⚠ faked LTV in UI | customers screen renders the Unavailable marker |
| blocked notice missing | reports screen renders the awaiting-confirmation notice |
| ⚠ tax shown as on | settings screen shows tax OFF (D-16) |

---

## What is NOT covered, stated honestly

- **Visual layout at 360px.** jsdom does not lay out pixels; the admin console's dense tables need a real browser to confirm they scroll rather than overflow on a small Android screen. Playwright's browser is egress-blocked in this sandbox. Render *logic* and RBAC-driven visibility are covered (6 jsdom tests); pixel layout is **outstanding**, carried from Phases 5–6.
- **Live backend authorisation.** The mock enforces the matrix; the real server must re-enforce it. The contract (`docs/39`) states this as a hard requirement.
