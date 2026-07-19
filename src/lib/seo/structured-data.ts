/**
 * STRUCTURED DATA (JSON-LD)  (Phase 8 · §2)
 *
 * Every builder here follows one rule, the same one that governs `productJsonLd`:
 *
 *   ⛔ NEVER EMIT SCHEMA FOR CONTENT THAT DOES NOT EXIST.
 *
 * Structured data is a claim made TO A MACHINE, republished AT SCALE, to an
 * audience that cannot see the caveat sitting next to it on the page. FAQ
 * schema for an invented answer, breadcrumb schema for a fake trail, or article
 * schema for a page with no author — each is a lie Google will amplify. So each
 * builder returns `null` when its inputs are incomplete, and the caller simply
 * renders nothing.
 *
 * Google's own guidance backs the withholding: FAQ rich results require the
 * answer to be VISIBLE ON THE PAGE and non-promotional. A blocked answer
 * (D-46) is neither, so it is excluded from the schema even though the question
 * may still appear on the page as "answer awaiting confirmation".
 */

import { clientEnv } from '../config/env';
import { SITE_NAME } from './index';

const baseUrl = (): string => clientEnv().NEXT_PUBLIC_APP_URL;
const abs = (path: string): string => new URL(path, baseUrl()).toString();

/* ------------------------------------------------------------------ *
 * WebSite  — enables the sitename treatment in results.
 * No `potentialAction`/SearchAction: on-site search is not offered at
 * launch (D-48, recommended omitted), so we do not advertise one.
 * ------------------------------------------------------------------ */

export interface WebSiteJsonLd {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
}

export const websiteJsonLd = (): WebSiteJsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: baseUrl(),
});

/* ------------------------------------------------------------------ *
 * BreadcrumbList
 * ------------------------------------------------------------------ */

export interface Breadcrumb {
  readonly name: string;
  readonly path: string;
}

export interface BreadcrumbJsonLd {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

/**
 * Returns `null` for a trail with fewer than two crumbs — a one-item breadcrumb
 * is noise, not navigation, and Google will flag it.
 */
export const breadcrumbJsonLd = (trail: readonly Breadcrumb[]): BreadcrumbJsonLd | null => {
  if (trail.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
};

/* ------------------------------------------------------------------ *
 * FAQPage
 *
 * ⛔ D-46: most FAQ answers touch shelf life, storage, pregnancy, or digestion
 *    and MUST come from the client in writing. An answer that is blocked, empty,
 *    or marked "awaiting confirmation" is EXCLUDED here — even if it renders on
 *    the page — because Google requires a complete, visible, factual answer.
 * ------------------------------------------------------------------ */

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
  /** When true the answer is not client-confirmed and is excluded from schema. */
  readonly awaitingConfirmation?: boolean;
}

export interface FaqJsonLd {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: { '@type': 'Answer'; text: string };
  }[];
}

/**
 * Emits schema ONLY for entries whose answers are confirmed and non-empty.
 * Returns `null` if none qualify — so a page of blocked answers produces no
 * FAQ rich result rather than a misleading one.
 */
export const faqJsonLd = (entries: readonly FaqEntry[]): FaqJsonLd | null => {
  const eligible = entries.filter(
    (e) => !e.awaitingConfirmation && e.answer.trim().length > 0
  );
  if (eligible.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: eligible.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: { '@type': 'Answer', text: e.answer },
    })),
  };
};

/* ------------------------------------------------------------------ *
 * Article  — for the Journal, when it has real, authored posts.
 * ------------------------------------------------------------------ */

export interface ArticleInput {
  readonly headline: string;
  readonly path: string;
  readonly datePublished?: string;
  readonly dateModified?: string;
  readonly image?: string;
  /** ⛔ No author is invented. Omit until a real byline exists. */
  readonly authorName?: string;
}

export interface ArticleJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  url: string;
  publisher: { '@type': 'Organization'; name: string };
  datePublished?: string;
  dateModified?: string;
  image?: string;
  author?: { '@type': 'Person'; name: string };
}

/**
 * Returns `null` without a publication date — an Article with no date is
 * incomplete for Google and undatable for a reader.
 */
export const articleJsonLd = (input: ArticleInput): ArticleJsonLd | null => {
  if (!input.datePublished) return null;
  const out: ArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    url: abs(input.path),
    publisher: { '@type': 'Organization', name: SITE_NAME },
    datePublished: input.datePublished,
  };
  if (input.dateModified) out.dateModified = input.dateModified;
  if (input.image) out.image = abs(input.image);
  if (input.authorName) out.author = { '@type': 'Person', name: input.authorName };
  return out;
};

/**
 * A tiny helper for rendering any JSON-LD object as a script tag's content.
 * Returns an empty string for `null`, so `{jsonLdString(x)}` is always safe.
 *
 * ⚠ PHASE 9 — THE `</script>` BREAKOUT ESCAPE NOW LIVES HERE.
 *
 *   Inline `<script>` content is HTML, not JavaScript: a raw `<` in a string
 *   value (e.g. `"<script>"` inside a name) can prematurely close the tag and
 *   inject markup. `JSON.stringify` does NOT escape `<`, so every inline
 *   JSON-LD block must escape it as `\u003c` (valid JSON, inert HTML).
 *
 *   This was previously applied only in the `<JsonLd>` component, while
 *   `layout.tsx` serialised organisation/website schema with a bare
 *   `JSON.stringify`. Two emission paths, one of them unescaped, is exactly the
 *   kind of inconsistency that becomes a hole the day user-derived text reaches
 *   a builder. Escaping HERE makes every caller — component or layout —
 *   uniformly safe, by construction, regardless of how the string is emitted.
 *
 *   Our schema values are controlled copy today, so this is defence in depth,
 *   not a live vulnerability. It is written so it stays that way. [S-3]
 */
export const jsonLdString = (data: object | null): string =>
  data ? JSON.stringify(data).replace(/</g, '\\u003c') : '';
