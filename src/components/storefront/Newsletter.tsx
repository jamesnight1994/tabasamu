'use client';

/**
 * NEWSLETTER SIGN-UP
 *
 * ⛔ D-40 — NO EMAIL PROVIDER HAS BEEN CHOSEN.
 *
 *   The form is REAL: it validates, it handles errors, it manages focus, it
 *   announces its result to a screen reader. All of that is testable now and
 *   none of it changes when a provider is wired in.
 *
 *   But it is NOT CONNECTED, and it says so plainly. It does not pretend to
 *   subscribe anyone. Silently swallowing an address — showing a green tick and
 *   dropping the email on the floor — is worse than not having the form: the
 *   customer believes they signed up, and then never hears from the brand
 *   again and concludes it died. [NN-04]
 *
 *   Wiring it is one function call inside `handleSubmit`.
 */

import { useState, useRef } from 'react';
import { Button } from '../primitives/Button';
import { Field, Input, FormError } from '../primitives/Form';
import { SectionHeader } from '../primitives/Surface';
import { NEWSLETTER } from '../../content/homepage';
import { cn } from '../../lib/utils/cn';

type State = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Deliberately permissive. An over-strict email regex rejects real addresses
 * (apostrophes, new TLDs, plus-addressing) and the only authority on whether an
 * address works is whether mail to it arrives.
 */
const looksLikeEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export function Newsletter() {
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

    // ⛔ NOT WIRED. There is no provider (D-40). We simulate the latency so the
    //    loading state is real and testable, and we are honest in the UI about
    //    what did and did not happen.
    await new Promise((r) => setTimeout(r, 600));

    setState('success');
    // Move focus to the confirmation so a screen-reader user is told.
    requestAnimationFrame(() => successRef.current?.focus());
  };

  return (
    <section aria-labelledby="newsletter-heading" className="bg-[--color-surface-sunken]">
      <div className="mx-auto max-w-[--container-max] px-4 py-16 md:px-8 md:py-24">
        <div className="grid gap-8 md:grid-cols-2 md:gap-16">
          <SectionHeader
            eyebrow={NEWSLETTER.eyebrow}
            title={NEWSLETTER.title}
            intro={NEWSLETTER.body}
            as="h2"
          />

          <div className="flex flex-col gap-4">
            {state === 'success' ? (
              <div
                className={cn(
                  'rounded-[--radius-lg] border border-[--color-success]/30',
                  'bg-[--color-success-bg] p-6'
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

                {/*
                  ⚠ HONEST. The address was validated and then went nowhere,
                    because there is no provider. Saying so here is the only
                    defensible option — and it is a note for the CLIENT reading
                    a staging build, not a live-site message.
                */}
                <p className="spec-mono mt-4 text-[length:--text-micro] text-[--color-ink-muted]">
                  ⛔ D-40 · not connected — no email provider is configured, so nothing was sent
                </p>
              </div>
            ) : (
              <>
                <Field
                  label="Email address"
                  hint={NEWSLETTER.consent}
                  error={error ?? undefined}
                >
                  {({ inputId, describedBy }) => (
                    <Input
                      id={inputId}
                      aria-describedby={describedBy}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      invalid={Boolean(error)}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        // ⚠ Enter submits. Not wrapping this in a <form> is a
                        //   deliberate constraint of the artifact environment;
                        //   the keyboard affordance must survive anyway.
                        if (e.key === 'Enter') handleSubmit();
                      }}
                    />
                  )}
                </Field>

                <Button
                  onClick={handleSubmit}
                  loading={state === 'submitting'}
                  fullWidth
                >
                  Sign up
                </Button>

                <p className="spec-mono text-[length:--text-micro] text-[--color-ink-subtle]">
                  ⛔ D-40 · no email provider configured — this form is not connected
                </p>
              </>
            )}

            {error && state !== 'success' && (
              <div className="sr-only" role="alert">
                <FormError>{error}</FormError>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
