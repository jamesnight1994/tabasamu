import { ABOUT_PAGE } from '../../content/about';
import { AboutStoryBand } from './AboutStoryBand';
import { cn } from '../../lib/utils/cn';

const SITE_CONTAINER =
  'container mx-auto w-full max-w-[--container-max] px-6 md:px-12 lg:px-16';

export function AboutStorySection() {
  const { id, bands } = ABOUT_PAGE.story;

  return (
    <section
      id={id}
      aria-labelledby="about-story-heading"
      className="bg-surface"
    >
      <div className={cn(SITE_CONTAINER, 'py-16 md:py-20 lg:py-24')}>
        <div className="flex flex-col gap-10 md:gap-12">
          {bands.map((band, index) => (
            <AboutStoryBand
              key={band.image}
              band={band}
              headingId={index === 0 ? 'about-story-heading' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
