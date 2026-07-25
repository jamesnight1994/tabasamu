/**
 * <NoIndex>  (Phase 8 · §2, §5)
 *
 * Emits `<meta name="robots" content="noindex, nofollow">` for a private
 * surface — account, cart, checkout, auth.
 *
 * ⚠ WHY A COMPONENT AND NOT `export const metadata`. These layouts and pages are
 *   `'use client'` (they hold a session, a cart, or an idempotency-guarded
 *   checkout), and a client component cannot export route `metadata`. Rendering
 *   the tag directly is the supported App-Router path: Next hoists a `<meta>`
 *   rendered by a client component into the document head.
 *
 * ⚠ DEFENCE IN DEPTH. `robots.ts` already DISALLOWS these paths, which stops a
 *   polite crawler before it fetches. This tag also instructs a crawler that
 *   arrives via a direct link (a shared cart URL, say) not to index the page it
 *   just loaded. Belt and braces, because a checkout page in Google's index is
 *   a genuine privacy and trust failure.
 */
export function NoIndex() {
  return <meta name="robots" content="noindex, nofollow" />;
}
