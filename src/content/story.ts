/**
 * OUR STORY & INGREDIENTS COPY  (Phase 8 · §1 · D-49, D-50, D-52, D-05)
 *
 * ⚠ THE PROVENANCE CONSTRAINT (D-50, answered). The base is ROOIBOS, which
 *   grows in South Africa, not Kenya. The Brand Book's "Kenyan-grown hibiscus"
 *   origin line describes a different product and MUST NOT be attached to the
 *   tea. What is true: the FRUIT is Kenyan, the BREWING and CRAFT are Nairobi's,
 *   and the rooibos is named as rooibos with no false provenance claim.
 *
 * ⛔ Still blocked, and not invented below:
 *     D-49  named farms/regions per ingredient → no farm is named
 *     D-52  fermentation days (six? fourteen?) → no day count is stated
 *     D-05  ingredients + nutrition (regulated) → the full list lives on the
 *           label/PDP once confirmed, not here
 *
 * VOICE (Brand Book §07). No exclamation marks, no medical claims, no urgency.
 */

export const OUR_STORY = {
  title: 'Our story.',
  metaDescription:
    'How Tabasamu Sips began — a Nairobi kitchen, a caffeine-free rooibos base, and Kenyan fruit.',
  eyebrow: 'How it began',
  intro:
    'Tabasamu began in a Nairobi kitchen, brewed for friends before it was ever brewed for a shelf.',
  sections: [
    {
      heading: 'A kitchen, and a culture',
      body: [
        'We started with a simple want: a drink you could reach for in the afternoon that left you clear rather than wired. Rooibos was the answer — a leaf with no caffeine to begin with, so none has to be taken out.',
        'We kept a culture alive from the first batch, fed it, and learned its rhythm. It is the same culture we brew with now.',
      ],
    },
    {
      heading: 'Kenyan fruit, added last',
      body: [
        'The rooibos gives the base. The character comes from fruit grown here — passion, pineapple, beetroot, gooseberry, grape — pressed and added after the ferment has done its work, so the flavour still tastes like the fruit and not like the fermentation.',
        'We name the rooibos as rooibos. We do not claim it grew in Kenya, because it did not. What is Kenyan is the fruit, the brewing, and the hands.',
      ],
    },
    {
      heading: 'Small batches, on purpose',
      body: [
        'We brew in quantities small enough that every batch is tasted before it leaves. When a flavour sells out, it is because it sold out — not a tactic. The next batch comes when it is ready.',
      ],
    },
  ],
  mantra: 'Rooted in the soil, crafted for the soul.',
} as const;

export const INGREDIENTS_PAGE = {
  title: 'Ingredients.',
  metaDescription:
    'What goes into Tabasamu Sips — a caffeine-free rooibos base, a live culture, and Kenyan fruit.',
  eyebrow: 'What goes in',
  intro:
    'Every bottle starts the same way, and the fruit goes in last. Here is the process, plainly.',
  process: [
    {
      title: 'Steep',
      body: 'Rooibos, steeped and cooled to a temperature the culture can survive. Rooibos comes from a shrub, not a tea plant, and has never contained caffeine.',
    },
    {
      title: 'Ferment',
      body: 'A living culture of bacteria and yeast turns the sugar into gentle acids. This is the step that makes kombucha kombucha, and the step that cannot be rushed.',
    },
    {
      title: 'Add the fruit',
      body: 'Kenyan fruit goes in after the ferment, so the flavour stays bright and tastes of the fruit itself.',
    },
    {
      title: 'Chill',
      body: 'It is kept cold from there on. Tabasamu is unpasteurised and alive, so the fridge is where it belongs.',
    },
  ],
  // ⛔ These render as honest "awaiting" notes on the page.
  blocked: [
    {
      heading: 'The full ingredient list and nutrition',
      blockedBy: 'D-05',
      interim:
        'Per-flavour ingredients and nutrition are regulated information. They are being confirmed and will appear on each flavour page and label, not written from memory here.',
    },
    {
      heading: 'Where each fruit is grown',
      blockedBy: 'D-49',
      interim:
        'Specificity is how we earn trust, so we will name farms and regions only once confirmed — not approximate them.',
    },
    {
      heading: 'How long it ferments',
      blockedBy: 'D-52',
      interim:
        'Our sources disagree on the exact number of days, and a specific number that is wrong is worse than none. We are confirming it before we print it.',
    },
  ],
} as const;
