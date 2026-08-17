'use client';

/**
 * SITE HEADER
 *
 * Hides on scroll down, reveals on scroll up. Transform-only animation with a
 * fixed layout spacer. Solid surface background whenever visible mid-page.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Navbar, type NavbarProps } from './Navbar';
import { cn } from '../../lib/utils/cn';

export type { NavbarProps as HeaderProps };

/** Re-export menu data for any consumers that still import from Header. */
export { NAV_MENU as PRIMARY_NAV } from '../../content/navigation';

const SCROLL_DELTA = 12;

export function Header({ cartCount = 0, onCartClick }: NavbarProps) {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const visibleRef = useRef(true);
  const ticking = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const syncHeight = () => setHeaderHeight(node.offsetHeight);
    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [scrolled, visible]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    setScrolled(window.scrollY > 0);

    const update = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 0);

      if (currentY <= 0) {
        if (!visibleRef.current) {
          visibleRef.current = true;
          setVisible(true);
        }
      } else {
        const delta = currentY - lastScrollY.current;

        if (delta > SCROLL_DELTA && visibleRef.current) {
          visibleRef.current = false;
          setVisible(false);
        } else if (delta < -SCROLL_DELTA && !visibleRef.current) {
          visibleRef.current = true;
          setVisible(true);
        }
      }

      lastScrollY.current = currentY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.2, 0, 0, 1] as const };

  /** Opaque chrome whenever the bar is shown away from the document top. */
  const solidChrome = visible && scrolled;

  return (
    <>
      <div aria-hidden className="shrink-0" style={{ height: headerHeight }} />

      <motion.header
        ref={headerRef}
        className={cn('fixed inset-x-0 top-0 z-[500]', !visible && 'pointer-events-none')}
        style={{ backgroundColor: solidChrome ? 'var(--color-surface)' : undefined }}
        initial={false}
        animate={{ y: visible ? 0 : '-100%' }}
        transition={transition}
      >
        <Navbar
          cartCount={cartCount}
          onCartClick={onCartClick}
          compact={solidChrome}
        />
      </motion.header>
    </>
  );
}
