'use client';

/**
 * AUTH FORMS
 *
 * ⚠ THE ERROR STATES ARE THE PRODUCT HERE.
 *
 *   Anyone can build a sign-in form that works when the password is right. What
 *   separates a trustworthy one is how it behaves when things go wrong, and each
 *   of these is handled explicitly:
 *
 *     - wrong credentials → one generic message (no enumeration oracle)
 *     - unverified email  → route to "resend", not to "wrong password"
 *     - rate-limited      → say how long to wait, and disable the form
 *
 *   The domain decides which state we're in (`isHardBlocked`,
 *   `shouldOfferResendVerification`); this component only renders it.
 */

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from './SessionProvider';
import { useAdapters } from './AdapterProvider';
import { Button } from '../primitives/Button';
import { Field, Input, PhoneInput, Checkbox } from '../primitives/Form';
import {
  normaliseEmail,
  validateRegistration,
  authErrorMessage,
  isHardBlocked,
  shouldOfferResendVerification,
  type AuthError,
} from '../../domain/identity/auth';

/* ================================================================== *
 * Sign in
 * ================================================================== */

export function SignInForm({ redirectTo = '/account' }: { redirectTo?: string }) {
  const { signIn } = useSession();
  const { auth } = useAdapters();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AuthError | null>(null);
  const [resent, setResent] = useState(false);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);

  const blocked = error !== null && isHardBlocked(error);

  const submit = useCallback(async () => {
    if (inFlight.current || blocked) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    setResent(false);

    try {
      const normalised = normaliseEmail(email);
      if (!normalised.ok) {
        setError({ kind: 'invalid_credentials' }); // treat a bad email as a credential miss
        return;
      }
      const r = await signIn(normalised.value, password);
      if (r.ok) {
        router.push(redirectTo);
      } else {
        setError(r.error);
      }
    } catch {
      setError({ kind: 'network' });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [email, password, blocked, signIn, router, redirectTo]);

  const resend = useCallback(async () => {
    const normalised = normaliseEmail(email);
    if (!normalised.ok) return;
    await auth.resendVerification(normalised.value);
    setResent(true);
  }, [email, auth]);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-6"
    >
      <Field label="Email">
        {({ inputId, describedBy }) => (
          <Input
            id={inputId}
            aria-describedby={describedBy}
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={blocked}
          />
        )}
      </Field>

      <Field label="Password">
        {({ inputId, describedBy }) => (
          <Input
            id={inputId}
            aria-describedby={describedBy}
            type="password"
            autoComplete="current-password"
            enterKeyHint="go"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={blocked}
          />
        )}
      </Field>

      {error && (
        <div role="alert" className="rounded-sm border border-terracotta/30 bg-terracotta/[0.05] p-3">
          <p className="text-sm leading-relaxed text-charcoal/85">{authErrorMessage(error)}</p>
          {shouldOfferResendVerification(error) && (
            <button
              type="button"
              onClick={() => void resend()}
              className="mt-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-terracotta underline underline-offset-4"
            >
              Resend the verification email
            </button>
          )}
          {resent && (
            <p className="mt-2 text-xs text-forest">If that email has an account, the link is on its way.</p>
          )}
        </div>
      )}

      <Button type="submit" size="lg" fullWidth loading={busy} disabled={blocked}>
        Sign in
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link href="/reset" className="text-charcoal/70 underline underline-offset-4 hover:text-terracotta">
          Forgot your password?
        </Link>
        <Link href="/register" className="text-charcoal/70 underline underline-offset-4 hover:text-terracotta">
          Create an account
        </Link>
      </div>
    </form>
  );
}

/* ================================================================== *
 * Register
 * ================================================================== */

export function RegisterForm() {
  const { setSession } = useSession();
  const { auth } = useAdapters();

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    acceptedTerms: false,
    marketingOptIn: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [done, setDone] = useState(false);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setErrors({});
    setAuthError(null);

    try {
      const parsed = validateRegistration(form);
      if (!parsed.ok) {
        const map: Record<string, string> = {};
        for (const e of parsed.error) map[e.field] = e.message;
        setErrors(map);
        return;
      }
      const r = await auth.register(parsed.value);
      if (r.ok) {
        setSession(r.value);
        // ⚠ We land them on a "verify your email" state, not straight into the
        //   account — their email is unverified and some actions require it.
        setDone(true);
      } else {
        setAuthError(r.error);
      }
    } catch {
      setAuthError({ kind: 'network' });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [form, auth, setSession]);

  if (done) {
    return (
      <div className="rounded-sm border border-forest/25 bg-forest/[0.04] p-6">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-charcoal">
          Check your email
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
          We have sent a verification link to {form.email}. Open it to finish setting up your
          account. You can browse in the meantime.
        </p>
        <div className="mt-5">
          <Button variant="secondary" asChild>
            <Link href="/account">Go to your account</Link>
          </Button>
        </div>
      </div>
    );
  }

  const err = (f: string) => errors[f];

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-6"
    >
      <Field label="Your name" error={err('fullName')}>
        {({ inputId, describedBy }) => (
          <Input
            id={inputId}
            aria-describedby={describedBy}
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            invalid={!!err('fullName')}
          />
        )}
      </Field>

      <Field label="Email" error={err('email')}>
        {({ inputId, describedBy }) => (
          <Input
            id={inputId}
            aria-describedby={describedBy}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            invalid={!!err('email')}
          />
        )}
      </Field>

      <Field label="Phone number" hint="The rider will call this number." error={err('phone')}>
        {({ inputId, describedBy }) => (
          <PhoneInput
            id={inputId}
            aria-describedby={describedBy}
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            invalid={!!err('phone')}
          />
        )}
      </Field>

      <Field
        label="Password"
        hint="At least 10 characters. A short sentence works well."
        error={err('password')}
      >
        {({ inputId, describedBy }) => (
          <Input
            id={inputId}
            aria-describedby={describedBy}
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            invalid={!!err('password')}
          />
        )}
      </Field>

      <div className="space-y-3">
        <Checkbox
          id="acceptedTerms"
          checked={form.acceptedTerms}
          onCheckedChange={(v) => set('acceptedTerms', v)}
          label="I accept the terms of sale."
        />
        {err('acceptedTerms') && (
          <p role="alert" className="text-sm text-terracotta">{err('acceptedTerms')}</p>
        )}
        {/* ⚠ Marketing consent is a SEPARATE, unticked choice — never bundled
            into the terms acceptance. */}
        <Checkbox
          id="marketingOptIn"
          checked={form.marketingOptIn}
          onCheckedChange={(v) => set('marketingOptIn', v)}
          label="Send me occasional news. No noise, and you can stop any time."
        />
      </div>

      {authError && (
        <p role="alert" className="text-sm text-terracotta">{authErrorMessage(authError)}</p>
      )}

      <Button type="submit" size="lg" fullWidth loading={busy}>
        Create account
      </Button>

      <p className="text-center text-sm text-charcoal/70">
        Already have an account?{' '}
        <Link href="/signin" className="underline underline-offset-4 hover:text-terracotta">
          Sign in
        </Link>
      </p>
    </form>
  );
}
