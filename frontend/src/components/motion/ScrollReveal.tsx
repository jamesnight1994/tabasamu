'use client';

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

const EASE = [0.2, 0, 0, 1] as const;

export const SCROLL_REVEAL_VIEWPORT = {
  once: true,
  amount: 0.18,
  margin: '0px 0px -6% 0px',
} as const;

type ScrollRevealProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children: ReactNode;
  /** Animate on mount (hero) instead of when scrolled into view. */
  immediate?: boolean;
  delay?: number;
  y?: number;
  x?: number;
  duration?: number;
};

export function ScrollReveal({
  children,
  className,
  immediate = false,
  delay = 0,
  y = 22,
  x = 0,
  duration = 0.55,
  ...rest
}: ScrollRevealProps) {
  const reduced = useReducedMotion();
  const hidden = reduced ? false : { opacity: 0, y, x };
  const shown = reduced ? undefined : { opacity: 1, y: 0, x: 0 };
  const transition = reduced ? undefined : { duration, ease: EASE, delay };

  return (
    <motion.div
      className={cn(className)}
      initial={hidden}
      {...(immediate
        ? { animate: shown, transition }
        : { whileInView: shown, viewport: SCROLL_REVEAL_VIEWPORT, transition })}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

type ScrollRevealStaggerProps = {
  children: ReactNode;
  className?: string;
  as?: 'ul' | 'div';
  immediate?: boolean;
  staggerChildren?: number;
  delayChildren?: number;
};

export function ScrollRevealStagger({
  children,
  className,
  as = 'ul',
  immediate = false,
  staggerChildren = 0.11,
  delayChildren = 0.06,
}: ScrollRevealStaggerProps) {
  const reduced = useReducedMotion();
  const Component = as === 'ul' ? motion.ul : motion.div;

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren, delayChildren },
    },
  };

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={className}
      variants={containerVariants}
      initial="hidden"
      {...(immediate
        ? { animate: 'visible' }
        : { whileInView: 'visible', viewport: SCROLL_REVEAL_VIEWPORT })}
    >
      {children}
    </Component>
  );
}

type ScrollRevealItemProps = {
  children: ReactNode;
  className?: string;
  as?: 'li' | 'div';
};

export function ScrollRevealItem({
  children,
  className,
  as = 'li',
}: ScrollRevealItemProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const Component = as === 'li' ? motion.li : motion.div;

  return (
    <Component className={cn(className)} variants={staggerItem}>
      {children}
    </Component>
  );
}

/** @deprecated Use ScrollReveal from `@/components/motion/ScrollReveal`. */
export const ContactReveal = ScrollReveal;

/** @deprecated Use ScrollRevealStagger. */
export const ContactRevealStagger = ScrollRevealStagger;

/** @deprecated Use ScrollRevealItem. */
export const ContactRevealItem = ScrollRevealItem;
