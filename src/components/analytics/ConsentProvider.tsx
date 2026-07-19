'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/utils/cn';
import { setAnalyticsConsent } from '../../lib/analytics';
import {
  CONSENT_STORAGE_KEY,
  DEFAULT_CONSENT,
  decide,
  hasDecided,
  parseConsent,
  serialiseConsent,
  type ConsentState,
} from '../../lib/analytics/consent';

/**
 * CONSENT PROVIDER  (Phase 8 · §4, §6)
 *
 * Holds the single consent state for the app, persists the customer's decision,
 * and — crucially — mirrors it into the analytics module so `track()` is gated
 * everywhere at once.
 *
 * ⚠ localStorage is read in an effect (not during render) so the server and the
 *   first client paint agree — a hydration mismatch on a consent banner is both
 *   a bug and, briefly, a compliance gap.
 *
 * ⚠ If storage is unavailable (Safari private mode, quota), we DEGRADE TO
 *   DENY — the safest failure. The banner simply shows each session rather than
 *   silently enabling tracking.
 */

interface ConsentContextValue {
  readonly consent: ConsentState;
  readonly decided: boolean;
  accept(): void;
  reject(): void;
  /** Re-open the choice — used by the Cookie Preferences page. */
  reopen(): void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export const useConsent = (): ConsentContextValue => {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within <ConsentProvider>');
  return ctx;
};

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted decision once, after mount.
  useEffect(() => {
    let stored: ConsentState = DEFAULT_CONSENT;
    try {
      stored = parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
    } catch {
      stored = DEFAULT_CONSENT;
    }
    setConsent(stored);
    setAnalyticsConsent(stored);
    setHydrated(true);
  }, []);

  const persist = useCallback((next: ConsentState) => {
    setConsent(next);
    setAnalyticsConsent(next);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, serialiseConsent(next));
    } catch {
      // Deny-by-default already holds in memory; nothing leaks.
    }
  }, []);

  const accept = useCallback(() => persist(decide(true)), [persist]);
  const reject = useCallback(() => persist(decide(false)), [persist]);
  const reopen = useCallback(() => {
    const reset = { ...DEFAULT_CONSENT };
    setConsent(reset);
    setAnalyticsConsent(reset);
    try {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch {
      /* no-op */
    }
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({ consent, decided: hasDecided(consent), accept, reject, reopen }),
    [consent, accept, reject, reopen]
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {/* Banner shows only after hydration and only until a choice is made. */}
      {hydrated && !hasDecided(consent) && <ConsentBanner onAccept={accept} onReject={reject} />}
    </ConsentContext.Provider>
  );
}

/* ================================================================== *
 * ConsentBanner
 *
 * ⚠ ACCESSIBILITY (WCAG 2.2 AA):
 *   - `role="dialog"` + `aria-modal="false"` (non-blocking, so a customer can
 *     still read the policy it references before deciding).
 *   - Labelled by its heading; both actions are real 44px buttons.
 *   - REJECT is as prominent as ACCEPT. A greyed-out reject is a dark pattern
 *     and, under the DPA, arguably invalidates consent.
 *   - In-voice copy: calm, factual, no "we value your privacy!" theatre.
 * ================================================================== */

function ConsentBanner({ onAccept, onReject }: { onAccept(): void; onReject(): void }) {
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-heading"
      aria-describedby="consent-body"
      className={cn(
        'fixed inset-x-0 bottom-0 z-[--z-mobile-bar]',
        'border-t border-[--color-border] bg-[--color-surface]',
        'px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
        'shadow-[0_-2px_12px_rgb(45_45_45_/_0.10)]'
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-[--container-max] flex-col gap-4',
          'md:flex-row md:items-center md:justify-between'
        )}
      >
        <div className="max-w-[--container-prose]">
          <h2 id="consent-heading" className="label-caps mb-1 text-[--color-ink-muted]">
            Cookies
          </h2>
          <p
            id="consent-body"
            className="font-body text-[length:--text-small] leading-relaxed text-[--color-ink]"
          >
            We use only what the shop needs to work — your box and your session. We would also
            like to measure which pages help, but only if you agree. You can change this any time
            on the{' '}
            <a
              href="/cookie-preferences"
              className="text-[--color-link] underline underline-offset-2"
            >
              cookie preferences
            </a>{' '}
            page.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          {/* Reject first and equal — no dark pattern. */}
          <Button variant="ghost" onClick={onReject}>
            Only what is needed
          </Button>
          <Button onClick={onAccept}>Allow measurement</Button>
        </div>
      </div>
    </div>
  );
}
