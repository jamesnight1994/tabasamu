'use client';

import { useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { Field, Input, FormError } from '../primitives/Form';
import { NEWSLETTER, SUBSCRIBE_SECTION } from '../../content/homepage';
import { cn } from '../../lib/utils/cn';

type State = 'idle' | 'submitting' | 'success' | 'error';

const looksLikeEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export function SubscribeNewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);
  const successRef = useRef<HTMLParagraphElement>(null);

  const handleSubmit = async () => {
    setError(null);

    if (email.trim().length === 0) {
      setError('Enter your email address.');
      return;
    }
    if (!looksLikeEmail(email)) {
      setError('That does not look like an email address.');
      return;
    }

    setState('submitting');
    await new Promise((r) => setTimeout(r, 600));
    setState('success');
    requestAnimationFrame(() => successRef.current?.focus());
  };

  if (state === 'success') {
    return (
      <div
        className={cn(
          'mx-auto w-full max-w-2xl rounded-[--radius-lg] border border-[--color-success]/30',
          'bg-[--color-success-bg] p-6 text-center'
        )}
      >
        <p
          ref={successRef}
          tabIndex={-1}
          role="status"
          className="mb-2 font-display text-[length:--text-h4] text-[--color-ink] outline-none"
        >
          {NEWSLETTER.successTitle}
        </p>
        <p className="text-[length:--text-small] text-[--color-ink-muted]">
          {NEWSLETTER.successBody}
        </p>
        <p className="spec-mono mt-4 text-[length:--text-micro] text-[--color-ink-muted]">
          ⛔ D-40 · not connected — no email provider is configured, so nothing was sent
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      <Field label="Email address" hint={NEWSLETTER.consent} error={error ?? undefined} hideLabel>
        {({ inputId, describedBy }) => (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="relative min-w-0 flex-1">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 z-[1] size-5 -translate-y-1/2 text-forest/80"
                strokeWidth={1.75}
                aria-hidden
              />
              <Input
                id={inputId}
                aria-describedby={describedBy}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={SUBSCRIBE_SECTION.emailPlaceholder}
                value={email}
                invalid={Boolean(error)}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                className={cn(
                  'h-12 rounded-full border-[--color-border-strong] bg-surface pl-12 pr-5',
                  'text-[length:--text-body] placeholder:text-[--color-ink-subtle]'
                )}
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={state === 'submitting'}
              className={cn(
                'subscribe-section-submit inline-flex h-12 shrink-0 items-center justify-center',
                'rounded-full px-8 font-body text-[0.9375rem] font-medium',
                'transition-[background-color,opacity] duration-[--duration-fast]',
                'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {state === 'submitting' ? 'Sending…' : SUBSCRIBE_SECTION.submitLabel}
            </button>
          </div>
        )}
      </Field>

      {error && (
        <div className="sr-only" role="alert">
          <FormError>{error}</FormError>
        </div>
      )}

      <p className="spec-mono text-center text-[length:--text-micro] text-[--color-ink-subtle]">
        ⛔ D-40 · no email provider configured — this form is not connected
      </p>
    </div>
  );
}
