import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/seo';
import { SectionHeader } from '../../../components/primitives/Surface';
import { SeoBreadcrumbs } from '../../../components/seo/StructuredData';
import { INGREDIENTS_PAGE } from '../../../content/story';
import { cn } from '../../../lib/utils/cn';

export const metadata: Metadata = pageMeta({
  title: 'Ingredients',
  description: INGREDIENTS_PAGE.metaDescription,
  path: '/ingredients',
});

export default function Page() {
  return (
    <div className="mx-auto max-w-[--container-content] px-4 py-12 md:px-8 md:py-16">
      <SeoBreadcrumbs
        className="mb-8"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Ingredients', path: '/ingredients' },
        ]}
      />

      <SectionHeader
        as="h1"
        eyebrow={INGREDIENTS_PAGE.eyebrow}
        title={INGREDIENTS_PAGE.title}
        intro={INGREDIENTS_PAGE.intro}
      />

      <ol className="mt-10 flex flex-col gap-6">
        {INGREDIENTS_PAGE.process.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span
              aria-hidden="true"
              className="font-mono text-[length:--text-caption] text-[--color-accent]"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-[length:--text-h4]">{step.title}</h2>
              <p className="measure leading-relaxed text-[--color-ink]">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-col gap-6 border-t border-[--color-border] pt-10">
        {INGREDIENTS_PAGE.blocked.map((block) => (
          <section
            key={block.heading}
            className={cn(
              'flex flex-col gap-2 rounded-[--radius-md] border border-[--color-border]',
              'bg-[--color-surface-sunken] p-5'
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[length:--text-h4]">{block.heading}</h2>
              <span className="label-caps rounded-[--radius-pill] border border-[--color-border] px-2.5 py-1 text-[--color-ink-muted]">
                Awaiting confirmation
              </span>
            </div>
            <p className="measure leading-relaxed text-[--color-ink]">{block.interim}</p>
            <p className="font-mono text-[length:--text-micro] text-[--color-ink-subtle]">
              Blocked by {block.blockedBy}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
