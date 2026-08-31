import Image from 'next/image';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { cn } from '../../lib/utils/cn';

const PROCESS_IMAGE = {
  src: '/process/prep.jpg',
  alt: 'Preparing rooibos and fruit for brewing at Tabasamu Sips.',
} as const;

export function AboutProcessMedia() {
  return (
    <ScrollReveal delay={0.04} x={-16} className="h-full min-h-0 min-w-0 sm:col-span-2 lg:col-span-1">
      <figure className={cn('about-process-media', 'relative m-0 h-full min-h-72 overflow-hidden')}>
        <Image
          src={PROCESS_IMAGE.src}
          alt={PROCESS_IMAGE.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 42vw"
          className="object-cover"
        />
        <figcaption className="sr-only">{PROCESS_IMAGE.alt}</figcaption>
      </figure>
    </ScrollReveal>
  );
}
