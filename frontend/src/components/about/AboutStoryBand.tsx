import type { ABOUT_PAGE } from '../../content/about';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { EditorialQuote } from '../primitives/Surface';
import { AboutStoryImage } from './AboutStoryImage';
import { cn } from '../../lib/utils/cn';

type StoryBand = (typeof ABOUT_PAGE.story.bands)[number];

type AboutStoryBandProps = {
  band: StoryBand;
  /** First band owns the section heading id for anchor / aria. */
  headingId?: string;
};

function AboutStoryCopy({
  band,
  headingId,
}: {
  band: StoryBand;
  headingId?: string;
}) {
  return (
    <div className="flex flex-col justify-center gap-8 md:gap-10 md:py-4 md:px-2 lg:px-4">
      {'eyebrow' in band && band.eyebrow ? (
        <header className="flex flex-col gap-4">
          <p className="label-caps text-[--color-ink-subtle]">{band.eyebrow}</p>
          {'title' in band && band.title ? (
            <h2
              id={headingId}
              className="font-display text-[length:--text-h2] font-normal leading-[1.08] tracking-[--tracking-tight] text-[--color-ink] md:text-[clamp(2rem,3.5vw,2.75rem)]"
            >
              {band.title}
            </h2>
          ) : null}
          {'intro' in band && band.intro ? (
            <p className="max-w-md text-[length:--text-body] leading-[--leading-body] text-[--color-ink-muted] md:text-[length:--text-small]">
              {band.intro}
            </p>
          ) : null}
        </header>
      ) : null}

      <div className="flex flex-col gap-6 md:gap-7">
        {band.sections.map((section) => (
          <div key={section.heading} className="flex flex-col gap-2.5">
            <h3 className="font-display text-[length:--text-body-lg] leading-[--leading-snug] text-[--color-ink]">
              {section.heading}
            </h3>
            <div className="flex max-w-md flex-col gap-2.5 text-[length:--text-small] leading-[--leading-body] text-[--color-ink-muted]">
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {'mantra' in band && band.mantra ? (
        <EditorialQuote tone="forest">{band.mantra}</EditorialQuote>
      ) : null}
    </div>
  );
}

export function AboutStoryBand({ band, headingId }: AboutStoryBandProps) {
  const imageLeft = band.imagePosition === 'left';
  const textRevealX = imageLeft ? 18 : -18;
  const imageRevealX = imageLeft ? -18 : 18;

  const textColumn = (
    <ScrollReveal delay={0.06} x={textRevealX} className="min-w-0">
      <AboutStoryCopy band={band} headingId={headingId} />
    </ScrollReveal>
  );

  const imageColumn = (
    <ScrollReveal delay={0} x={imageRevealX} className="min-w-0">
      <AboutStoryImage image={band.image} preferPortrait={band.image === 'hero'} />
    </ScrollReveal>
  );

  return (
    <div
      className={cn(
        'contact-section-inset contact-form-section grid gap-10',
        'md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:items-center md:gap-12 lg:gap-16'
      )}
    >
      {imageLeft ? (
        <>
          {imageColumn}
          {textColumn}
        </>
      ) : (
        <>
          {textColumn}
          {imageColumn}
        </>
      )}
    </div>
  );
}
