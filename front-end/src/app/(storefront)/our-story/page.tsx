import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/seo';
import { SectionHeader, EditorialQuote } from '../../../components/primitives/Surface';
import { SeoBreadcrumbs } from '../../../components/seo/StructuredData';
import { OUR_STORY } from '../../../content/story';

export const metadata: Metadata = pageMeta({
  title: 'Our Story',
  description: OUR_STORY.metaDescription,
  path: '/our-story',
});

export default function Page() {
  return (
    <div className="mx-auto max-w-[--container-content] px-4 py-12 md:px-8 md:py-16">
      <SeoBreadcrumbs
        className="mb-8"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Our Story', path: '/our-story' },
        ]}
      />

      <SectionHeader
        as="h1"
        eyebrow={OUR_STORY.eyebrow}
        title={OUR_STORY.title}
        intro={OUR_STORY.intro}
      />

      <div className="mt-10 flex flex-col gap-8">
        {OUR_STORY.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="text-[length:--text-h4]">{section.heading}</h2>
            {section.body.map((p, i) => (
              <p key={i} className="measure leading-relaxed text-[--color-ink]">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      {/* The mantra — once per page, forest italic. This page owns it. */}
      <div className="mt-12 border-t border-[--color-border] pt-10">
        <EditorialQuote tone="forest">{OUR_STORY.mantra}</EditorialQuote>
      </div>
    </div>
  );
}
