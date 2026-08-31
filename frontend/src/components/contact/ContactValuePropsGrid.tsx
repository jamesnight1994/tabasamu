'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../lib/utils/cn';

type ContactValuePropsGridProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

/** Keeps all value-prop cards as tall as the tallest card in the grid. */
export function ContactValuePropsGrid({ children, className }: ContactValuePropsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const equalizeHeights = () => {
      const cards = grid.querySelectorAll<HTMLElement>('.contact-value-prop-card');
      if (!cards.length) return;

      cards.forEach((card) => {
        card.style.minHeight = '';
      });

      const maxHeight = Math.max(
        ...Array.from(cards, (card) => card.getBoundingClientRect().height)
      );

      if (maxHeight <= 0) return;

      cards.forEach((card) => {
        card.style.minHeight = `${Math.ceil(maxHeight)}px`;
      });
    };

    equalizeHeights();

    const observer = new ResizeObserver(equalizeHeights);
    observer.observe(grid);
    window.addEventListener('resize', equalizeHeights);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', equalizeHeights);
    };
  }, []);

  return (
    <div ref={gridRef} className={cn(className)}>
      {children}
    </div>
  );
}
