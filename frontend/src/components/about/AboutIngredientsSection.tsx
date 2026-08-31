import { ABOUT_PAGE } from '../../content/about';
import {
  ScrollReveal,
  ScrollRevealItem,
  ScrollRevealStagger,
} from '@/components/motion/ScrollReveal';
import { AboutProcessCard } from './AboutProcessCard';
import { AboutProcessGrid } from './AboutProcessGrid';
import { AboutProcessMedia } from './AboutProcessMedia';
import { cn } from '../../lib/utils/cn';

const SITE_CONTAINER =
  'container mx-auto w-full max-w-[--container-max] px-6 md:px-12 lg:px-16';

export function AboutIngredientsSection() {
  const { id, eyebrow, title, intro, process } = ABOUT_PAGE.ingredients;

  return (
    <section
      id={id}
      aria-labelledby="about-ingredients-heading"
      className="about-ingredients"
    >
      <div className={cn(SITE_CONTAINER, 'py-10 md:py-12 lg:py-14')}>
        <div className="!px-4 pb-8 contact-section-inset flex flex-col gap-7 md:gap-8 lg:gap-9">
          <ScrollReveal delay={0} y={14}>
            <header className="flex max-w-2xl flex-col gap-3 md:max-w-3xl md:gap-3.5">
              <div className="flex items-center gap-2.5">
                {/* <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full bg-[--color-link]"
                /> */}
                <p className="label-caps text-[--color-ink-muted]">{eyebrow}</p>
              </div>
              <h2
                id="about-ingredients-heading"
                className="font-display text-[length:--text-h2] font-normal leading-[--leading-snug] text-[--color-ink]"
              >
                {title}
              </h2>
              <p className="max-w-xl text-[length:--text-body] leading-[--leading-body] text-[--color-ink-muted] md:text-[length:--text-small]">
                {intro}
              </p>
            </header>
          </ScrollReveal>

          <div className="about-ingredients-layout grid gap-6 sm:grid-cols-2 sm:gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch lg:gap-8 xl:gap-10">
            <AboutProcessMedia />

            <AboutProcessGrid className="h-full min-h-0 sm:col-span-2 lg:col-span-1">
              <ScrollRevealStagger
                as="div"
                staggerChildren={0.16}
                delayChildren={0.05}
                className="about-process-grid grid h-full min-h-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-rows-2"
              >
                {process.map((step, i) => (
                  <ScrollRevealItem as="div" key={step.title} className="h-full min-h-0">
                    <AboutProcessCard index={i} title={step.title} body={step.body} />
                  </ScrollRevealItem>
                ))}
              </ScrollRevealStagger>
            </AboutProcessGrid>
          </div>
        </div>
      </div>
    </section>
  );
}
