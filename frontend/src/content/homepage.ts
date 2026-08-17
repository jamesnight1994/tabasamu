/**
 * HOMEPAGE COPY — SINGLE SOURCE OF TRUTH
 *
 * Every word the customer reads on the homepage lives here, not scattered
 * through JSX. Two reasons:
 *   1. `scripts/check-brand.mjs` can lint it. A meta description and a hero
 *      headline are both COPY, and copy is where invented claims get in. [R-02]
 *   2. The client can review the whole voice in one file.
 *
 * ─────────────────────────────────────────────────────────────────────
 * VOICE (Brand Book §07). Warm · knowledgeable · specific · brief ·
 * invitational · never preachy.
 *
 * BANNED — and enforced by lint:
 *   no exclamation marks · no "wellness journey" · no "detox" · no "cleanse"
 *   no "treat yourself" · no "vibes" · no "-inspired" · no "ancient wisdom"
 *   no urgency ("hurry", "last chance", "selling fast", "only N left")
 *   no medical claims ("aids digestion", "boosts immunity", "supports gut health")
 * ─────────────────────────────────────────────────────────────────────
 *
 * ⚠ THE PROVENANCE PROBLEM — READ BEFORE EDITING ANY ORIGIN COPY.
 *
 *   D-50 is answered: the base is ROOIBOS.
 *
 *   Rooibos (Aspalathus linearis) grows in the Cederberg region of SOUTH
 *   AFRICA. It is not grown in Kenya, and it essentially cannot be — it needs
 *   that specific fynbos soil and climate.
 *
 *   The Brand Book's origin story says the brand ferments "Kenyan-grown
 *   hibiscus". That is NOT this product.
 *
 *   Therefore the "Rooted in the soil" mantra CANNOT be attached to the tea.
 *   Writing "our Kenyan rooibos" would be a false provenance claim on the
 *   brand's single most important sentence.
 *
 *   What IS true, and what this copy says instead:
 *     · the FRUIT is Kenyan — passion, pineapple, beetroot, gooseberry, grape
 *     · the BREWING is Nairobi's
 *     · the CRAFT and the people are Kenyan
 *     · the rooibos is named as rooibos, and nothing is claimed about where
 *       it grew
 *
 *   This is not a workaround. It is the only honest reading, and it happens to
 *   be a better story: a Kenyan kitchen choosing a caffeine-free base on
 *   purpose, and building the flavour from fruit grown down the road.
 *
 * ⛔ STILL BLOCKED — nothing below invents these:
 *   D-05  ingredients + nutrition (regulated)
 *   D-14  price (every price is a placeholder)
 *   D-21  delivery zones, fees, lead times
 *   D-49  named farms — so no farm is named
 *   D-52  fermentation days (six? fourteen? the sources disagree)
 *   Testimonials — NONE EXIST. None is fabricated. [R-02]
 */

export const HERO = {
  /**
   * ✅ D-13 answered: "Caffeine Free" is the approved descriptor.
   * Specific, not preachy. It states what the drink IS.
   */
  eyebrow: 'Caffeine-free rooibos kombucha',

  /**
   * Restrained. It does not shout, and it does not promise a transformation.
   * "Slowly" is the whole proposition: this is a fourteen-ish-day ferment in a
   * market of shelf-stable soda.
   */
  headline: 'Brewed slowly, in Nairobi.',

  /**
   * ⚠ Note what this sentence does and does not claim. The FRUIT is Kenyan.
   *   The rooibos is named without a provenance claim. See the header note.
   */
  standfirst:
    'A rooibos base, fermented in small batches and finished with fruit grown here. No caffeine, and nothing to recover from.',

  primaryCta: { label: 'Shop the range', href: '/shop' },
  secondaryCta: { label: 'How its made', href: '/our-story' },
} as const;

export const PROPOSITION = {
  eyebrow: 'The short version',
  title: 'Three things worth knowing.',
  /**
   * ✅ "Small-batch" is client-approved (2026-07-14).
   * Each point is a FACT, not a benefit claim. There is no "supports gut
   * health" here, and there will not be — that is a regulated medical claim.
   */
  points: [
    {
      title: 'No caffeine',
      body: 'Rooibos has none to begin with, so none has to be taken out. You can drink this at four in the afternoon and still sleep.',
    },
    {
      title: 'Small batches',
      body: 'We brew in quantities small enough that every batch is tasted before it leaves. When a flavour sells out, it is because it sold out.',
    },
    {
      title: 'Kenyan fruit',
      body: 'Passion, pineapple, beetroot, gooseberry, grape. Grown here, pressed here, and added after the ferment so the flavour stays bright.',
    },
  ],
} as const;

export const COLLECTION = {
  title: 'Six flavours, one system.',
} as const;

export const INGREDIENTS = {
  eyebrow: 'What goes in',
  title: 'Fruit first, then patience.',
  body: 'Every bottle starts the same way: rooibos, steeped and cooled, then fermented with a culture we have kept alive since the first kitchen batch. The fruit goes in last, once the ferment has done its work, which is why the flavour still tastes like the fruit and not like the fermentation.',
  cta: { label: 'Read the full process', href: '/ingredients' },
} as const;

/**
 * Combined ingredients hero + newsletter band.
 * Layout reference: screnshots/subscribe-section.png
 */
export const SUBSCRIBE_SECTION = {
  heroHeadline: 'Fruit first, then patience.',
  heroPrimaryCta: { label: 'See products', href: '/shop' },
  heroSecondaryCta: { label: 'Read ingredients', href: '/ingredients' },
  newsletterLine1: 'Subscribe to our newsletter and',
  newsletterLine2Accent: 'hear when we restock',
  emailPlaceholder: 'Your email',
  submitLabel: 'Subscribe',
} as const;

/**
 * Homepage "Why choose us" band — layout reference: screnshots/why-choose-us.png
 *
 * Uses the same facts as PROPOSITION, presented as an accordion with media
 * on the left. Process steps live on /ingredients and /our-story.
 */
export const WHY_CHOOSE_US = {
  titleLead: 'Why',
  titleAccent: 'Tabasamu Sips',
  title: 'Why Tabasamu Sips.',
  intro:
    'Three facts about what goes into every bottle — a caffeine-free base, batches small enough to taste, and fruit grown here.',
  mediaCaption: 'See where it is brewed',
  mediaCtaLabel: 'Our Story',
  mediaHref: '/our-story',
  /** Second panel open on first paint — matches the reference layout. */
  defaultOpen: 'small-batches',
  points: [
    {
      id: 'no-caffeine',
      title: PROPOSITION.points[0].title,
      body: PROPOSITION.points[0].body,
    },
    {
      id: 'small-batches',
      title: PROPOSITION.points[1].title,
      body: PROPOSITION.points[1].body,
    },
    {
      id: 'kenyan-fruit',
      title: PROPOSITION.points[2].title,
      body: PROPOSITION.points[2].body,
    },
  ],
} as const;

/** @deprecated Use WHY_CHOOSE_US — kept for story/ingredients routes if needed later. */
export const PROCESS = {
  eyebrow: 'How it is made',
  title: 'Four steps, and a wait.',
  steps: [
    {
      title: 'Steep',
      summary: 'Rooibos, hot water, and time.',
      detail:
        'Rooibos is a leaf, not a tea leaf — it comes from a shrub, and it has never contained caffeine. We steep it, then cool it to the temperature the culture can survive.',
    },
    {
      title: 'Ferment',
      summary: 'The culture goes to work.',
      detail:
        'A living culture of bacteria and yeast turns the sugar into acids. This is the step that makes kombucha kombucha, and it is the step you cannot rush.',
    },
    {
      title: 'Finish',
      summary: 'Fruit, added last.',
      detail:
        'The fruit is pressed and added after the ferment, not before. Added before, it ferments too, and you lose the fruit. Added after, it stays itself.',
    },
    {
      title: 'Bottle',
      summary: 'One litre, sealed cold.',
      detail:
        'Bottled cold, in one-litre glass, and refrigerated from that moment. It is a live product. Keep it cold and it keeps its character.',
    },
  ],
} as const;

export const ORIGIN = {
  eyebrow: 'Where it began',
  title: 'A kitchen in Nairobi.',
  /**
   * ⚠ No tourism shorthand. There is no acacia tree, no sunset, no "vibrant
   *   spirit of Africa", no drumming. Brand Book §08 forbids exactly this, and
   *   it is the single easiest way to make a Kenyan brand look like it was
   *   designed in London.
   *
   * ⛔ D-49 — no farm is NAMED, because none has been supplied.
   */
  body: [
    'It started because someone wanted a drink with a bit of complexity to it, and did not want to be awake at midnight for the privilege.',
    'Rooibos was the answer to the caffeine. The fruit was the answer to everything else — and the fruit was already here, at the market, better than anything that could be shipped in.',
    'The batches got bigger. The kitchen did not.',
  ],
  cta: { label: 'The whole story', href: '/our-story' },
} as const;

export const SUBSCRIPTION = {
  eyebrow: 'Recurring delivery',
  title: 'The same box, when you want it.',
  /**
   * ⚠ NO MANIPULATIVE URGENCY, and no fake scarcity. The benefit stated is
   *   the actual, practical benefit: you stop running out. [P-07]
   *
   * ⛔ D-09 — M-PESA has no card-on-file equivalent, so the BILLING MODEL is
   *    undecided (STK re-prompt? Ratiba standing order? pre-paid block?). Four
   *    candidate models produce four different data models.
   *    The section therefore explains the idea and collects interest. It does
   *    NOT take money, and it does not promise a discount percentage that
   *    nobody has approved.
   */
  body: 'Pick your flavours and how often you want them. We will send the same box on the same day, and you can change it or stop it whenever you like.',
  benefits: [
    'You stop running out of the one you actually drink.',
    'Change the flavours, the size, or the date at any time.',
    'Skip a delivery without cancelling anything.',
  ],
} as const;

export const SOCIAL_PROOF = {
  eyebrow: 'What people say',
  title: 'Nothing to show here yet.',
  /**
   * ⚠ THERE ARE NO APPROVED TESTIMONIALS. NONE IS FABRICATED. [R-02, NN-05]
   *
   *   A fabricated review is not a placeholder — it is a lie that a customer
   *   reads and believes, and in several jurisdictions it is illegal. The
   *   honest empty state below is better than an invented one, and it takes
   *   thirty seconds to replace once real quotes exist.
   */
  body: 'We would rather show you nothing than show you something we wrote ourselves. When customers say something worth repeating, and give us permission to repeat it, it will be here.',
} as const;

export const WHOLESALE = {
  eyebrow: 'For business',
  title: 'Cafés, offices, and events.',
  body: 'We supply a small number of places in Nairobi, and we take corporate orders. If you would like the numbers, tell us roughly what you need and we will send them.',
  cta: { label: 'Wholesale enquiries', href: '/wholesale' },
  secondaryCta: { label: 'Corporate orders', href: '/corporate' },
} as const;

export const JOURNAL = {
  eyebrow: 'Journal',
  title: 'Notes from the kitchen.',
  intro: 'Occasional writing about fermentation, fruit, and the people we buy from.',
  cta: { label: 'Read the journal', href: '/journal' },
} as const;

export const NEWSLETTER = {
  eyebrow: 'Keep in touch',
  title: 'When a batch is ready, we will tell you.',
  /**
   * Honest about frequency. "We email rarely" is a promise that can be kept;
   * "join our community" is not a promise at all.
   *
   * ⛔ D-40 — no email provider chosen. The form validates and gives feedback,
   *    but it is NOT WIRED to anything. It says so. [NN-04]
   */
  body: 'Restocks, new flavours, and not much else. We email rarely.',
  consent:
    'We will only use your address to send you these emails. You can unsubscribe from any of them.',
  successTitle: 'You are on the list.',
  successBody: 'We will be in touch when there is something worth saying.',
} as const;

/**
 * ⚠ ANNOUNCEMENT — administratively editable, dismissible.
 *
 * ⛔ There is NO APPROVED ANNOUNCEMENT COPY, and no approved delivery promise
 *    (D-21). So the strip is DISABLED by default. An empty strip, or one
 *    filled with invented delivery claims, is worse than no strip.
 *
 *    The client sets `enabled: true` and writes one calm line. There is no
 *    countdown, no timer, and no "SHOP NOW". [P-07]
 */
export const ANNOUNCEMENT = {
  enabled: false,
  message: '',
  href: undefined as string | undefined,
  linkLabel: undefined as string | undefined,
} as const;

export const META = {
  title: 'Caffeine-free rooibos kombucha, brewed in Nairobi',
  /** ✅ D-13 answered, so the descriptor may now appear in meta. */
  description:
    'Small-batch rooibos kombucha, fermented in Nairobi and finished with Kenyan fruit. Six flavours, one litre, no caffeine.',
} as const;
