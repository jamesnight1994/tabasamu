/**
 * STOREFRONT SECTIONS
 *
 * ⚠ THESE ARE SERVER COMPONENTS. There is deliberately NO `'use client'` here.
 *
 *   Six of these nine sections are pure static markup — Proposition,
 *   Ingredients, Origin, Subscription, SocialProof, Wholesale, JournalPreview.
 *   Marking the whole module `'use client'` would ship every one of them to the
 *   browser as JavaScript, to do nothing but render text that never changes.
 *
 *   On a mid-range Android over Nairobi 3G, that is bytes the customer pays for
 *   and CPU they wait on, for zero interactivity. [P-10]
 *
 *   Interactivity is pushed to the LEAVES that actually need it:
 *     · ProductCard  — `'use client'` (quick-add feedback)
 *     · Accordion    — `'use client'` (Radix, inside Process)
 *     · Newsletter   — `'use client'` (form state)
 *     · AnnouncementBar — `'use client'` (dismissal)
 *
 *   Everything else is HTML on arrival.
 *
 * Each is a reusable, self-contained band. They are composed by the homepage
 * and are reusable on other routes.
 *
 * A note that governs all of them: this is an EDITORIAL page that sells, not a
 * landing page with a story bolted on. So the rhythm alternates — type, image,
 * type, image — and the sections breathe. Generous vertical space is not
 * decoration; it is what stops six selling propositions reading as a pitch.
 */

import Link from 'next/link';
import { Button } from '../primitives/Button';
import { Accordion } from '../primitives/Overlay';
import { SectionHeader, Card, EditorialQuote } from '../primitives/Surface';
import { SlotImage } from '../editorial/SlotImage';
import {
  PROCESS_SLOT,
  ORIGIN_SLOT,
  INGREDIENTS_SLOT,
  JOURNAL_SLOT,
} from '../../content/image-slots';
import {
  PROPOSITION,
  INGREDIENTS,
  PROCESS,
  ORIGIN,
  SUBSCRIPTION,
  SOCIAL_PROOF,
  WHOLESALE,
  JOURNAL,
} from '../../content/homepage';
import { cn } from '../../lib/utils/cn';

/** Consistent vertical rhythm. Every band uses it. */
const BAND = 'mx-auto max-w-[--container-max] px-4 py-16 md:px-8 md:py-24';

/* ================================================================== *
 * 4. BRAND PROPOSITION
 * ================================================================== */

export function Proposition() {
  return (
    <section
      aria-labelledby="proposition-heading"
      // A forest band. Cream on forest is 6.0:1 — AA.
      className="bg-[--color-link] text-[--color-ink-inverse]"
      data-ground="dark"
    >
      <div className={BAND}>
        <p className="label-caps mb-4 text-[--color-ink-inverse]/70">{PROPOSITION.eyebrow}</p>
        <h2
          id="proposition-heading"
          className="mb-12 max-w-[--measure-wide] text-[--color-ink-inverse]"
        >
          {PROPOSITION.title}
        </h2>

        {/*
          ⚠ THREE POINTS, AS PROSE. Not icons.
            The brief asks for "editorial layout rather than icon clutter", and
            an icon row is the single fastest way to make a considered brand
            look like a SaaS pricing page. There is no leaf icon, no droplet,
            no shield.
        */}
        <ul className="grid gap-10 md:grid-cols-3 md:gap-12">
          {PROPOSITION.points.map((point, i) => (
            <li key={point.title} className="flex flex-col gap-3">
              {/* A numeral, in Fraunces. The only ornament, and it is typographic. */}
              <span
                aria-hidden="true"
                className="font-display text-[length:--text-h2] leading-none text-[--color-ink-inverse]/30"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-[length:--text-h4] text-[--color-ink-inverse]">
                {point.title}
              </h3>
              <p className="text-[length:--text-small] leading-[--leading-body] text-[--color-ink-inverse]/85">
                {point.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ================================================================== *
 * 5. INGREDIENT / FLAVOUR STORYTELLING
 * ================================================================== */

export function Ingredients() {
  return (
    <section aria-labelledby="ingredients-heading" className={BAND}>
      <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-16">
        <SlotImage slot={INGREDIENTS_SLOT} />

        <div className="flex flex-col gap-6">
          <SectionHeader
            eyebrow={INGREDIENTS.eyebrow}
            title={INGREDIENTS.title}
            as="h2"
          />
          <p className="measure text-[length:--text-body-lg] text-[--color-ink-muted]">
            {INGREDIENTS.body}
          </p>
          <div>
            <Button asChild variant="secondary">
              <Link href={INGREDIENTS.cta.href}>{INGREDIENTS.cta.label}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * 6. PROCESS — with progressive disclosure
 * ================================================================== */

export function Process() {
  return (
    <section aria-labelledby="process-heading" className="bg-[--color-surface-sunken]">
      <div className={BAND}>
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeader eyebrow={PROCESS.eyebrow} title={PROCESS.title} as="h2" />

            {/*
              ⚠ PROGRESSIVE DISCLOSURE, as the brief requires.
                The summary line is enough for someone who is scanning. The
                detail is one tap away for someone who actually wants to know
                what a SCOBY is. Nobody is made to read a science lesson to buy
                a drink, and nobody curious is starved.
            */}
            <Accordion
              items={PROCESS.steps.map((step, i) => ({
                value: `step-${i}`,
                trigger: `${String(i + 1).padStart(2, '0')} · ${step.title} — ${step.summary}`,
                content: <p>{step.detail}</p>,
              }))}
            />

            {/*
              ⛔ D-52 — the fermentation DURATION is not stated anywhere above.
                 The Brand Book says six days; the Marketing Strategy says
                 fourteen. A specific number that is wrong is worse than no
                 number, so no number appears. [NN-05]
            */}
            <p className="spec-mono text-[--color-ink-subtle]">
              ⛔ D-52 · ferment duration not confirmed — no figure is published
            </p>
          </div>

          <SlotImage slot={PROCESS_SLOT} />
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * 7. ORIGIN STORY
 * ================================================================== */

export function Origin() {
  return (
    <section aria-labelledby="origin-heading" className={BAND}>
      <div className="grid gap-8 md:grid-cols-12 md:items-center md:gap-16">
        <div className="flex flex-col gap-6 md:col-span-6 md:col-start-1">
          <SectionHeader eyebrow={ORIGIN.eyebrow} title={ORIGIN.title} as="h2" />

          <div className="measure flex flex-col gap-4 text-[length:--text-body-lg] text-[--color-ink-muted]">
            {ORIGIN.body.map((para) => (
              <p key={para.slice(0, 24)}>{para}</p>
            ))}
          </div>

          {/*
            The mantra. Fraunces italic, forest.
            Brand Book: "once per page, maximum" — so the Footer does NOT also
            render it on this page. See `Homepage`.
          */}
          <EditorialQuote className="mt-4">
            Rooted in the soil, crafted for the soul.
          </EditorialQuote>

          <div>
            <Button asChild variant="secondary">
              <Link href={ORIGIN.cta.href}>{ORIGIN.cta.label}</Link>
            </Button>
          </div>
        </div>

        <div className="md:col-span-5 md:col-start-8">
          <SlotImage slot={ORIGIN_SLOT} />
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * 8. SUBSCRIPTION
 * ================================================================== */

export function Subscription() {
  return (
    <section aria-labelledby="subscription-heading" className={BAND}>
      <Card className="p-6 md:p-12">
        <div className="grid gap-8 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeader
              eyebrow={SUBSCRIPTION.eyebrow}
              title={SUBSCRIPTION.title}
              as="h2"
            />
            <p className="measure text-[length:--text-body-lg] text-[--color-ink-muted]">
              {SUBSCRIPTION.body}
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <ul className="flex flex-col gap-4">
              {SUBSCRIPTION.benefits.map((b) => (
                <li key={b} className="flex gap-3 text-[--color-ink-muted]">
                  {/* A rule, not a tick icon. */}
                  <span
                    aria-hidden="true"
                    className="mt-3 h-px w-4 shrink-0 bg-[--color-decor]"
                  />
                  <span className="text-[length:--text-small]">{b}</span>
                </li>
              ))}
            </ul>

            {/*
              ⛔ D-09 — M-PESA has NO CARD-ON-FILE EQUIVALENT. A subscriber
                 cannot be silently charged each cycle. Four candidate billing
                 models (STK re-prompt / Ratiba standing order / card-only —
                 but see D-35 / pre-paid block) produce four DIFFERENT data
                 models and interfaces.

                 So this section explains the idea and stops. It does not take
                 money, it does not quote a discount percentage nobody has
                 approved, and it does not pretend to work. [NN-04, R-06]
            */}
            <div className="rounded-[--radius-md] border border-dashed border-[--color-warning] bg-[--color-warning-bg] p-4">
              <p className="spec-mono mb-2 text-[length:--text-caption] text-[--color-ink]">
                ⛔ D-09 · billing model not chosen
              </p>
              <p className="text-[length:--text-caption] leading-snug text-[--color-ink-muted]">
                M-PESA has no card-on-file equivalent, so a recurring charge cannot be taken
                silently. The billing model must be decided before this can be built. No savings
                figure is shown, because none has been approved.
              </p>
            </div>

            <Button disabled fullWidth>
              Subscriptions — not yet available
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}

/* ================================================================== *
 * 9. SOCIAL PROOF
 *
 * ⚠ THERE ARE NO APPROVED TESTIMONIALS. NONE IS FABRICATED.
 *
 *   A fabricated review is not a placeholder. It is a lie a customer reads and
 *   believes, and in Kenya, the UK and the EU it is unlawful. The structure is
 *   built and tested; the content is honestly absent. [R-02, NN-05]
 * ================================================================== */

export function SocialProof() {
  return (
    <section aria-labelledby="social-proof-heading" className="bg-[--color-surface-sunken]">
      <div className={cn(BAND, 'flex flex-col items-center text-center')}>
        <p className="label-caps mb-4 text-[--color-ink-muted]">{SOCIAL_PROOF.eyebrow}</p>
        <h2 id="social-proof-heading" className="mb-6 text-[length:--text-h2]">
          {SOCIAL_PROOF.title}
        </h2>
        <p className="measure-narrow text-[length:--text-body-lg] text-[--color-ink-muted]">
          {SOCIAL_PROOF.body}
        </p>

        {/*
          The structure a real testimonial will occupy, rendered as three empty
          frames. It shows the client exactly what is needed, and it cannot be
          mistaken for a review.
        */}
        <ul
          aria-label="Testimonial slots, awaiting approved customer quotes"
          className="mt-12 grid w-full grid-cols-1 gap-4 md:grid-cols-3"
        >
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex min-h-40 flex-col justify-between rounded-[--radius-lg] border border-dashed border-[--color-border-strong] p-5 text-left"
            >
              <p className="text-[length:--text-small] italic text-[--color-ink-subtle]">
                Awaiting an approved customer quote.
              </p>
              <p className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
                testimonial-{i + 1} · name, and permission to use it
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ================================================================== *
 * 10. WHOLESALE / CORPORATE
 * ================================================================== */

export function Wholesale() {
  return (
    <section aria-labelledby="wholesale-heading" className={BAND}>
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-6">
          <SectionHeader eyebrow={WHOLESALE.eyebrow} title={WHOLESALE.title} as="h2" />
          <p className="measure text-[length:--text-body-lg] text-[--color-ink-muted]">
            {WHOLESALE.body}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href={WHOLESALE.cta.href}>{WHOLESALE.cta.label}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={WHOLESALE.secondaryCta.href}>{WHOLESALE.secondaryCta.label}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * 11. JOURNAL PREVIEW
 *
 * ⛔ NO JOURNAL ENTRIES EXIST. None is invented — a fabricated article with a
 *    fabricated date is a lie with a byline.
 * ================================================================== */

export function JournalPreview() {
  return (
    <section aria-labelledby="journal-heading" className={BAND}>
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          eyebrow={JOURNAL.eyebrow}
          title={JOURNAL.title}
          intro={JOURNAL.intro}
          as="h2"
        />
        <Button asChild variant="ghost" className="shrink-0 self-start md:self-end">
          <Link href={JOURNAL.cta.href}>{JOURNAL.cta.label}</Link>
        </Button>
      </div>

      <ul className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex flex-col gap-4">
            <SlotImage slot={{ ...JOURNAL_SLOT, id: `journal-${i + 1}` }} />
            <div className="rounded-[--radius-md] border border-dashed border-[--color-border-strong] p-4">
              <p className="spec-mono mb-1 text-[length:--text-micro] text-[--color-ink-subtle]">
                journal-entry-{i + 1}
              </p>
              <p className="text-[length:--text-caption] text-[--color-ink-muted]">
                Awaiting a written entry. No article, title or date is invented.
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
