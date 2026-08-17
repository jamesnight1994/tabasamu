import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/seo';
import { SectionHeader } from '../../../components/primitives/Surface';
import { SeoBreadcrumbs, JsonLd } from '../../../components/seo/StructuredData';
import { faqJsonLd } from '../../../lib/seo/structured-data';
import { FAQS, FAQ_INTRO } from '../../../content/faqs';
import { cn } from '../../../lib/utils/cn';

/**
 * FAQs  (Phase 8 · §1, §2)
 *
 * Every question renders. A confirmed answer shows as prose; an unconfirmed one
 * shows with an "awaiting confirmation" marker AND is excluded from the FAQ
 * structured data. `faqJsonLd()` returns only eligible entries — so Google
 * never receives a health or storage answer we have not confirmed.
 */
export const metadata: Metadata = pageMeta({
  title: 'FAQs',
  description:
    'Common questions about Tabasamu Sips — caffeine, storage, delivery and more. Answered plainly, or honestly marked as being confirmed.',
  path: '/faqs',
});

export default function Page() {
  // ⚠ Only confirmed answers become schema. This is the on-page enforcement of
  //   the D-46 rule.
  const schema = faqJsonLd(FAQS);

  return (
    <div className="mx-auto max-w-[--container-content] px-4 py-12 md:px-8 md:py-16">
      <JsonLd data={schema} />

      <SeoBreadcrumbs
        className="mb-8"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'FAQs', path: '/faqs' },
        ]}
      />

      <SectionHeader
        as="h1"
        eyebrow={FAQ_INTRO.eyebrow}
        title={FAQ_INTRO.title}
        intro={FAQ_INTRO.intro}
      />

      <dl className="mt-10 flex flex-col gap-8">
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className={cn(
              'flex flex-col gap-2',
              faq.awaitingConfirmation &&
                'rounded-[--radius-md] border border-[--color-border] bg-[--color-surface-sunken] p-5'
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="text-[length:--text-h4]">{faq.question}</dt>
              {faq.awaitingConfirmation && (
                <span className="label-caps rounded-[--radius-pill] border border-[--color-border] px-2.5 py-1 text-[--color-ink-muted]">
                  Awaiting confirmation
                </span>
              )}
            </div>
            <dd className="measure leading-relaxed text-[--color-ink]">{faq.answer}</dd>
            {faq.awaitingConfirmation && faq.blockedBy && (
              <p className="font-mono text-[length:--text-micro] text-[--color-ink-subtle]">
                Blocked by {faq.blockedBy}
              </p>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}
