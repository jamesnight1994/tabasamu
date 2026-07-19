/**
 * ANALYTICS EVENT ABSTRACTION
 *
 * A typed event union — not a `track(name: string, props: any)` free-for-all.
 * Vendor-agnostic: GA4, PostHog, Plausible are all just a `AnalyticsSink`.
 *
 * ⚠ PII NEVER ENTERS AN EVENT. No phone, no email, no address, no M-PESA
 *   reference. The Kenya Data Protection Act 2019 applies (D-43) and an
 *   analytics vendor is a third-party processor.
 */

import { clientEnv } from '../config/env';
import { logger } from '../logger';
import { allowsAnalytics, type ConsentState, DEFAULT_CONSENT } from './consent';

/**
 * THE FULL EVENT UNION  (Phase 8 · §4)
 *
 * The brief enumerates the events the store must be able to measure. Every one
 * is a discriminated variant here — a typo in an event name is a compile error,
 * not a silently-dropped metric.
 *
 * ⚠ PII NEVER ENTERS A PAYLOAD. No phone, email, address, name, order ID that
 *   resolves to a person, or M-PESA reference. Amounts and identifiers that
 *   could deanonymise are excluded; slugs, counts and coarse enums are all a
 *   funnel needs. (D-43 — an analytics vendor is a third-party processor.)
 *
 * ⚠ Money is NOT in these payloads. Prices are blocked (D-14) and, more
 *   durably, sending revenue to a third-party analytics vendor is a data-
 *   minimisation question the client must answer, not a default.
 */
export type AnalyticsEvent =
  | { name: 'page_view'; path: string }
  | { name: 'product_viewed'; slug: string }
  | { name: 'product_list_viewed'; count: number }
  | { name: 'search_performed'; resultCount: number }
  | { name: 'filter_applied'; facet: string }
  | { name: 'add_to_cart'; slug: string; quantity: number }
  | { name: 'remove_from_cart'; slug: string }
  | { name: 'cart_viewed'; itemCount: number }
  | { name: 'checkout_started'; itemCount: number }
  | { name: 'delivery_zone_selected'; zone: string }
  | { name: 'payment_method_selected'; provider: 'mpesa' | 'card' }
  | { name: 'payment_initiated'; provider: 'mpesa' | 'card' }
  /** ⚠ `unknown` is tracked SEPARATELY from `failed`. It is the number to watch. */
  | { name: 'payment_outcome'; outcome: 'succeeded' | 'failed' | 'unknown' }
  | { name: 'order_completed'; itemCount: number }
  | { name: 'discount_applied'; valid: boolean }
  | { name: 'subscription_selected'; frequency: string }
  | { name: 'newsletter_signup' }
  | { name: 'enquiry_submitted'; type: 'wholesale' | 'corporate' }
  | { name: 'whatsapp_support_click' };

export interface AnalyticsSink {
  track(event: AnalyticsEvent): void;
}

const noopSink: AnalyticsSink = {
  track: (e) => logger.debug('analytics (noop)', { event: e.name }),
};

let sink: AnalyticsSink = noopSink;

export const setAnalyticsSink = (s: AnalyticsSink): void => {
  sink = s;
};

/**
 * ⚠ CONSENT IS HELD HERE, and the gate is in ONE place.
 *
 *   `track()` checks it on every call, so no call site can forget to. The
 *   default is DENY (`DEFAULT_CONSENT`) — analytics does not run until the
 *   consent provider pushes a decided, opt-in state. This is defence in depth
 *   alongside `NEXT_PUBLIC_ANALYTICS_ENABLED`: the flag says "a sink exists",
 *   consent says "the customer agreed", and BOTH must be true.
 */
let consent: ConsentState = DEFAULT_CONSENT;

export const setAnalyticsConsent = (c: ConsentState): void => {
  consent = c;
};

export const track = (event: AnalyticsEvent): void => {
  // Gate 1: is analytics even wired for this environment?
  if (clientEnv().NEXT_PUBLIC_ANALYTICS_ENABLED !== 'true') return;
  // Gate 2: has the customer opted in? Deny by default. (D-43)
  if (!allowsAnalytics(consent)) return;
  try {
    sink.track(event);
  } catch (err) {
    // Analytics must NEVER break the storefront.
    logger.warn('analytics sink threw', { error: String(err) });
  }
};
