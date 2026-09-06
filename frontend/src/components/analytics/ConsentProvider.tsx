'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button, Modal, Switch } from '@heroui/react';
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
  /** Persist an explicit analytics choice from the manage-preferences dialog. */
  savePreferences(analytics: boolean): void;
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
  const savePreferences = useCallback(
    (analytics: boolean) => persist(decide(analytics)),
    [persist]
  );
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
    () => ({
      consent,
      decided: hasDecided(consent),
      accept,
      reject,
      savePreferences,
      reopen,
    }),
    [consent, accept, reject, savePreferences, reopen]
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {/* Banner shows only after hydration and only until a choice is made. */}
      {hydrated && !hasDecided(consent) && (
        <ConsentBanner onAcceptAll={accept} onSavePreferences={savePreferences} />
      )}
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
 *   - REJECT / manage is as prominent as ACCEPT ALL. A greyed-out reject is a
 *     dark pattern and, under the DPA, arguably invalidates consent.
 *   - In-voice copy: calm, factual, no "we value your privacy!" theatre.
 * ================================================================== */

/** Consent CTAs — forest/teal, not HeroUI default blue. */
const CONSENT_BTN =
  'min-h-11 font-body shadow-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--color-focus]';

const CONSENT_BTN_PRIMARY = cn(
  CONSENT_BTN,
  'border-transparent bg-[#3a9d7a] text-[--color-ink-inverse]',
  'hover:bg-[#2f8a6a] pressed:bg-[#2a7d60]'
);

const CONSENT_BTN_SECONDARY = cn(
  CONSENT_BTN,
  'border border-[--color-link] bg-transparent',
  '[--button-bg:transparent] [--button-bg-hover:var(--color-success-bg)] [--button-bg-pressed:var(--color-success-bg)]',
  '[--button-fg:var(--color-link)] text-[--color-link]',
  'hover:bg-[--color-success-bg] hover:text-[--color-link-hover] hover:[--button-fg:var(--color-link-hover)]'
);

const CONSENT_BTN_GHOST = cn(
  CONSENT_BTN,
  'border-transparent bg-transparent',
  '[--button-bg:transparent] [--button-bg-hover:var(--color-success-bg)] [--button-bg-pressed:var(--color-success-bg)]',
  '[--button-fg:var(--color-link)] text-[--color-link]',
  'hover:bg-[--color-success-bg] hover:text-[--color-link-hover] hover:[--button-fg:var(--color-link-hover)]'
);

type ConsentBannerProps = Readonly<{
  onAcceptAll(): void;
  onSavePreferences(analytics: boolean): void;
}>;

function ConsentBanner({ onAcceptAll, onSavePreferences }: ConsentBannerProps) {
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <>
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="consent-heading"
        aria-describedby="consent-body"
        className={cn(
          'pointer-events-none fixed inset-x-0 bottom-0 z-[--z-mobile-bar]',
          'p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6'
        )}
      >
        <div
          className={cn(
            'pointer-events-auto mx-auto w-full max-w-[--container-max]',
            'rounded-2xl border border-[--color-border]',
            'bg-[color-mix(in_oklab,var(--color-surface-sunken)_88%,var(--color-ink)_4%)]',
            'px-5 py-5 shadow-[0_12px_40px_rgb(45_45_45/0.12)] md:px-6 md:py-5'
          )}
        >
          <div
            className={cn(
              'flex flex-col gap-5',
              'md:flex-row md:items-center md:justify-between md:gap-8'
            )}
          >
            <div className="min-w-0 max-w-[--container-prose]">
              <h2
                id="consent-heading"
                className="label-caps mb-1.5 text-[--color-ink-muted]"
              >
                Cookies
              </h2>
              <p
                id="consent-body"
                className="font-body text-[0.75rem] leading-relaxed text-[--color-ink] md:text-[0.8125rem]"
              >
                We use only what the shop needs to work — your box and your session. We would
                also like to measure which pages help, but only if you agree. You can change
                this any time on the{' '}
                <a
                  href="/cookie-preferences"
                  className="text-[--color-link] underline underline-offset-2"
                >
                  cookie preferences
                </a>{' '}
                page.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              {/* Manage first and equal weight — no dark pattern. */}
              <Button
                variant="secondary"
                className={CONSENT_BTN_SECONDARY}
                onPress={() => setManageOpen(true)}
              >
                Manage cookies
              </Button>
              <Button
                variant="primary"
                className={CONSENT_BTN_PRIMARY}
                onPress={onAcceptAll}
              >
                Accept all cookies
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConsentPreferencesModal
        isOpen={manageOpen}
        onOpenChange={setManageOpen}
        onSave={onSavePreferences}
        onAcceptAll={() => {
          setManageOpen(false);
          onAcceptAll();
        }}
      />
    </>
  );
}

/* ================================================================== *
 * ConsentPreferencesModal
 *
 * Wired to the real consent model: essential is always on; measurement
 * (analytics) is the only optional category the storefront currently gates.
 * ================================================================== */

type ConsentPreferencesModalProps = Readonly<{
  isOpen: boolean;
  onOpenChange(open: boolean): void;
  onSave(analytics: boolean): void;
  onAcceptAll(): void;
}>;

function ConsentPreferencesModal({
  isOpen,
  onOpenChange,
  onSave,
  onAcceptAll,
}: ConsentPreferencesModalProps) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    if (isOpen) setAnalyticsEnabled(false);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop isDismissable>
        <Modal.Container size="md" placement="center">
          <Modal.Dialog className="font-body">
            <Modal.CloseTrigger />
            <Modal.Header className="flex flex-col gap-1.5 pr-10">
              <Modal.Heading className="font-display text-xl font-normal text-[--color-ink] md:text-2xl">
                Cookie preferences
              </Modal.Heading>
              <p className="font-body text-sm leading-relaxed text-[--color-ink-muted]">
                Essential cookies keep the shop working. Measurement is optional and off unless
                you turn it on.
              </p>
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-3">
              <ConsentPreferenceRow
                title="Essential"
                description="Your cart and session. Always on — the shop cannot work without them, and they carry no tracking identifier."
                checked
                disabled
                badge="Always on"
              />

              <ConsentPreferenceRow
                title="Measurement"
                description="Privacy-respecting analytics that tell us which pages help. No name, phone, address or payment reference is ever sent."
                checked={analyticsEnabled}
                onCheckedChange={setAnalyticsEnabled}
              />
            </Modal.Body>

            <Modal.Footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                variant="ghost"
                className={CONSENT_BTN_GHOST}
                onPress={() => {
                  onSave(false);
                  onOpenChange(false);
                }}
              >
                Only essential
              </Button>
              <Button
                variant="secondary"
                className={CONSENT_BTN_SECONDARY}
                onPress={() => {
                  onSave(analyticsEnabled);
                  onOpenChange(false);
                }}
              >
                Save preferences
              </Button>
              <Button
                variant="primary"
                className={CONSENT_BTN_PRIMARY}
                onPress={onAcceptAll}
              >
                Accept all
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

type ConsentPreferenceRowProps = Readonly<{
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  badge?: string;
  onCheckedChange?(checked: boolean): void;
}>;

function ConsentPreferenceRow({
  title,
  description,
  checked,
  disabled = false,
  badge,
  onCheckedChange,
}: ConsentPreferenceRowProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-xl border border-[--color-border]',
        'bg-[--color-surface] px-4 py-4'
      )}
    >
      <div className="min-w-0 flex-1 pr-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-body text-sm font-medium text-[--color-ink]">{title}</p>
          {badge ? (
            <span className="label-caps rounded-full border border-[--color-border] px-2 py-0.5 text-[--color-ink-muted]">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-[0.75rem] leading-relaxed text-[--color-ink-muted]">
          {description}
        </p>
      </div>

      {/* Switch.Content is the clickable RAC SwitchButton — without it the control is inert. */}
      <Switch
        isSelected={checked}
        isDisabled={disabled}
        onChange={onCheckedChange}
        aria-label={title}
        className={cn(
          'shrink-0 pt-0.5',
          '[--switch-control-bg-checked:#3a9d7a]',
          '[--switch-control-bg-checked-hover:#2f8a6a]'
        )}
      >
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
    </div>
  );
}
