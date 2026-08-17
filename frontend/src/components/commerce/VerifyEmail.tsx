'use client';

/**
 * EMAIL VERIFICATION
 *
 * ⚠ CONSUMES A TOKEN FROM THE LINK, THEN TELLS THE TRUTH ABOUT THE RESULT.
 *   A missing or spent token gets an actionable message with a "resend" path —
 *   not a dead end, and not a false "verified".
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAdapters } from './AdapterProvider';
import { useSession } from './SessionProvider';
import { Button } from '../primitives/Button';

type State = 'checking' | 'verified' | 'invalid' | 'no_token';

export function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get('token');
  const { auth } = useAdapters();
  const { refresh } = useSession();
  const [state, setState] = useState<State>(token ? 'checking' : 'no_token');
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    void (async () => {
      const r = await auth.verifyEmail(token);
      if (r.ok) {
        await refresh(); // pull the now-verified session
        setState('verified');
      } else {
        setState('invalid');
      }
    })();
  }, [token, auth, refresh]);

  const [resent, setResent] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const resend = useCallback(async () => {
    const { normaliseEmail } = await import('../../domain/identity/auth');
    const n = normaliseEmail(emailValue);
    if (!n.ok) return;
    await auth.resendVerification(n.value);
    setResent(true);
  }, [emailValue, auth]);

  if (state === 'checking') {
    return (
      <div aria-live="polite" className="rounded-sm border border-charcoal/15 bg-cream p-6">
        <p className="text-sm text-charcoal/70">Verifying your email…</p>
      </div>
    );
  }

  if (state === 'verified') {
    return (
      <div className="rounded-sm border border-forest/25 bg-forest/[0.04] p-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-charcoal">
          Your email is verified
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
          Everything in your account is now available.
        </p>
        <div className="mt-5">
          <Button asChild>
            <Link href="/account">Go to your account</Link>
          </Button>
        </div>
      </div>
    );
  }

  // invalid or no_token → offer a resend
  return (
    <div className="rounded-sm border border-terracotta/30 bg-terracotta/[0.04] p-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-charcoal">
        This link has expired
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
        Verification links are single-use and time out. Enter your email and we will send a fresh one.
      </p>
      <div className="mt-5 flex gap-2">
        <input
          type="email"
          value={emailValue}
          onChange={(e) => setEmailValue(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email"
          className="min-w-0 flex-1 rounded-sm border border-charcoal/20 bg-cream px-3 py-2 text-sm text-charcoal"
        />
        <Button variant="secondary" onClick={() => void resend()}>
          Resend
        </Button>
      </div>
      {resent && (
        <p className="mt-3 text-xs text-forest">If that email has an account, a new link is on its way.</p>
      )}
    </div>
  );
}
