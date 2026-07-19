'use client';

/**
 * ANNOUNCEMENT BAR
 *
 * The brief asks for: a delivery/restock/offer message, administratively
 * editable, dismissible where appropriate.
 *
 * ⚠ THIS IS NOT A PROMOTIONAL BANNER, and the difference is enforced here.
 *
 *   It carries ONE calm, factual line. There is no countdown, no timer, no
 *   "SHOP NOW", no exclamation mark, and no urgency of any kind. The Brand Book
 *   voice is "someone already at ease" — a ticking clock is the opposite of
 *   that, and P-07 forbids urgency architecture outright.
 *
 *   If a stakeholder later asks for a countdown here, the answer is already
 *   written down.
 *
 * ⚠ DISMISSAL PERSISTS. A strip that reappears on every page load is an
 *   advertisement, not an announcement. Dismissal is keyed to the MESSAGE, so
 *   changing the copy correctly shows it again to someone who dismissed the
 *   previous one.
 *
 * ⛔ DISABLED BY DEFAULT (`ANNOUNCEMENT.enabled === false`).
 *    There is no approved announcement copy, and no approved delivery promise
 *    (D-21). An invented "Free delivery in Nairobi" line would be inventing a
 *    commercial promise the business has not made. [NN-05]
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ANNOUNCEMENT } from '../../content/homepage';
import { cn } from '../../lib/utils/cn';

const STORAGE_PREFIX = 'ts:announcement:dismissed:';

/** Stable key from the message, so new copy re-shows. */
const keyFor = (message: string): string => {
  let h = 0;
  for (let i = 0; i < message.length; i++) {
    h = (h << 5) - h + message.charCodeAt(i);
    h |= 0;
  }
  return `${STORAGE_PREFIX}${h}`;
};

export interface AnnouncementBarProps {
  message?: string;
  href?: string;
  linkLabel?: string;
  enabled?: boolean;
  dismissible?: boolean;
}

export function AnnouncementBar({
  message = ANNOUNCEMENT.message,
  href = ANNOUNCEMENT.href,
  linkLabel = ANNOUNCEMENT.linkLabel,
  enabled = ANNOUNCEMENT.enabled,
  dismissible = true,
}: AnnouncementBarProps) {
  // ⚠ Starts hidden and is revealed after the storage check, so a dismissed
  //   strip never flashes on screen during hydration.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || message.length === 0) return;
    if (!dismissible) {
      setVisible(true);
      return;
    }
    try {
      const dismissed = window.localStorage.getItem(keyFor(message));
      setVisible(dismissed !== '1');
    } catch {
      // Private mode / storage disabled — show it. Failing open is right for
      // an informational strip.
      setVisible(true);
    }
  }, [enabled, message, dismissible]);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(keyFor(message), '1');
    } catch {
      /* nothing to do — the strip is already hidden for this session */
    }
  };

  if (!enabled || message.length === 0 || !visible) return null;

  return (
    <aside
      aria-label="Announcement"
      // Forest ground, cream text — 6.0:1, AA.
      className="w-full border-b border-[--color-border] bg-[--color-link] text-[--color-ink-inverse]"
      data-ground="dark"
    >
      <div
        className={cn(
          'mx-auto flex max-w-[--container-max] items-center gap-4',
          'px-4 py-2 md:px-8'
        )}
      >
        <p className="flex-1 text-center text-[length:--text-caption]">
          {message}
          {href && linkLabel && (
            <>
              {' '}
              <Link
                href={href}
                className={cn(
                  'text-[--color-ink-inverse] underline underline-offset-2',
                  'focus-visible:outline-2 focus-visible:outline-[--color-focus-inverse]'
                )}
              >
                {linkLabel}
              </Link>
            </>
          )}
        </p>

        {dismissible && (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss announcement"
            className={cn(
              'grid size-8 shrink-0 place-items-center rounded-[--radius-sm]',
              // Cream at low alpha, not white — white is not in the palette. [NN-01]
              'text-[--color-ink-inverse] hover:bg-[--color-cream]/15',
              'focus-visible:outline-2 focus-visible:outline-[--color-focus-inverse] focus-visible:outline-offset-1',
              'transition-colors duration-[--duration-fast]'
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-3 fill-none stroke-current"
            >
              <path d="M3.5 3.5l9 9m0-9l-9 9" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}
