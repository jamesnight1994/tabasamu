'use client';

import { useConsent } from './ConsentProvider';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/utils/cn';

/**
 * COOKIE PREFERENCES CONTROL  (Phase 8 · §4, §6)
 *
 * The durable place to change the analytics choice, reachable from the footer,
 * the privacy page and the consent banner. It reflects the CURRENT state and
 * lets the customer change it — the DPA requires withdrawing consent to be as
 * easy as giving it.
 *
 * ⚠ Essential cookies are listed as INFORMATION, not a toggle — they are
 *   strictly necessary and cannot be switched off without breaking the shop.
 *   Presenting them as a choice would be misleading.
 */
export function CookiePreferences() {
  const { consent, decided, accept, reject } = useConsent();

  const analyticsOn = decided && consent.analytics;
  const status = !decided
    ? 'Not yet chosen'
    : consent.analytics
      ? 'Measurement allowed'
      : 'Only essential';

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[length:--text-h4]">Essential</h2>
          <span className="label-caps text-[--color-ink-muted]">Always on</span>
        </div>
        <p className="measure mt-2 leading-relaxed text-[--color-ink]">
          Your cart and your session. The shop cannot work without these, they carry no tracking
          identifier, and they are never shared. They are not a choice, so we do not pretend they
          are one.
        </p>
      </div>

      <div className="rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[length:--text-h4]">Measurement</h2>
          <span
            className={cn(
              'label-caps rounded-[--radius-pill] border px-2.5 py-1',
              analyticsOn
                ? 'border-[--color-success] text-[--color-success]'
                : 'border-[--color-border] text-[--color-ink-muted]'
            )}
          >
            {status}
          </span>
        </div>
        <p className="measure mt-2 leading-relaxed text-[--color-ink]">
          Privacy-respecting analytics that tell us which pages help. No name, phone, address or
          payment reference is ever sent. Off unless you turn it on, and you can turn it off again
          at any time.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant={analyticsOn ? 'primary' : 'ghost'} onClick={accept} aria-pressed={analyticsOn}>
            Allow measurement
          </Button>
          <Button
            variant={!analyticsOn && decided ? 'primary' : 'ghost'}
            onClick={reject}
            aria-pressed={!analyticsOn && decided}
          >
            Only what is needed
          </Button>
        </div>
      </div>
    </div>
  );
}
