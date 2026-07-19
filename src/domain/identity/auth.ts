/**
 * AUTHENTICATION DOMAIN
 *
 * ⚠ PROVIDER-NEUTRAL BY CONSTRUCTION.
 *
 *   There is no client decision on record for *how* auth works — no provider,
 *   no session model, no password policy. (Now raised as D-53/D-54/D-55.) So
 *   this domain commits to NONE of them. It describes:
 *
 *     - the SHAPE of a credential and a session,
 *     - the STATES an auth attempt can be in (including the ones people skip:
 *       rate-limited, locked, unverified),
 *     - the pure VALIDATION of an email and a password *format*,
 *
 *   and nothing about bcrypt vs argon2, JWT vs opaque-cookie, or Firebase vs
 *   Supabase vs a bespoke backend. Those are adapter concerns. The UI and the
 *   contract are written against these types, so the eventual choice is a swap.
 *
 * ⚠ THIS DOMAIN NEVER HANDLES A RAW PASSWORD BEYOND FORMAT VALIDATION.
 *   Hashing, comparison, and storage live server-side, behind the AuthService
 *   port. A password never reaches a reducer, a log, or localStorage. The one
 *   thing the frontend may do is check a NEW password is well-formed before
 *   sending it — which is a UX courtesy, not a security control.
 */

import { type Result, Ok, Err } from '../shared';
import { normalisePhone, type E164Phone } from './phone';

/* ================================================================== *
 * Email — a validated value, not a bare string
 * ================================================================== */

const brand = Symbol('brand');
type Brand<T, B> = T & { readonly [brand]: B };

export type Email = Brand<string, 'Email'>;

/**
 * ⚠ DELIBERATELY PERMISSIVE. This is NOT an attempt to validate deliverability
 *   — no regex can, and the only real test is sending a mail. It rejects the
 *   obvious garbage (no `@`, spaces, empty local/domain) and normalises case,
 *   then trusts the verification step to prove the address is real.
 *
 *   Over-strict email regexes reject valid addresses (plus-tags, new TLDs,
 *   sub-addressing) and are a well-known source of "your form won't accept my
 *   email" support tickets. We stay loose on purpose.
 */
export const normaliseEmail = (raw: string): Result<Email, EmailError> => {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) return Err({ kind: 'empty' });
  if (trimmed.length > 254) return Err({ kind: 'too_long' }); // RFC 5321
  // Exactly one @, non-empty both sides, a dot in the domain, no whitespace.
  const at = trimmed.indexOf('@');
  if (at <= 0 || at !== trimmed.lastIndexOf('@') || at === trimmed.length - 1) {
    return Err({ kind: 'malformed' });
  }
  const domain = trimmed.slice(at + 1);
  if (!domain.includes('.') || /\s/.test(trimmed)) return Err({ kind: 'malformed' });
  return Ok(trimmed as Email);
};

export type EmailError = { kind: 'empty' | 'too_long' | 'malformed' };

export const emailErrorMessage = (e: EmailError): string =>
  e.kind === 'empty'
    ? 'Enter your email.'
    : e.kind === 'too_long'
      ? 'That email is too long.'
      : 'That does not look like an email address.';

/* ================================================================== *
 * Password — FORMAT only
 * ================================================================== */

/**
 * ⚠ POLICY IS CONFIGURABLE AND CONSERVATIVE-BY-DEFAULT (D-54 open).
 *
 *   NIST 800-63B guidance, which we follow deliberately: length is the control
 *   that matters; composition rules ("must contain a symbol") mostly produce
 *   `Password1!` and worse UX. So the default is a floor on length, a ceiling
 *   high enough not to truncate a passphrase, and a check against the most
 *   common weak values — nothing that punishes a good long passphrase.
 */
export interface PasswordPolicy {
  readonly minLength: number;
  readonly maxLength: number;
  /** Reject values on the well-known-weak list even if long enough. */
  readonly rejectCommon: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 10,
  maxLength: 128,
  rejectCommon: true,
};

// A small, illustrative slice. The real list lives server-side (a 100k-entry
// check belongs at the API, not in the client bundle).
const COMMON_WEAK = new Set([
  'password', 'password1', '1234567890', 'qwertyuiop', 'letmein123',
  'tabasamu', 'tabasamu123', 'kombucha', 'kombucha123',
]);

export type PasswordError =
  | { kind: 'too_short'; min: number }
  | { kind: 'too_long'; max: number }
  | { kind: 'too_common' };

export const validatePassword = (
  pw: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): Result<true, PasswordError> => {
  if (pw.length < policy.minLength) return Err({ kind: 'too_short', min: policy.minLength });
  if (pw.length > policy.maxLength) return Err({ kind: 'too_long', max: policy.maxLength });
  if (policy.rejectCommon && COMMON_WEAK.has(pw.toLowerCase())) {
    return Err({ kind: 'too_common' });
  }
  return Ok(true);
};

export const passwordErrorMessage = (e: PasswordError): string => {
  switch (e.kind) {
    case 'too_short':
      return `Use at least ${e.min} characters. A short sentence works well.`;
    case 'too_long':
      return `That is longer than ${e.max} characters.`;
    case 'too_common':
      return 'That password is too easy to guess. Try something more personal.';
  }
};

/* ================================================================== *
 * Registration & sign-in inputs (validated, pre-transport)
 * ================================================================== */

export interface RegistrationInput {
  readonly email: string;
  readonly password: string;
  readonly fullName: string;
  readonly phone: string;
  /** ⚠ Consent is never assumed. Defaults to false; the box is never pre-ticked. */
  readonly acceptedTerms: boolean;
  readonly marketingOptIn: boolean;
}

export interface ValidRegistration {
  readonly email: Email;
  readonly password: string; // passes straight through to the port; never stored here
  readonly fullName: string;
  readonly phone: E164Phone;
  readonly marketingOptIn: boolean;
}

export type RegistrationFieldError =
  | { field: 'email'; message: string }
  | { field: 'password'; message: string }
  | { field: 'fullName'; message: string }
  | { field: 'phone'; message: string }
  | { field: 'acceptedTerms'; message: string };

export const validateRegistration = (
  input: RegistrationInput,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): Result<ValidRegistration, readonly RegistrationFieldError[]> => {
  const errors: RegistrationFieldError[] = [];

  const email = normaliseEmail(input.email);
  if (!email.ok) errors.push({ field: 'email', message: emailErrorMessage(email.error) });

  const pw = validatePassword(input.password, policy);
  if (!pw.ok) errors.push({ field: 'password', message: passwordErrorMessage(pw.error) });

  const name = input.fullName.trim();
  if (name.length === 0) errors.push({ field: 'fullName', message: 'Enter your name.' });

  const phone = normalisePhone(input.phone);
  if (!phone.ok) errors.push({ field: 'phone', message: 'Enter a valid Kenyan phone number.' });

  // ⚠ Terms must be ACTIVELY accepted. This is the one non-negotiable gate.
  if (!input.acceptedTerms) {
    errors.push({ field: 'acceptedTerms', message: 'Please accept the terms to continue.' });
  }

  if (errors.length > 0) return Err(errors);

  // All ok — the narrowing above guarantees these are present.
  return Ok({
    email: (email as { value: Email }).value,
    password: input.password,
    fullName: name,
    phone: (phone as { value: E164Phone }).value,
    marketingOptIn: input.marketingOptIn,
  });
};

/* ================================================================== *
 * Session
 * ================================================================== */

/**
 * ⚠ WHAT THE CLIENT MAY HOLD, AND WHAT IT MAY NOT.
 *
 *   The client holds a session DESCRIPTOR: who the user is, when the session
 *   expires, whether their email is verified. It does NOT hold the token that
 *   authorises requests — that is an httpOnly cookie the JS cannot read, which
 *   is the whole point (a token in localStorage is XSS-exfiltratable). [D-55]
 */
export interface Session {
  readonly customerId: string;
  readonly email: Email;
  readonly displayName: string;
  readonly emailVerified: boolean;
  /** Epoch ms. The client uses this to pre-empt a 401, not to authorise. */
  readonly expiresAt: number;
}

export const SESSION_EXPIRY_WARNING_MS = 2 * 60 * 1000; // warn 2 min out

export const isSessionExpired = (session: Session, now: number = Date.now()): boolean =>
  now >= session.expiresAt;

export const isSessionExpiringSoon = (session: Session, now: number = Date.now()): boolean =>
  !isSessionExpired(session, now) && session.expiresAt - now <= SESSION_EXPIRY_WARNING_MS;

export const msUntilExpiry = (session: Session, now: number = Date.now()): number =>
  Math.max(0, session.expiresAt - now);

/* ================================================================== *
 * Auth outcome — the states people forget
 * ================================================================== */

/**
 * ⚠ THE ERROR STATES THAT MATTER.
 *
 *   `invalid_credentials` is the boring one. The ones a real integration must
 *   handle, and naive ones don't:
 *
 *     - `rate_limited`   — too many attempts; carries a retry-after so the UI
 *                          can say "try again in 4 minutes", not "try again"
 *                          against a wall.
 *     - `locked`         — the account is temporarily locked after repeated
 *                          failures; distinct from rate-limiting the IP.
 *     - `unverified`     — correct password, but email not verified; the UI
 *                          must route to "resend verification", not to "wrong
 *                          password", which would be a lie.
 *
 * ⚠ NOTE `invalid_credentials` DELIBERATELY DOES NOT SAY WHICH FIELD WAS WRONG.
 *   "No account with that email" is an account-enumeration oracle — it lets an
 *   attacker discover who has an account. Email and password are wrong together
 *   or right together, as far as the customer is told.
 */
export type AuthError =
  | { kind: 'invalid_credentials' }
  | { kind: 'rate_limited'; retryAfterMs: number }
  | { kind: 'locked'; until: number }
  | { kind: 'unverified'; email: Email }
  | { kind: 'network' }
  | { kind: 'server' };

export const authErrorMessage = (e: AuthError): string => {
  switch (e.kind) {
    case 'invalid_credentials':
      // ⚠ Same message whether the email is unknown or the password is wrong.
      return 'That email and password do not match. Please try again.';
    case 'rate_limited': {
      const mins = Math.ceil(e.retryAfterMs / 60000);
      return `Too many attempts. Please wait ${mins} minute${mins === 1 ? '' : 's'} and try again.`;
    }
    case 'locked': {
      const mins = Math.ceil((e.until - Date.now()) / 60000);
      return `This account is locked for ${mins} minute${mins === 1 ? '' : 's'} after several failed attempts.`;
    }
    case 'unverified':
      return 'Please verify your email first. We can send the link again.';
    case 'network':
      return 'We could not reach the server. Check your connection and try again.';
    case 'server':
      return 'Something went wrong on our end. Please try again shortly.';
  }
};

/** Should the UI offer a "resend verification" action for this error? */
export const shouldOfferResendVerification = (e: AuthError): boolean => e.kind === 'unverified';

/** Should the sign-in form be disabled (hard block) vs merely showing an error? */
export const isHardBlocked = (e: AuthError): boolean =>
  e.kind === 'rate_limited' || e.kind === 'locked';

/* ================================================================== *
 * Password reset — the states
 * ================================================================== */

/**
 * ⚠ THE RESET FLOW NEVER CONFIRMS WHETHER AN EMAIL EXISTS.
 *
 *   "We've sent a reset link" is shown whether or not the address has an
 *   account. Anything else is an enumeration oracle. So `RequestResetResult`
 *   has ONE success shape and it is intentionally uninformative about existence.
 */
export type RequestResetResult =
  | { kind: 'sent' } // always this, for any syntactically-valid email
  | { kind: 'invalid_email'; message: string }
  | { kind: 'rate_limited'; retryAfterMs: number };

export type ResetToken = Brand<string, 'ResetToken'>;

export type CompleteResetResult =
  | { kind: 'ok' }
  | { kind: 'invalid_token' } // expired, used, or forged — one message for all
  | { kind: 'weak_password'; message: string };

export const completeResetMessage = (r: Exclude<CompleteResetResult, { kind: 'ok' }>): string =>
  r.kind === 'invalid_token'
    ? 'This reset link has expired or already been used. Please request a new one.'
    : r.message;

export const email = (s: string): Email => s as Email;
export const resetToken = (s: string): ResetToken => s as ResetToken;
