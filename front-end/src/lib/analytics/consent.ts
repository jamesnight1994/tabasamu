/**
 * CONSENT MODEL  (Phase 8 · §4, §6 · D-43)
 *
 * Analytics in Kenya is governed by the Data Protection Act 2019. An analytics
 * vendor is a third-party processor, so non-essential tracking requires
 * INFORMED, PRIOR consent — opt-in, not opt-out.
 *
 * Therefore:
 *   ⚠ DEFAULT IS DENY. Until the customer chooses, `analytics` is `false` and
 *     no event is sent. There is no "assumed yes".
 *   ⚠ ESSENTIAL IS NOT A CHOICE. Cart, session and security cookies are
 *     strictly necessary to operate the store and are not gated — but they are
 *     also not "tracking", carry no analytics identifiers, and are disclosed.
 *
 * ⛔ This module intentionally has NO vendor code. It is pure state. Whether the
 *    chosen sink is GA4, Plausible or PostHog is a separate, swappable concern
 *    (`AnalyticsSink`), and none may fire while `analytics` is false.
 */

export type ConsentCategory = 'essential' | 'analytics';

export interface ConsentState {
  /** Always true. Strictly-necessary cookies; disclosed, not optional. */
  readonly essential: true;
  /** Opt-in. Governs whether ANY analytics event is dispatched. */
  readonly analytics: boolean;
  /**
   * `null` means the customer has not chosen yet — the banner should show and
   * NOTHING non-essential runs. A timestamp records an explicit decision.
   */
  readonly decidedAt: string | null;
  /** Schema version, so a policy change can re-prompt cleanly. */
  readonly version: number;
}

export const CONSENT_VERSION = 1 as const;
export const CONSENT_STORAGE_KEY = 'tabasamu.consent.v1';

/** The pre-decision state: essential only, analytics denied, banner shown. */
export const DEFAULT_CONSENT: ConsentState = {
  essential: true,
  analytics: false,
  decidedAt: null,
  version: CONSENT_VERSION,
};

export const hasDecided = (c: ConsentState): boolean => c.decidedAt !== null;

export const allowsAnalytics = (c: ConsentState): boolean =>
  c.decidedAt !== null && c.analytics === true;

/**
 * Parse a stored consent value defensively. ANY malformed or stale-version
 * value is treated as "no decision" — which re-shows the banner rather than
 * silently assuming a preference the customer never expressed.
 */
export const parseConsent = (raw: string | null): ConsentState => {
  if (!raw) return DEFAULT_CONSENT;
  try {
    const v = JSON.parse(raw) as Partial<ConsentState>;
    if (v.version !== CONSENT_VERSION) return DEFAULT_CONSENT;
    if (typeof v.analytics !== 'boolean') return DEFAULT_CONSENT;
    if (v.decidedAt !== null && typeof v.decidedAt !== 'string') return DEFAULT_CONSENT;
    return {
      essential: true,
      analytics: v.analytics,
      decidedAt: v.decidedAt ?? null,
      version: CONSENT_VERSION,
    };
  } catch {
    return DEFAULT_CONSENT;
  }
};

export const serialiseConsent = (c: ConsentState): string => JSON.stringify(c);

/** Build a decided state for persistence. */
export const decide = (analytics: boolean): ConsentState => ({
  essential: true,
  analytics,
  decidedAt: new Date().toISOString(),
  version: CONSENT_VERSION,
});
