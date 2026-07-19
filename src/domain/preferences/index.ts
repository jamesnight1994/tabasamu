/**
 * PREFERENCES & CONSENT DOMAIN
 *
 * ⚠ CONSENT IS A LEGAL RECORD, NOT A UI TOGGLE.
 *
 *   Under the Kenya Data Protection Act 2019 (⛔ D-43 — is the entity ODPC-
 *   registered?), consent must be freely given, specific, informed, and
 *   AUDITABLE. That last word is the one most implementations miss: you must be
 *   able to prove WHAT a person consented to, WHEN, and from WHERE. A boolean in
 *   a settings table cannot do that — it only knows the current value, not the
 *   history.
 *
 *   So every consent change produces an append-only `ConsentEvent`. The current
 *   state is derived from the latest event per topic; the events themselves are
 *   never mutated or deleted. The backend persists them; this domain defines
 *   their shape and the derivation. [D-43]
 *
 * ⚠ NOTHING HERE IS PRE-TICKED. Every consent defaults to FALSE (withheld).
 *   Opt-in is the only lawful default; a pre-checked marketing box is a
 *   dark pattern and, in this jurisdiction, likely unlawful.
 */

import { type CustomerId } from '../shared';

/* ================================================================== *
 * Notification channel preferences
 * ================================================================== */

/**
 * ⚠ TRANSACTIONAL vs MARKETING IS A HARD LINE.
 *
 *   A customer can switch off marketing entirely and MUST still receive
 *   transactional messages — "your order is on its way", "your payment needs
 *   attention". You cannot opt out of being told your box shipped. So the model
 *   separates the two, and the marketing toggles never gate transactional sends.
 *
 *   ⛔ D-41 (SMS provider), D-42 (WhatsApp's role) — the CHANNELS are toggleable
 *      here, but actually sending is a stubbed adapter. In Kenya SMS is the
 *      expected transactional channel, so it defaults ON for transactional.
 */
export interface ChannelPreferences {
  readonly email: {
    readonly transactional: true; // ⚠ not toggleable — you can't opt out of order updates
    readonly marketing: boolean;
    readonly productNews: boolean;
  };
  readonly sms: {
    readonly transactional: boolean; // ⚠ toggleable but ON by default (market norm)
    readonly marketing: boolean;
  };
  readonly whatsapp: {
    // ⛔ D-42 — WhatsApp's role is undecided. Both default OFF; the toggle
    //    exists so the preference is captured, but nothing sends yet.
    readonly transactional: boolean;
    readonly marketing: boolean;
  };
}

export const DEFAULT_CHANNEL_PREFERENCES: ChannelPreferences = {
  email: { transactional: true, marketing: false, productNews: false },
  sms: { transactional: true, marketing: false }, // ⚠ transactional ON — Kenya norm
  whatsapp: { transactional: false, marketing: false }, // ⛔ D-42
};

/* ================================================================== *
 * Cookie preferences — GRANULAR, not a dismiss banner
 * ================================================================== */

/**
 * ⚠ F-73: NOT A DISMISS-ONLY BANNER.
 *   "Necessary" cannot be switched off (the site cannot function without it,
 *   and it carries no tracking). Everything else defaults OFF and requires an
 *   affirmative choice. "Reject all" must be exactly as easy as "Accept all" —
 *   enforced in the UI, but the model makes it natural by defaulting to off.
 */
export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

export interface CookiePreferences {
  readonly necessary: true; // always on, never a choice
  readonly analytics: boolean;
  readonly marketing: boolean;
  readonly preferences: boolean;
  /** Has the customer made an ACTIVE choice yet? Drives whether the banner shows. */
  readonly decided: boolean;
}

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
  decided: false, // ⚠ until true, the banner shows and only necessary cookies run
};

export const acceptAllCookies = (): CookiePreferences => ({
  necessary: true,
  analytics: true,
  marketing: true,
  preferences: true,
  decided: true,
});

export const rejectAllCookies = (): CookiePreferences => ({
  ...DEFAULT_COOKIE_PREFERENCES,
  decided: true, // a decision was made — the decision was "only necessary"
});

/* ================================================================== *
 * Consent audit — the append-only record
 * ================================================================== */

export type ConsentTopic =
  | 'terms_of_sale'
  | 'marketing_email'
  | 'marketing_sms'
  | 'marketing_whatsapp'
  | 'cookies_analytics'
  | 'cookies_marketing'
  | 'cookies_preferences'
  | 'data_processing';

/**
 * ⚠ THE AUDITABLE UNIT. Append-only. Never updated, never deleted.
 *   `source` and `version` matter: consent to v1 of a privacy policy is not
 *   consent to v2, and you must be able to prove which one they saw.
 */
export interface ConsentEvent {
  readonly customerId: CustomerId;
  readonly topic: ConsentTopic;
  readonly granted: boolean;
  readonly at: number; // epoch ms
  /** Where the choice was made — 'registration', 'cookie_banner', 'preferences'. */
  readonly source: string;
  /** Which version of the relevant policy/terms was shown. ⛔ D-43 supplies these. */
  readonly policyVersion: string;
}

/**
 * ⚠ CURRENT STATE IS DERIVED, NEVER STORED SEPARATELY.
 *   The latest event per topic wins. Storing a separate "current consent" table
 *   invites it to drift from the audit log — and then the log, the thing you'd
 *   show a regulator, disagrees with what the system actually does.
 */
export const currentConsent = (
  events: readonly ConsentEvent[],
  topic: ConsentTopic
): boolean => {
  let latest: ConsentEvent | null = null;
  for (const e of events) {
    if (e.topic === topic && (latest === null || e.at > latest.at)) latest = e;
  }
  return latest?.granted ?? false; // ⚠ absence = withheld, never assumed granted
};

export const consentHistory = (
  events: readonly ConsentEvent[],
  topic: ConsentTopic
): readonly ConsentEvent[] =>
  events.filter((e) => e.topic === topic).sort((a, b) => b.at - a.at);

/* ================================================================== *
 * Data rights — export & deletion (placeholders, honestly labelled)
 * ================================================================== */

/**
 * ⚠ THESE ARE REQUESTS, NOT ACTIONS.
 *
 *   Under the DPA a data subject can request export and deletion. But deletion
 *   is NOT immediate and NOT unconditional: there are records a business must
 *   retain (tax, an order's financial trail) even after a deletion request. So
 *   the model is a REQUEST with a status, routed to a human/backend process —
 *   not a button that nukes a row. Pretending deletion is instant and total
 *   would be inventing a legal posture we have not been given. [NN-05, D-43]
 */
export type DataRequestKind = 'export' | 'deletion';

export type DataRequestStatus =
  | 'requested'
  | 'in_progress'
  | 'completed'
  | 'rejected'; // e.g. deletion refused for records under legal retention

export interface DataRequest {
  readonly kind: DataRequestKind;
  readonly status: DataRequestStatus;
  readonly requestedAt: number;
  /** Explanation if rejected — e.g. "Order records are retained for tax purposes." */
  readonly note: string | null;
}

export const dataRequestCopy = (kind: DataRequestKind): { title: string; body: string } =>
  kind === 'export'
    ? {
        title: 'Request a copy of your data',
        body: 'We will prepare everything we hold about you and send a download link. This can take a few days.',
      }
    : {
        title: 'Request account deletion',
        body: 'We will delete your account and personal data. Some records tied to completed orders may be kept where the law requires it. We will tell you exactly what, and why.',
      };
