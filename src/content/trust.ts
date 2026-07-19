/**
 * TRUST, LEGAL & INFORMATION COPY — SINGLE SOURCE OF TRUTH
 * (Phase 8 · §1, §3, §6)
 *
 * Every word on the trust and legal pages lives here so the content lint
 * (`scripts/check-brand.mjs`) and `content.test.ts` can scan it, exactly as they
 * scan the homepage. A privacy policy is copy, and copy is where invented
 * claims — or a stray exclamation mark — get in.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE HONESTY RULE, RESTATED FOR LEGAL COPY
 *
 *   Where a fact is not confirmed by the client, it is NOT invented. It is
 *   marked `awaiting`, and the page renders a visible "awaiting confirmation"
 *   block naming the decision. A legal page that states a made-up returns
 *   window, a guessed delivery fee, or an unconfirmed ODPC registration is
 *   worse than one that honestly says "this is being finalised" — because a
 *   customer, or a regulator, may RELY on it.
 *
 *   Each `awaiting` item is traceable to a decision ID in
 *   `docs/08_Client_Decisions_Register.md` and is listed in the Legal-Content
 *   Requirements Register (`docs/47`).
 * ─────────────────────────────────────────────────────────────────────
 *
 * VOICE (Brand Book §07): warm, plain, specific, brief, never preachy, no
 * exclamation marks. Legal copy is still in-voice — it is calm and clear, not
 * boilerplate cut-and-paste.
 */

/** A block of confirmed, publishable copy. */
export interface ConfirmedBlock {
  readonly kind: 'confirmed';
  readonly heading: string;
  readonly body: readonly string[];
}

/** A block whose content depends on an unanswered decision. */
export interface AwaitingBlock {
  readonly kind: 'awaiting';
  readonly heading: string;
  /** The decision ID(s) that unblock this, for the visible marker. */
  readonly blockedBy: string;
  /** What we CAN honestly say now — never an invented fact. */
  readonly interim: string;
}

export type ContentBlock = ConfirmedBlock | AwaitingBlock;

export interface TrustPage {
  readonly slug: string;
  readonly title: string;
  readonly metaDescription: string;
  readonly eyebrow: string;
  readonly intro: string;
  readonly blocks: readonly ContentBlock[];
  /** Optional closing note, always confirmed copy. */
  readonly footnote?: string;
}

/* ================================================================== *
 * CONTACT  (D-47)
 * ================================================================== */

export const CONTACT: TrustPage = {
  slug: 'contact',
  title: 'Contact',
  metaDescription: 'How to reach Tabasamu Sips. Brewed in Nairobi, Kenya.',
  eyebrow: 'Get in touch',
  intro:
    'We read every message. The fastest way to reach us and our trading details are being finalised, and we would rather leave a field blank than print a number that does not ring.',
  blocks: [
    {
      kind: 'awaiting',
      heading: 'Trading details',
      blockedBy: 'D-47',
      interim:
        'Our trading address, phone number and email have not yet been confirmed for publication. They will appear here once finalised.',
    },
    {
      kind: 'awaiting',
      heading: 'WhatsApp',
      blockedBy: 'D-42',
      interim:
        'Whether WhatsApp is a support line, an ordering channel, or both is being decided. Until then, no number is shown so that a message is never sent into an unmonitored inbox.',
    },
    {
      kind: 'confirmed',
      heading: 'Where we brew',
      body: ['We brew in small batches in Nairobi, Kenya.'],
    },
  ],
};

/* ================================================================== *
 * DELIVERY & RETURNS  (D-21/22/23/24/25/26/36/37)
 * ================================================================== */

export const DELIVERY_RETURNS: TrustPage = {
  slug: 'delivery-and-returns',
  title: 'Delivery & returns',
  metaDescription:
    'How Tabasamu Sips reaches you in Nairobi, and what happens if a bottle arrives damaged.',
  eyebrow: 'Getting it to you',
  intro:
    'Because we brew a live, fermented drink in small batches, delivery is planned around freshness, not speed for its own sake. The specifics for each area are being confirmed with our delivery partners.',
  blocks: [
    {
      kind: 'awaiting',
      heading: 'Delivery areas and fees',
      blockedBy: 'D-21 · D-22 · D-23',
      interim:
        'Nairobi delivery zones, the fee for each, and how long each takes are being confirmed. The fee for your area will be shown before you pay — never as a surprise at the door.',
    },
    {
      kind: 'awaiting',
      heading: 'Outside Nairobi',
      blockedBy: 'D-24',
      interim: 'Whether we ship beyond Nairobi, and by which courier, is not yet confirmed.',
    },
    {
      kind: 'awaiting',
      heading: 'Collection',
      blockedBy: 'D-26',
      interim: 'Whether you can collect an order in person is being decided.',
    },
    {
      kind: 'awaiting',
      heading: 'A damaged or wrong bottle',
      blockedBy: 'D-36 · D-37',
      interim:
        'Our returns and refund terms for a damaged or incorrect order are being finalised. Because this is a food product, some of what we can offer is set by food-safety rules, and we will state exactly what applies here rather than promise something we cannot honour.',
    },
    {
      kind: 'confirmed',
      heading: 'Keeping it cold',
      body: [
        'Tabasamu is unpasteurised and alive. Keep it refrigerated, and it stays at its best. Storage guidance for each bottle sits on the label and, once confirmed, on each flavour page.',
      ],
    },
  ],
};

/* ================================================================== *
 * PRIVACY  (D-43)
 * ================================================================== */

export const PRIVACY: TrustPage = {
  slug: 'privacy',
  title: 'Privacy',
  metaDescription:
    'What information Tabasamu Sips collects, why, and the choices you have. Kenya Data Protection Act 2019.',
  eyebrow: 'Your information',
  intro:
    'We collect as little as the shop needs to work, and we do not sell your information to anyone. This policy is being finalised against the Kenya Data Protection Act 2019, and the parts that depend on our registration status are marked as such rather than guessed.',
  blocks: [
    {
      kind: 'confirmed',
      heading: 'What the shop needs',
      body: [
        'To take an order we need a delivery address, a way to reach you about that order, and a payment. That information is used to fulfil the order and for nothing else without asking you first.',
        'Your cart and session are held in your own browser. They are not analytics, they carry no tracking identifier, and the shop cannot function without them.',
      ],
    },
    {
      kind: 'confirmed',
      heading: 'Measurement is optional',
      body: [
        'We would like to understand which pages help, using privacy-respecting analytics. Nothing is measured unless you agree on the cookie banner, and you can change your mind any time on the cookie preferences page. No name, phone, address or payment reference is ever sent to an analytics service.',
      ],
    },
    {
      kind: 'awaiting',
      heading: 'Who is responsible for your data',
      blockedBy: 'D-43 · D-47',
      interim:
        'The registered data controller, our contact for data questions, and our ODPC registration status are being confirmed before this policy is finalised. Under the Data Protection Act 2019 you have rights over your information, including access and correction, and this section will name exactly how to exercise them.',
    },
    {
      kind: 'awaiting',
      heading: 'How long we keep things',
      blockedBy: 'D-43',
      interim:
        'Our retention periods are being set with our legal adviser and will be stated here, per category, rather than left vague.',
    },
  ],
  footnote:
    'This page will carry a "last updated" date once the policy is confirmed for publication.',
};

/* ================================================================== *
 * TERMS
 * ================================================================== */

export const TERMS: TrustPage = {
  slug: 'terms',
  title: 'Terms',
  metaDescription: 'The terms on which Tabasamu Sips sells to you.',
  eyebrow: 'The agreement',
  intro:
    'These are the terms for buying from us. They are being finalised with our legal adviser; the commercial specifics that depend on unconfirmed decisions are marked rather than invented.',
  blocks: [
    {
      kind: 'confirmed',
      heading: 'Who we are',
      body: ['Tabasamu Sips brews caffeine-free rooibos kombucha in small batches in Nairobi, Kenya.'],
    },
    {
      kind: 'awaiting',
      heading: 'The company behind the shop',
      blockedBy: 'D-47',
      interim:
        'Our registered company name, number and address are being confirmed and will appear here. A contract needs a named party, and we will not print a placeholder one.',
    },
    {
      kind: 'awaiting',
      heading: 'Prices and payment',
      blockedBy: 'D-14 · D-16',
      interim:
        'Prices are shown as indicative until approved, and whether they include VAT depends on our tax registration, which is being confirmed. No order can be finally priced until both are settled.',
    },
    {
      kind: 'awaiting',
      heading: 'Orders, cancellation and refunds',
      blockedBy: 'D-36 · D-37 · D-38',
      interim:
        'How an order is accepted, when it can be cancelled, and how refunds work — including that an M-PESA refund is a manual reversal with its own timing — are being finalised and will be stated plainly.',
    },
    {
      kind: 'confirmed',
      heading: 'A live product',
      body: [
        'Tabasamu is unpasteurised and continues to ferment gently. It must be kept refrigerated. Nothing on this site is medical advice, and we make no health claims about our drinks.',
      ],
    },
  ],
};

/* ================================================================== *
 * STOCKISTS  (D-10)
 * ================================================================== */

export const STOCKISTS: TrustPage = {
  slug: 'stockists',
  title: 'Stockists',
  metaDescription: 'Where to find Tabasamu Sips in Nairobi.',
  eyebrow: 'Find us',
  intro:
    'Beyond this shop, you can find Tabasamu on a few shelves around Nairobi. The current list is being confirmed so that every name here is one you can actually walk into.',
  blocks: [
    {
      kind: 'awaiting',
      heading: 'Where to buy in person',
      blockedBy: 'D-10',
      interim:
        'Our current stockists, grouped by area, are being confirmed. Rather than list a shop that has sold out or moved on, we are waiting for the up-to-date list.',
    },
  ],
};

/* ================================================================== *
 * WHOLESALE  (D-11)
 * ================================================================== */

export const WHOLESALE: TrustPage = {
  slug: 'wholesale',
  title: 'Wholesale',
  metaDescription: 'Stock Tabasamu Sips in your cafe, shop or restaurant.',
  eyebrow: 'For trade',
  intro:
    'If you run a cafe, a deli or a restaurant and would like to stock Tabasamu, we would like to hear from you. Our trade terms are being finalised.',
  blocks: [
    {
      kind: 'awaiting',
      heading: 'Trade pricing and terms',
      blockedBy: 'D-11',
      interim:
        'Wholesale pricing, minimum order, payment terms and lead time are being confirmed. We would rather quote you a real number than an estimate you have to renegotiate.',
    },
    {
      kind: 'awaiting',
      heading: 'How to enquire',
      blockedBy: 'D-47',
      interim:
        'A dedicated trade contact is being set up. Once our contact details are confirmed, an enquiry form will sit here.',
    },
  ],
};

/* ================================================================== *
 * CORPORATE  (D-12)
 * ================================================================== */

export const CORPORATE: TrustPage = {
  slug: 'corporate',
  title: 'Corporate orders',
  metaDescription: 'Tabasamu Sips for offices, events and gifting in Nairobi.',
  eyebrow: 'For workplaces',
  intro:
    'For an office fridge, an event, or a considered gift, we can put together a larger order. The details of what we offer are being finalised.',
  blocks: [
    {
      kind: 'awaiting',
      heading: 'What we offer',
      blockedBy: 'D-12',
      interim:
        'Our corporate options — tasting packs, an office subscription, a minimum order — are being confirmed. This page will describe exactly what is available rather than promise a bespoke service we have not scoped.',
    },
    {
      kind: 'awaiting',
      heading: 'Gifting',
      blockedBy: 'D-44',
      interim:
        'Whether we offer gift packaging, and how we keep a price off a gift note, is being decided.',
    },
  ],
};

/* ================================================================== *
 * ACCESSIBILITY  — this one is genuinely confirmed: it describes our own
 * build, which is a fact we control. No decision blocks it.
 * ================================================================== */

export const ACCESSIBILITY: TrustPage = {
  slug: 'accessibility',
  title: 'Accessibility',
  metaDescription:
    'How Tabasamu Sips works to be usable by everyone, and how to tell us where it falls short.',
  eyebrow: 'For everyone',
  intro:
    'We want this shop to work for everyone, on any device and any connection. We build to the WCAG 2.2 AA standard and check what can be checked automatically on every change.',
  blocks: [
    {
      kind: 'confirmed',
      heading: 'What we do',
      body: [
        'Every interactive part of the site can be reached and used with a keyboard, and the focus outline is always visible. Colour is never the only way we show meaning. Text can be resized and the page pinch-zoomed without breaking. Movement is small and brief, and is switched off entirely if your device asks for reduced motion.',
        'Contrast between text and its background is measured on every build, and a build that falls below the standard does not ship.',
      ],
    },
    {
      kind: 'confirmed',
      heading: 'Where we are still working',
      body: [
        'A full screen-reader pass and an automated audit against real pages are on our list before launch. We would rather tell you this is in progress than claim a clean bill we have not earned.',
      ],
    },
    {
      kind: 'awaiting',
      heading: 'Telling us where it falls short',
      blockedBy: 'D-47',
      interim:
        'A direct contact for accessibility feedback will be listed here once our contact details are confirmed. If you hit a barrier, we want to know.',
    },
  ],
};

/* ================================================================== *
 * The set, for the sitemap/footer integrity test.
 * ================================================================== */

export const TRUST_PAGES: readonly TrustPage[] = [
  CONTACT,
  DELIVERY_RETURNS,
  PRIVACY,
  TERMS,
  STOCKISTS,
  WHOLESALE,
  CORPORATE,
  ACCESSIBILITY,
];
