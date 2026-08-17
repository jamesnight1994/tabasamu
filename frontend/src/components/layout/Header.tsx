'use client';

/**
 * SITE HEADER
 *
 * Fixed to the top while the page scrolls. A layout spacer preserves document
 * flow. Background colours live on Navbar sections (utility strip + main bar).
 */

import { useEffect, useRef, useState } from 'react';
import { Navbar, type NavbarProps } from './Navbar';

export type { NavbarProps as HeaderProps };

/** Re-export menu data for any consumers that still import from Header. */
export { NAV_MENU as PRIMARY_NAV } from '../../content/navigation';

export function Header({ cartCount = 0, onCartClick }: NavbarProps) {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const syncHeight = () => setHeaderHeight(node.offsetHeight);
    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div aria-hidden className="shrink-0" style={{ height: headerHeight }} />

      <header ref={headerRef} className="fixed inset-x-0 top-0 z-[500]">
        <Navbar cartCount={cartCount} onCartClick={onCartClick} scrolled={scrolled} />
      </header>
    </>
  );
}
