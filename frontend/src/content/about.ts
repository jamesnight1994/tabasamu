/**
 * ABOUT US — combined story + ingredients (replaces /our-story, /ingredients).
 *
 * ⚠ THE PROVENANCE CONSTRAINT (D-50). Rooibos grows in South Africa, not Kenya.
 *   What is Kenyan: the fruit, the brewing, and the hands.
 *
 * ⛔ Still blocked — honest interim copy only:
 *     D-49  named farms/regions
 *     D-52  fermentation days
 *     D-05  ingredients + nutrition (regulated)
 *
 * VOICE (Brand Book §07). No exclamation marks, no medical claims, no urgency.
 */

export const ABOUT_PAGE = {
  meta: {
    title: 'About us',
    description:
      'How Tabasamu Sips began and what goes into every bottle — a Nairobi kitchen, a caffeine-free rooibos base, Kenyan fruit, and a process we do not rush.',
  },
  hero: {
    eyebrow: 'Who we are',
    title: 'About us',
  },
  story: {
    id: 'story',
    bands: [
      {
        image: 'kitchen',
        imagePosition: 'left',
        eyebrow: 'How it began',
        title: 'A Nairobi kitchen.',
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
        ],
      },
      {
        image: 'hero',
        imagePosition: 'right',
        eyebrow: 'What we add',
        title: 'Kenyan fruit, added last.',
        intro:
          'The rooibos gives the base; the character comes from fruit grown here — passion, pineapple, beetroot, gooseberry, grape — pressed and added after the ferment has done its work, so the flavour still tastes like the fruit and not like the fermentation. We name the rooibos as rooibos and do not claim it grew in Kenya, because it did not. What is Kenyan is the fruit, the brewing, and the hands.',
        sections: [
          {
            heading: 'Small batches, on purpose',
            body: [
              'Every batch is tasted before it leaves. When a flavour sells out, it sold out — not a tactic. The next batch comes when it is ready.',
            ],
          },
        ],
        mantra: 'Rooted in the soil, crafted for the soul.',
      },
    ],
  },
  ingredients: {
    id: 'ingredients',
    eyebrow: 'What goes in',
    title: 'Four steps, and a wait.',
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
  },
} as const;
