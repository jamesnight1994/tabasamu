'use client';

/**
 * NAVBAR
 *
 * Reference layout (navbar.png + sectioned-navbar utility):
 *   utility: location ········· support · locale
 *   main:    [logo · links] [—— search pill ——] [icons]
 *
 * Search uses flex-1 so it fills the middle — avoids the dead gap from
 * justify-between. Utility/main tones are deliberately separated (brand-safe
 * warm grays, not white).
 */

import { useId, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  Globe,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
  User,
} from 'lucide-react';
import { Logo } from '../primitives/Logo';
import { Drawer } from '../primitives/Overlay';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/utils/cn';
import { isEnabled } from '../../lib/flags';
import {
  NAV_ACCOUNT_HREF,
  NAV_CTA,
  NAV_MENU,
  NAV_SEARCH,
  NAV_SIGNIN_HREF,
  NAV_UTILITY,
  type NavChild,
  type NavEntry,
} from '../../content/navigation';

const SITE_CONTAINER = 'container mx-auto w-full max-w-[--container-max] px-4 md:px-8';

/** Warm gray utility strip — visibly distinct from the main bar on cream canvas. */
const UTILITY_BG = 'bg-[#E8E0D6]';
/** Pill / inset field tone — reads clearly against the canvas main bar. */
const INSET_BG = 'bg-[#DDD4C8]';

export interface NavbarProps {
  cartCount?: number;
  onCartClick?: () => void;
  /** Compact sticky mode — solid surface, utility bar hidden. */
  compact?: boolean;
}

function isNavVisible(item: { flag?: NavEntry['flag'] }): boolean {
  return !item.flag || isEnabled(item.flag);
}

function visibleChildren(entry: NavEntry): readonly NavChild[] {
  return (entry.children ?? []).filter(isNavVisible);
}

function visibleMenu(): NavEntry[] {
  return NAV_MENU.filter(isNavVisible).map((entry) => ({
    ...entry,
    children: visibleChildren(entry),
    hasDropdown: visibleChildren(entry).length > 0,
  }));
}

const navItemClass = cn(
  'inline-flex items-center gap-1 whitespace-nowrap py-1',
  'font-body text-[0.983rem] font-normal leading-none text-[--color-ink]',
  'no-underline hover:text-[--color-link]',
  'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
  'transition-colors duration-[--duration-fast]'
);

export function Navbar({ cartCount = 0, onCartClick, compact = false }: NavbarProps) {
  const [navOpen, setNavOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menu = visibleMenu();
  const searchEnabled = isEnabled('siteSearch');
  const contact = NAV_UTILITY.contact;
  const locationLabel = contact.address ?? contact.locationFallback;
  const locationHref = contact.addressHref ?? '/contact';

  const iconBtn = cn(
    'relative inline-flex size-9 items-center justify-center rounded-full',
    'text-[--color-ink-muted]',
    'hover:bg-[#EBE2D8] hover:text-[--color-ink]',
    'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
    'transition-colors duration-[--duration-fast]'
  );

  return (
    <div className={cn('w-full', compact && 'bg-[--color-surface]')}>
      {/* utility bar — hidden in compact sticky mode */}
      <div className={cn('hidden md:block', compact ? 'hidden' : UTILITY_BG)}>
        <div className={SITE_CONTAINER}>
          <div className="flex items-center justify-between py-2 text-[0.75rem] leading-none text-[--color-ink-muted] px-2">
            <Link
              href={locationHref}
              className="inline-flex items-center gap-2 font-body no-underline hover:text-[--color-link]"
            >
              <MapPin className="size-3.5 shrink-0" aria-hidden strokeWidth={1.75} />
              <span>{locationLabel}</span>
            </Link>

            <div className="flex items-center gap-6 font-body">
              <Link
                href={NAV_UTILITY.support.href}
                className="inline-flex items-center gap-2 no-underline hover:text-[--color-link]"
              >
                <MessageCircle className="size-3.5 shrink-0" aria-hidden strokeWidth={1.75} />
                <span>{NAV_UTILITY.support.label}</span>
              </Link>

              <span
                className="inline-flex items-center gap-2"
                aria-label={`Language: ${NAV_UTILITY.locale.language}, currency: ${NAV_UTILITY.locale.currency}`}
              >
                <Globe className="size-3.5 shrink-0" aria-hidden strokeWidth={1.75} />
                <span>
                  {NAV_UTILITY.locale.language} | {NAV_UTILITY.locale.currency}
                </span>
                <ChevronDown className="size-3 opacity-70" aria-hidden strokeWidth={1.75} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* main bar */}
      <div className="bg-[--color-surface]">
        <div className={SITE_CONTAINER}>
          <div className="flex items-center gap-4 py-3 md:gap-5 md:py-3.5 lg:gap-6">
            <div className="flex min-w-0 items-center gap-5 lg:gap-8">
              <Link
                href="/"
                aria-label="Tabasamu Sips — home"
                className="shrink-0 focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-4"
              >
                <span className="lg:hidden">
                  <Logo variant="monogram" width={52} priority decorative clearSpace={0.08} />
                </span>
                <span className="hidden lg:block">
                  <Logo variant="full" width={160} priority decorative clearSpace={0.08} />
                </span>
              </Link>

              <nav aria-label="Primary" className="hidden shrink-0 lg:block">
                <ul className="flex items-center gap-5 xl:gap-6">
                  {menu.map((item) => (
                    <DesktopNavItem
                      key={item.href + item.label}
                      item={item}
                      openMenu={openMenu}
                      setOpenMenu={setOpenMenu}
                    />
                  ))}
                </ul>
              </nav>
            </div>

            {/* search + actions — grouped and aligned to the container's right edge */}
            <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
              <label className="relative hidden w-[8.875rem] shrink-0 md:flex md:w-[7.5rem] lg:w-[8.4375rem] xl:w-[12.0625rem]">
                <span className="sr-only">Search</span>
                <input
                  type="search"
                  placeholder={NAV_SEARCH.placeholder}
                  disabled={!searchEnabled}
                  readOnly={!searchEnabled}
                  className={cn(
                    'h-10 w-full rounded-full pl-3.5 pr-9',
                    INSET_BG,
                    'font-body text-[0.9375rem] text-[--color-ink]',
                    'placeholder:text-[--color-ink-muted]',
                    'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
                    'disabled:cursor-default'
                  )}
                />
                <Search
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[--color-ink-muted]"
                  aria-hidden
                  strokeWidth={1.75}
                />
              </label>

              <div className="flex items-center gap-0.5 sm:gap-1">
                <div className="hidden items-center sm:flex">
                  <button type="button" className={iconBtn} aria-label="Notifications">
                    <Bell className="size-[1.05rem]" aria-hidden strokeWidth={1.75} />
                  </button>

                  <Link href={NAV_ACCOUNT_HREF} className={iconBtn} aria-label="Wishlist">
                    <Heart className="size-[1.05rem]" aria-hidden strokeWidth={1.75} />
                  </Link>

                  <Link href={NAV_SIGNIN_HREF} className={iconBtn} aria-label="Account">
                    <User className="size-[1.05rem]" aria-hidden strokeWidth={1.75} />
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={onCartClick}
                  className={cn(
                    'relative inline-flex size-9 items-center justify-center rounded-full',
                    'bg-[--color-link] text-[--color-ink-inverse]',
                    'hover:bg-[--color-link-hover]',
                    'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
                    'transition-colors duration-[--duration-fast]'
                  )}
                  aria-label="Cart"
                >
                  <ShoppingBag className="size-[1.05rem]" aria-hidden strokeWidth={1.75} />
                  {cartCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-[--color-accent] px-1 font-mono text-[10px] leading-4 text-[--color-ink-inverse]">
                      {cartCount}
                    </span>
                  )}
                  <span className="sr-only">
                    {cartCount === 0
                      ? ', empty'
                      : `, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setNavOpen(true)}
                  aria-expanded={navOpen}
                  aria-controls="mobile-nav"
                  className={cn(iconBtn, 'lg:hidden')}
                  aria-label="Open menu"
                >
                  <Menu className="size-5" aria-hidden strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Drawer open={navOpen} onOpenChange={setNavOpen} title="Menu" side="right">
        <nav aria-label="Mobile" id="mobile-nav" className="flex flex-col gap-6">
          <ul className="flex flex-col gap-1">
            {menu.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className="flex min-h-[--touch-comfortable] items-center py-3 font-body text-[length:--text-small] text-[--color-ink] no-underline hover:text-[--color-link]"
                >
                  {item.label}
                </Link>
                {item.hasDropdown && item.children && item.children.length > 0 && (
                  <ul className="mb-2 ml-3 flex flex-col gap-0.5 pl-3">
                    {item.children.map((child) => (
                      <li key={child.href + child.label}>
                        <Link
                          href={child.href}
                          onClick={() => setNavOpen(false)}
                          className="flex min-h-10 items-center py-1 font-body text-[length:--text-caption] text-[--color-ink-muted] no-underline hover:text-[--color-link]"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <Button asChild fullWidth>
            <Link href={NAV_CTA.href} onClick={() => setNavOpen(false)}>
              {NAV_CTA.label}
            </Link>
          </Button>
        </nav>
      </Drawer>
    </div>
  );
}

function DesktopNavItem({
  item,
  openMenu,
  setOpenMenu,
}: {
  item: NavEntry;
  openMenu: string | null;
  setOpenMenu: (key: string | null) => void;
}) {
  const key = item.href + item.label;
  const isOpen = openMenu === key;
  const menuId = useId();
  const hasDropdown = Boolean(item.hasDropdown && item.children && item.children.length > 0);

  if (!hasDropdown) {
    return (
      <li>
        <Link href={item.href} className={navItemClass}>
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li
      className="relative"
      onMouseEnter={() => setOpenMenu(key)}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <button
        type="button"
        className={cn(navItemClass, 'cursor-pointer border-0 bg-transparent p-0')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpenMenu(isOpen ? null : key)}
      >
        {item.label}
        <ChevronDown
          className={cn(
            'size-3 opacity-60 transition-transform duration-[--duration-fast]',
            isOpen && 'rotate-180'
          )}
          aria-hidden
          strokeWidth={1.75}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-20 min-w-40 pt-2">
          <ul id={menuId} role="menu" className={cn('py-1.5', UTILITY_BG)}>
            {item.children!.map((child) => (
              <li key={child.href + child.label} role="none">
                <Link
                  role="menuitem"
                  href={child.href}
                  className="block px-4 py-2 font-body text-[0.8125rem] text-[--color-ink] no-underline hover:bg-[--color-canvas] hover:text-[--color-link]"
                  onClick={() => setOpenMenu(null)}
                >
                  {child.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

/** @deprecated Prefer importing menu data from `content/navigation`. */
export { NAV_MENU as PRIMARY_NAV };
