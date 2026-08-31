/**
 * OUR STORY & INGREDIENTS COPY  (Phase 8 · §1 · D-49, D-50, D-52, D-05)
 *
 * @deprecated Re-exports from `./about` for legacy imports. `/our-story` and
 *   `/ingredients` redirect to `/about`.
 */

import { ABOUT_PAGE } from './about';

export const OUR_STORY = {
  title: 'Our story.',
  metaDescription: ABOUT_PAGE.meta.description,
  eyebrow: ABOUT_PAGE.story.bands[0].eyebrow,
  intro: ABOUT_PAGE.story.bands[0].intro,
  sections: ABOUT_PAGE.story.bands.flatMap((band) => band.sections),
  mantra: ABOUT_PAGE.story.bands[1].mantra ?? '',
} as const;

export const INGREDIENTS_PAGE = {
  title: 'Ingredients.',
  metaDescription:
    'What goes into Tabasamu Sips — a caffeine-free rooibos base, a live culture, and Kenyan fruit.',
  eyebrow: ABOUT_PAGE.ingredients.eyebrow,
  intro: ABOUT_PAGE.ingredients.intro,
  process: ABOUT_PAGE.ingredients.process,
} as const;
