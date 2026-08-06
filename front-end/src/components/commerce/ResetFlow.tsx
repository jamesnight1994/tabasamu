'use client';

/**
 * PASSWORD RESET
 *
 * ⚠ TWO STEPS, ONE ENUMERATION-SAFE PROMISE.
 *
 *   Step 1 (request): we show "if that email has an account, a link is on its
 *   way" — the SAME message whether or not the account exists. Confirming
 *   existence here is an enumeration oracle.
 *
 *   Step 2 (complete, reached via a tokenised link): a bad/expired/used token
 *   gets ONE message. We never distinguish "expired" from "forged" — that too
 *   leaks information.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAdapters } from './AdapterProvider';
import { Button } from '../primitives/Button';
import { Field, Input } from '../primitives/Form';
import {
  normaliseEmail,
  validatePassword,
  passwordErrorMessage,
  completeResetMessage,
  resetToken as toResetToken,
  type RequestResetResult,
} from '../../domain/identity/auth';

export function ResetFlow() {
  const params = useSearchParams();
  const token = params.get('token');

  // If a token is present, we're completing a reset. Otherwise, requesting one.
  return token ? <CompleteReset token={token} /> : <RequestReset />;
}

function RequestReset() {
  const { auth } = useAdapters();
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<RequestResetResult | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    setBusy(true);
    const normalised = normaliseEmail(email);
    if (!normalised.ok) {
      setResult({ kind: 'invalid_email', message: 'That does not look like an email address.' });
      setBusy(false);
      return;
    }
    const r = await auth.requestPasswordReset(normalised.value);
    setResult(r);
    setBusy(false);
  }, [email, auth]);

  // ⚠ The success state does NOT confirm the account exists.
  if (result?.kind === 'sent') {
    return (
      <div className="rounded-sm border border-forest/25 bg-forest/[0.04] p-6">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-charcoal">
          Check your email
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
          If that email has an account with us, a reset link is on its way. It expires in an hour.
        </p>
        <div className="mt-5">
          <Button variant="secondary" asChild>
            <Link href="/signin">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">
        Reset your password
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
        Enter your email and we will send a link to set a new one.
      </p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-8 space-y-6"
      >
        <Field
          label="Email"
          error={result?.kind === 'invalid_email' ? result.message : undefined}
        >
          {({ inputId, describedBy }) => (
            <Input
              id={inputId}
              aria-describedby={describedBy}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>

        {result?.kind === 'rate_limited' && (
          <p role="alert" className="text-sm text-terracotta">
            Too many requests. Please wait a little and try again.
          </p>
        )}

        <Button type="submit" size="lg" fullWidth loading={busy}>
          Send reset link
        </Button>

        <p className="text-center text-sm text-charcoal/70">
          <Link href="/signin" className="underline underline-offset-4 hover:text-terracotta">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

function CompleteReset({ token }: { token: string }) {
  const { auth } = useAdapters();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);

    const pw = validatePassword(password);
    if (!pw.ok) {
      setError(passwordErrorMessage(pw.error));
      setBusy(false);
      return;
    }

    const r = await auth.completePasswordReset(toResetToken(token), password);
    if (r.kind === 'ok') {
      setDone(true);
    } else {
      setError(completeResetMessage(r));
    }
    setBusy(false);
  }, [password, token, auth]);

  if (done) {
    return (
      <div className="rounded-sm border border-forest/25 bg-forest/[0.04] p-6">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-charcoal">
          Password updated
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
          You can now sign in with your new password.
        </p>
        <div className="mt-5">
          <Button asChild onClick={() => router.push('/signin')}>
            <Link href="/signin">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">
        Set a new password
      </h1>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-8 space-y-6"
      >
        <Field
          label="New password"
          hint="At least 10 characters. A short sentence works well."
          error={error ?? undefined}
        >
          {({ inputId, describedBy }) => (
            <Input
              id={inputId}
              aria-describedby={describedBy}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={!!error}
            />
          )}
        </Field>

        <Button type="submit" size="lg" fullWidth loading={busy}>
          Update password
        </Button>
      </form>
    </div>
  );
}
