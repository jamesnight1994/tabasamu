/**
 * FAQ CONTENT  (Phase 8 · §1, §2 · D-46)
 *
 * ⚠ FAQs are, per the decisions register, "where invented claims most often
 *   enter a site — shelf life, pregnancy safety, digestion". So the rule here is
 *   strict:
 *
 *     · A question we can answer from FACTS WE CONTROL (how the shop works, what
 *       the product is at a category level) gets a confirmed answer.
 *     · A question touching health, safety, storage duration, or anything
 *       regulated is `awaitingConfirmation` — it renders on the page as
 *       "answer awaiting confirmation" and is EXCLUDED from FAQ structured data,
 *       because Google requires a complete, visible, factual answer.
 *
 * The `faqJsonLd()` builder emits schema for confirmed entries only, and
 * returns `null` if none qualify.
 */

import type { FaqEntry } from '../lib/seo/structured-data';

export interface FaqItem extends FaqEntry {
  /** For the visible marker when awaiting. */
  readonly blockedBy?: string;
}

export const FAQ_INTRO = {
  eyebrow: 'Questions',
  title: 'The things people ask.',
  intro:
    'What we can answer plainly is here. A few questions — the ones about health and storage — we are confirming carefully rather than guessing, because a specific answer that is wrong is worse than none.',
} as const;

export const FAQS: readonly FaqItem[] = [
  {
    question: 'What is kombucha?',
    answer:
      'A fermented drink. A live culture turns a sweetened tea — in our case rooibos — into something lightly tart and gently fizzy over a number of days. The fermentation is what makes it kombucha rather than a soft drink.',
  },
  {
    question: 'Does it contain caffeine?',
    answer:
      'No. Our base is rooibos, which has never contained caffeine, so there is none to remove. You can drink it late in the day.',
  },
  {
    question: 'Is it alcoholic?',
    answer:
      'Kombucha ferments, and fermentation can produce a trace of alcohol. The exact figure for our drinks is being confirmed with testing before we state it, so we are not putting a number here yet.',
    awaitingConfirmation: true,
    blockedBy: 'D-05',
  },
  {
    question: 'What is in it, exactly?',
    answer:
      'The full ingredient list and nutrition for each flavour are regulated information. They are being confirmed and will appear on each flavour page and label — we will not print an ingredient list from memory.',
    awaitingConfirmation: true,
    blockedBy: 'D-05',
  },
  {
    question: 'How should I store it, and how long does it keep?',
    answer:
      'Keep it refrigerated — it is alive and unpasteurised. The exact shelf life is being confirmed and will be stated on the label rather than estimated here.',
    awaitingConfirmation: true,
    blockedBy: 'D-05',
  },
  {
    question: 'Can I drink it if I am pregnant, or give it to children?',
    answer:
      'This is a health question and we will not answer it from guesswork. Guidance will be added only once confirmed in writing with appropriate advice. If in doubt, ask your doctor.',
    awaitingConfirmation: true,
    blockedBy: 'D-46',
  },
  {
    question: 'Why is the sediment at the bottom?',
    answer:
      'That is the culture, and it is normal in a live kombucha. It is not a fault. A gentle tilt before opening is all it needs.',
  },
  {
    question: 'How much does it cost, and how do I pay?',
    answer:
      'Prices are shown as indicative until approved. Payment by M-PESA and card is being set up; the cart will show the exact total, including any delivery fee, before you pay.',
    awaitingConfirmation: true,
    blockedBy: 'D-14 · D-31 · D-35',
  },
  {
    question: 'Where do you deliver, and what does it cost?',
    answer:
      'Nairobi delivery areas and fees are being confirmed. The fee for your area will be shown before you pay. Full detail is on the delivery and returns page.',
    awaitingConfirmation: true,
    blockedBy: 'D-21 · D-22 · D-23',
  },
];
