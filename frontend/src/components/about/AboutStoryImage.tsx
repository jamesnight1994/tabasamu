import type { ImageSlot } from '../../content/image-slots';
import {
  HERO_SLOT,
  ORIGIN_SLOT,
  WHY_CHOOSE_US_SLOT,
} from '../../content/image-slots';
import { SlotImage } from '../editorial/SlotImage';
import { cn } from '../../lib/utils/cn';

/** Kitchen editorial — interim process shot until origin-kitchen ships [R-03]. */
export const ABOUT_STORY_KITCHEN_SLOT: ImageSlot = ORIGIN_SLOT.supplied
  ? ORIGIN_SLOT
  : WHY_CHOOSE_US_SLOT;

export const ABOUT_STORY_IMAGE_SLOTS = {
  kitchen: ABOUT_STORY_KITCHEN_SLOT,
  hero: HERO_SLOT,
} as const;

type AboutStoryImageKey = keyof typeof ABOUT_STORY_IMAGE_SLOTS;

export function AboutStoryImage({
  image,
  preferPortrait = false,
}: {
  image: AboutStoryImageKey;
  preferPortrait?: boolean;
}) {
  const slot = ABOUT_STORY_IMAGE_SLOTS[image];

  return (
    <div
      className={cn(
        'about-story-image-card overflow-hidden rounded-[24px]',
        'border border-[--color-border]/60 bg-white shadow-[--shadow-raised]',
        preferPortrait ? 'aspect-5/6' : 'aspect-5/6 md:aspect-4/5'
      )}
    >
      <SlotImage
        slot={slot}
        preferPortrait={preferPortrait}
        rounded={false}
        className="size-full"
        objectPosition="object-center"
      />
    </div>
  );
}
