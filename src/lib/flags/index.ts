/**
 * FEATURE FLAGS
 *
 * Every flag here is `false` because the feature it gates is BLOCKED on a
 * client decision. A flag is not a maybe — it is a named, traceable
 * "we are not allowed to build this yet".
 *
 * Turning one on without answering its decision would mean shipping an
 * invented business rule. [NN-05]
 */

export interface FeatureFlags {
  /** ⛔ D-09 — M-PESA has no card-on-file. Four candidate billing models. */
  readonly subscriptions: boolean;
  /** ⛔ D-06 — box size (4/6/12) not decided. */
  readonly buildABox: boolean;
  /** ⛔ D-35 — Stripe may not settle KES. Card rail may not exist. */
  readonly cardPayments: boolean;
  /** ⛔ D-48 — recommended OMITTED at launch; 6 SKUs do not warrant search. */
  readonly siteSearch: boolean;
  /** ⛔ D-44 — gifting not confirmed. */
  readonly gifting: boolean;
  /** ⛔ D-28/D-29 — batch calendar not supplied. */
  readonly batchCalendar: boolean;
  /** ⛔ D-19 — first-order discount. NOTE: even if on, NO urgency framing. [P-07] */
  readonly promotions: boolean;
  /** ⛔ D-10 — stockist list not supplied. */
  readonly stockists: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  subscriptions: false,
  buildABox: false,
  cardPayments: false,
  siteSearch: false,
  gifting: false,
  batchCalendar: false,
  promotions: false,
  stockists: false,
};

/** The decision that blocks each flag — surfaced in the admin and in docs. */
export const FLAG_BLOCKERS: Readonly<Record<keyof FeatureFlags, string>> = {
  subscriptions: 'D-09',
  buildABox: 'D-06',
  cardPayments: 'D-35',
  siteSearch: 'D-48',
  gifting: 'D-44',
  batchCalendar: 'D-29',
  promotions: 'D-19',
  stockists: 'D-10',
};

let flags: FeatureFlags = DEFAULT_FLAGS;

export const setFlags = (f: Partial<FeatureFlags>): void => {
  flags = { ...flags, ...f };
};

export const isEnabled = (flag: keyof FeatureFlags): boolean => flags[flag];
export const getFlags = (): FeatureFlags => flags;
