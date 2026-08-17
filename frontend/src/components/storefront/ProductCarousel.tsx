'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  CarouselProductCard,
  CAROUSEL_CARD_IMAGE_ASPECT,
} from './CarouselProductCard';
import { cn } from '../../lib/utils/cn';
import type { Product, Inventory } from '../../domain/catalogue';

const SLIDE_GAP = '1.5rem';

/** Slides visible including peek of the next card (desktop: 3 full + ~30% of 4th). */
const SLIDES_VISIBLE = {
  base: 1.15,
  md: 2.3,
  lg: 3.3,
} as const;

const SLIDE_BASIS = {
  base: `calc(100% / ${SLIDES_VISIBLE.base})`,
  md: `calc(100% / ${SLIDES_VISIBLE.md})`,
  lg: `calc(100% / ${SLIDES_VISIBLE.lg})`,
} as const;

/** Match slide basis for nav overlay positioning. */
const SLIDE_WIDTH_CLASS =
  'w-[calc(100%/1.15)] md:w-[calc(100%/2.3)] lg:w-[calc(100%/3.3)]';

const CAROUSEL_EASE = [0.2, 0, 0, 1] as const;

const slideEntrance = (index: number, reducedMotion: boolean | null) =>
  reducedMotion
    ? { opacity: 1, y: 0 }
    : {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.45,
          delay: index * 0.08,
          ease: CAROUSEL_EASE,
        },
      };

function CarouselNavControls({
  showPrev,
  showNext,
  onPrev,
  onNext,
  className,
}: {
  showPrev: boolean;
  showNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}) {
  if (!showPrev && !showNext) return null;

  const btnClass = cn(
    'carousel-nav-btn inline-flex size-12 items-center justify-center rounded-full',
    'shadow-[--shadow-raised]',
    'transition-[background-color,transform] duration-[--duration-fast]',
    'focus-visible:outline-2 focus-visible:outline-[--color-focus-inverse] focus-visible:outline-offset-2'
  );

  return (
    <div className={cn('pointer-events-auto inline-flex', className)}>
      {showPrev && (
        <button type="button" aria-label="Show first products" onClick={onPrev} className={btnClass}>
          <ChevronLeft className="size-6 text-white" strokeWidth={2.25} aria-hidden />
        </button>
      )}
      {showNext && (
        <button type="button" aria-label="Show more products" onClick={onNext} className={btnClass}>
          <ChevronRight className="size-6 text-white" strokeWidth={2.25} aria-hidden />
        </button>
      )}
    </div>
  );
}

export function ProductCollectionCarousel({
  title,
  products,
  inventory,
}: {
  title: string;
  products: readonly Product[];
  inventory: ReadonlyMap<string, Inventory>;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
  });

  const [activeSnap, setActiveSnap] = useState(0);
  const [snapCount, setSnapCount] = useState(1);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveSnap(emblaApi.selectedScrollSnap());
    setSnapCount(emblaApi.scrollSnapList().length);
  }, [emblaApi]);

  const lastSnapIndex = Math.max(0, snapCount - 1);
  const hasMultiplePages = snapCount > 1;
  const showNextControl = activeSnap === 0 && hasMultiplePages;
  const showPrevControl = activeSnap > 0 && hasMultiplePages;

  const scrollToStart = useCallback(() => emblaApi?.scrollTo(0), [emblaApi]);
  const scrollToEnd = useCallback(
    () => emblaApi?.scrollTo(lastSnapIndex),
    [emblaApi, lastSnapIndex]
  );

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('init', onSelect);
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('resize', onSelect);
    return () => {
      emblaApi.off('init', onSelect);
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
      emblaApi.off('resize', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = scrollToStart;
  const scrollNext = scrollToEnd;

  return (
    <>
      <div className="mb-8">
        <h2
          id="collection-heading"
          className="font-display text-[length:--text-h2] font-normal leading-[--leading-snug] text-[--color-ink]"
        >
          {title}
        </h2>
      </div>

      <div className="relative">
        {/* Right-edge fade — reinforces the peek cue on the first page */}
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 z-[1] w-16',
            'collection-carousel-edge-fade',
            'transition-opacity duration-[--duration-base]',
            showNextControl ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden
        />

        <div className="overflow-hidden" ref={emblaRef}>
          <ul
            className="flex touch-pan-y"
            style={{ marginLeft: `calc(${SLIDE_GAP} * -1)` }}
          >
            {products.map((product, i) => (
              <motion.li
                key={product.id}
                className={cn(
                  'min-w-0 shrink-0 grow-0',
                  'basis-[var(--slide-basis)] md:basis-[var(--slide-basis-md)] lg:basis-[var(--slide-basis-lg)]'
                )}
                style={
                  {
                    '--slide-basis': SLIDE_BASIS.base,
                    '--slide-basis-md': SLIDE_BASIS.md,
                    '--slide-basis-lg': SLIDE_BASIS.lg,
                    paddingLeft: SLIDE_GAP,
                  } as React.CSSProperties
                }
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={slideEntrance(i, prefersReducedMotion)}
                viewport={{ once: true, amount: 0.25, margin: '0px 0px -8% 0px' }}
              >
                <CarouselProductCard
                  product={product}
                  inventory={inventory.get(product.variants[0].id as string) ?? null}
                  priority={i < 4}
                />
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Nav cluster — both controls on the right edge, vertically centred on images */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] hidden md:block">
          <div
            className={cn(
              'relative ml-auto',
              CAROUSEL_CARD_IMAGE_ASPECT,
              SLIDE_WIDTH_CLASS
            )}
          >
            <CarouselNavControls
              showPrev={showPrevControl}
              showNext={showNextControl}
              onPrev={scrollPrev}
              onNext={scrollNext}
              className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end md:hidden">
        <CarouselNavControls
          showPrev={showPrevControl}
          showNext={showNextControl}
          onPrev={scrollPrev}
          onNext={scrollNext}
        />
      </div>
    </>
  );
}
