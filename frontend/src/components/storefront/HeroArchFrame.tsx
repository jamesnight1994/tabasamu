'use client';

import { useId } from 'react';
import { SlotImage } from '../editorial/SlotImage';
import { cn } from '../../lib/utils/cn';
import type { ImageSlot } from '../../content/image-slots';

/**
 * Vertical arch frame (~5:7) matching desired-navbar-hero proportions.
 * Portrait crop preferred — arch is taller than it is wide.
 */
export function HeroArchFrame({
  slot,
  priority,
  className,
}: {
  slot: ImageSlot;
  priority?: boolean;
  className?: string;
}) {
  const clipId = useId();

  return (
    <div
      className={cn(
        'relative mx-auto aspect-[5/7] w-auto',
        'h-[min(50vh,28rem)] max-w-[min(100%,17rem)]',
        'lg:h-[min(58vh,32rem)] lg:max-w-none',
        className
      )}
    >
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d="M0.5,0 C0.78,0 1,0.08 1,0.14 L1,1 L0,1 L0,0.14 C0,0.08 0.22,0 0.5,0 Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        className="size-full overflow-hidden"
        style={{ clipPath: `url(#${clipId})` }}
      >
        <SlotImage
          slot={slot}
          priority={priority}
          rounded={false}
          fill
          preferPortrait
          objectPosition="object-[center_35%]"
          className="size-full min-h-full"
        />
      </div>
    </div>
  );
}
