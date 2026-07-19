/**
 * PHASE 6 — ACCOUNT & AUTH TESTS
 *
 * The ⚠ rows are the ones that protect a customer or a legal obligation:
 * enumeration resistance, rate-limiting, the single-default invariant, the
 * subscription machine's terminal states, and the append-only consent log.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  normaliseEmail,
  validatePassword,
  validateRegistration,
  isSessionExpired,
  isSessionExpiringSoon,
  authErrorMessage,
  shouldOfferResendVerification,
  isHardBlocked,
  type Session,
} from '../../src/domain/identity/auth';

import {
  validateAddress,
  defaultAddress,
  withAddedAddress,
  withDefaultAddress,
  withRemovedAddress,
  type SavedAddress,
} from '../../src/domain/identity/customer';

import {
  DEFAULT_SUBSCRIPTION_POLICY,
  permittedOperations,
  cancel,
  pause,
  resume,
  canTransition,
  isTerminalSubscription,
  frequencyLabel,
  subscriptionsAreOffered,
  type Subscription,
  type SubscriptionPolicy,
} from '../../src/domain/subscription';

import {
  currentConsent,
  DEFAULT_COOKIE_PREFERENCES,
  acceptAllCookies,
  rejectAllCookies,
  DEFAULT_CHANNEL_PREFERENCES,
  type ConsentEvent,
} from '../../src/domain/preferences';

import {
  createMockAdapters,
  configureMocks,
  resetMockState,
} from '../../src/adapters/mock';
import {
  __signInAs,
  __latestResetToken,
  __latestVerifyToken,
  __seedDemoAccount,
} from '../../src/adapters/mock/accounts';
import { email as toEmail } from '../../src/domain/identity/auth';
import { addressId as toAddressId, subscriptionId as toSubId } from '../../src/domain/shared';

/* ================================================================== *
 * Email & password validation
 * ================================================================== */

describe('email validation', () => {
  it('accepts and lowercases a normal address', () => {
    const r = normaliseEmail('  Amina@Tabasamu.CO.KE ');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('amina@tabasamu.co.ke');
  });

  it('rejects the obvious garbage', () => {
    for (const bad of ['', 'nope', 'a@b', 'two@@at.com', 'spa ce@x.com', 'trailing@']) {
      expect(normaliseEmail(bad).ok).toBe(false);
    }
  });

  it('⚠ does NOT reject plus-tags or new TLDs (over-strict regexes cause tickets)', () => {
    expect(normaliseEmail('amina+kombucha@tabasamu.co.ke').ok).toBe(true);
    expect(normaliseEmail('hi@brand.africa').ok).toBe(true);
  });
});

describe('password policy', () => {
  it('enforces length as the primary control', () => {
    expect(validatePassword('short').ok).toBe(false);
    expect(validatePassword('a-long-enough-passphrase').ok).toBe(true);
  });

  it('⚠ rejects common weak values even when long enough', () => {
    expect(validatePassword('tabasamu123').ok).toBe(false);
  });

  it('does not impose composition rules on a good passphrase', () => {
    // no symbol, no digit, no uppercase — but long and not common → fine
    expect(validatePassword('correct horse battery staple').ok).toBe(true);
  });
});

describe('registration validation', () => {
  const good = {
    email: 'new@tabasamu.co.ke',
    password: 'a-decent-passphrase',
    fullName: 'New Customer',
    phone: '0712345678',
    acceptedTerms: true,
    marketingOptIn: false,
  };

  it('accepts a well-formed registration and normalises the phone', () => {
    const r = validateRegistration(good);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.phone).toBe('254712345678');
  });

  it('⚠ refuses when terms are not actively accepted', () => {
    const r = validateRegistration({ ...good, acceptedTerms: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.some((e) => e.field === 'acceptedTerms')).toBe(true);
  });

  it('rejects a foreign phone number', () => {
    const r = validateRegistration({ ...good, phone: '+44 7911 123456' });
    expect(r.ok).toBe(false);
  });
});

/* ================================================================== *
 * Session
 * ================================================================== */

describe('session', () => {
  const base: Session = {
    customerId: 'c', email: toEmail('a@b.co'), displayName: 'A',
    emailVerified: true, expiresAt: 0,
  };

  it('detects expiry', () => {
    expect(isSessionExpired({ ...base, expiresAt: Date.now() - 1 })).toBe(true);
    expect(isSessionExpired({ ...base, expiresAt: Date.now() + 60_000 })).toBe(false);
  });

  it('warns shortly before expiry', () => {
    expect(isSessionExpiringSoon({ ...base, expiresAt: Date.now() + 60_000 })).toBe(true);
    expect(isSessionExpiringSoon({ ...base, expiresAt: Date.now() + 10 * 60_000 })).toBe(false);
  });
});

/* ================================================================== *
 * Auth adapter — enumeration resistance, rate limiting, verification
 * ================================================================== */

describe('⚠ auth adapter behaviour', () => {
  beforeEach(() => {
    resetMockState();
    configureMocks({ latencyMs: 0 });
    __seedDemoAccount();
  });

  it('signs in the seeded demo account', async () => {
    const { auth } = createMockAdapters();
    const r = await auth.signIn(toEmail('demo@tabasamu.co.ke'), 'tabasamu-demo-2026');
    expect(r.ok).toBe(true);
  });

  it('⚠ gives the SAME error for wrong password and unknown email (no enumeration)', async () => {
    const { auth } = createMockAdapters();
    const wrongPw = await auth.signIn(toEmail('demo@tabasamu.co.ke'), 'nope');
    const noUser = await auth.signIn(toEmail('ghost@nowhere.co.ke'), 'nope');
    expect(wrongPw.ok).toBe(false);
    expect(noUser.ok).toBe(false);
    if (!wrongPw.ok && !noUser.ok) {
      expect(wrongPw.error.kind).toBe('invalid_credentials');
      expect(noUser.error.kind).toBe(wrongPw.error.kind);
    }
  });

  it('⚠ rate-limits after repeated failures, with a retry-after', async () => {
    const { auth } = createMockAdapters();
    const e = toEmail('demo@tabasamu.co.ke');
    let last;
    for (let i = 0; i < 6; i++) last = await auth.signIn(e, 'wrong');
    expect(last!.ok).toBe(false);
    if (!last!.ok) {
      expect(last!.error.kind).toBe('rate_limited');
      if (last!.error.kind === 'rate_limited') expect(last!.error.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it('⚠ a new registration is UNVERIFIED and cannot sign in until verified', async () => {
    const { auth } = createMockAdapters();
    const reg = await auth.register({
      email: toEmail('fresh@tabasamu.co.ke'),
      password: 'a-good-passphrase',
      fullName: 'Fresh User',
      phone: '254712345678' as never,
      marketingOptIn: false,
    });
    expect(reg.ok).toBe(true);
    await auth.signOut();

    const signIn = await auth.signIn(toEmail('fresh@tabasamu.co.ke'), 'a-good-passphrase');
    expect(signIn.ok).toBe(false);
    if (!signIn.ok) expect(signIn.error.kind).toBe('unverified');

    // Verify, then sign-in works.
    const vt = __latestVerifyToken();
    expect(vt).toBeTruthy();
    await auth.verifyEmail(vt!);
    const after = await auth.signIn(toEmail('fresh@tabasamu.co.ke'), 'a-good-passphrase');
    expect(after.ok).toBe(true);
  });

  it('⚠ password reset never reveals whether the account exists', async () => {
    const { auth } = createMockAdapters();
    const real = await auth.requestPasswordReset(toEmail('demo@tabasamu.co.ke'));
    const fake = await auth.requestPasswordReset(toEmail('ghost@nowhere.co.ke'));
    expect(real.kind).toBe('sent');
    expect(fake.kind).toBe('sent'); // identical
  });

  it('completes a password reset and clears the lockout', async () => {
    const { auth } = createMockAdapters();
    const e = toEmail('demo@tabasamu.co.ke');
    await auth.requestPasswordReset(e);
    const token = __latestResetToken();
    const res = await auth.completePasswordReset(token as never, 'brand-new-passphrase');
    expect(res.kind).toBe('ok');
    const signIn = await auth.signIn(e, 'brand-new-passphrase');
    expect(signIn.ok).toBe(true);
  });

  it('rejects an invalid reset token without leaking why', async () => {
    const { auth } = createMockAdapters();
    const res = await auth.completePasswordReset('forged-token' as never, 'whatever-passphrase');
    expect(res.kind).toBe('invalid_token');
  });
});

describe('auth error UX helpers', () => {
  it('offers resend only for the unverified state', () => {
    expect(shouldOfferResendVerification({ kind: 'unverified', email: toEmail('a@b.co') })).toBe(true);
    expect(shouldOfferResendVerification({ kind: 'invalid_credentials' })).toBe(false);
  });

  it('hard-blocks the form for rate-limit and lock', () => {
    expect(isHardBlocked({ kind: 'rate_limited', retryAfterMs: 1000 })).toBe(true);
    expect(isHardBlocked({ kind: 'locked', until: Date.now() + 1000 })).toBe(true);
    expect(isHardBlocked({ kind: 'invalid_credentials' })).toBe(false);
  });

  it('rate-limit message states the wait', () => {
    expect(authErrorMessage({ kind: 'rate_limited', retryAfterMs: 4 * 60_000 })).toMatch(/4 minutes/);
  });
});

/* ================================================================== *
 * Address book — the single-default invariant
 * ================================================================== */

describe('address validation', () => {
  const good = {
    label: 'Home', recipientName: 'Amina', recipientPhone: '0712345678',
    zoneId: '', estate: 'Kileleshwa', building: 'Block C', landmark: 'By the shop', instructions: '',
  };

  it('accepts a well-formed Nairobi address', () => {
    expect(validateAddress(good).ok).toBe(true);
  });

  it('⚠ requires a landmark — it is what the rider navigates by', () => {
    const r = validateAddress({ ...good, landmark: '  ' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.some((e) => e.field === 'landmark')).toBe(true);
  });

  it('⛔ does not force a zone while zones are unconfirmed (D-21/22/23)', () => {
    expect(validateAddress({ ...good, zoneId: '' }, { requireZone: false }).ok).toBe(true);
    expect(validateAddress({ ...good, zoneId: '' }, { requireZone: true }).ok).toBe(false);
  });
});

describe('⚠ address book single-default invariant', () => {
  const mk = (id: string, isDefault = false): SavedAddress => ({
    id: toAddressId(id), label: id, recipientName: 'x',
    recipientPhone: '254712345678' as never, zoneId: '', estate: 'e', building: 'b',
    landmark: 'l', instructions: '', isDefault,
  });

  it('the first address added becomes default automatically', () => {
    const book = withAddedAddress([], mk('a'));
    expect(book[0].isDefault).toBe(true);
  });

  it('a second address does not steal default', () => {
    let book = withAddedAddress([], mk('a'));
    book = withAddedAddress(book, mk('b'));
    expect(book.filter((x) => x.isDefault)).toHaveLength(1);
    expect(book.find((x) => x.isDefault)!.id).toBe('a');
  });

  it('setting a default moves it to exactly one', () => {
    let book = withAddedAddress([], mk('a'));
    book = withAddedAddress(book, mk('b'));
    book = withDefaultAddress(book, toAddressId('b'));
    expect(book.filter((x) => x.isDefault)).toHaveLength(1);
    expect(book.find((x) => x.isDefault)!.id).toBe('b');
  });

  it('⚠ removing the default promotes another so the invariant holds', () => {
    let book = withAddedAddress([], mk('a')); // a is default
    book = withAddedAddress(book, mk('b'));
    book = withRemovedAddress(book, toAddressId('a'));
    expect(book).toHaveLength(1);
    expect(book[0].isDefault).toBe(true); // b promoted
  });

  it('removing the last address leaves an empty book with no default', () => {
    let book = withAddedAddress([], mk('a'));
    book = withRemovedAddress(book, toAddressId('a'));
    expect(book).toHaveLength(0);
    expect(defaultAddress(book)).toBeNull();
  });
});

/* ================================================================== *
 * Subscription state machine — NO billing, terminal correctness
 * ================================================================== */

describe('subscription policy & frequency', () => {
  it('⛔ offers no frequencies by default (D-07)', () => {
    expect(subscriptionsAreOffered(DEFAULT_SUBSCRIPTION_POLICY)).toBe(false);
  });

  it('labels frequencies readably', () => {
    expect(frequencyLabel({ unit: 'week', interval: 1 })).toBe('Every week');
    expect(frequencyLabel({ unit: 'week', interval: 2 })).toBe('Every 2 weeks');
    expect(frequencyLabel({ unit: 'month', interval: 1 })).toBe('Every month');
  });
});

describe('⚠ subscription state machine', () => {
  const sub = (over: Partial<Subscription> = {}): Subscription => ({
    id: toSubId('s1'), status: 'active', frequency: { unit: 'month', interval: 1 },
    lines: [{ variantId: 'v' as never, quantity: 1, productName: 'Passion' }],
    deliveryAddressId: toAddressId('a'), paymentMethod: 'mpesa',
    nextDeliveryAt: 0, estimatedTotal: 0 as never, completedCycles: 3, createdAt: 0, ...over,
  });

  it('active can pause; paused can resume; the round trip works', () => {
    const p = pause(sub(), DEFAULT_SUBSCRIPTION_POLICY);
    expect(p.ok && p.value.status).toBe('paused');
    if (p.ok) {
      const r = resume(p.value, DEFAULT_SUBSCRIPTION_POLICY);
      expect(r.ok && r.value.status).toBe('active');
    }
  });

  it('⚠ cancelled and expired are TERMINAL — no transitions out', () => {
    expect(isTerminalSubscription('cancelled')).toBe(true);
    expect(isTerminalSubscription('expired')).toBe(true);
    expect(canTransition('cancelled', 'active')).toBe(false);
  });

  it('⚠ respects a minimum-cycle commitment before cancel', () => {
    const policy: SubscriptionPolicy = { ...DEFAULT_SUBSCRIPTION_POLICY, minCyclesBeforeCancel: 6 };
    const young = sub({ completedCycles: 2 });
    const ops = permittedOperations(young, policy);
    expect(ops.canCancel).toBe(false);
    expect(ops.cyclesUntilCancellable).toBe(4);
    const res = cancel(young, policy);
    expect(res.ok).toBe(false);
  });

  it('permits cancel once the commitment is met', () => {
    const policy: SubscriptionPolicy = { ...DEFAULT_SUBSCRIPTION_POLICY, minCyclesBeforeCancel: 3 };
    const res = cancel(sub({ completedCycles: 3 }), policy);
    expect(res.ok && res.value.status).toBe('cancelled');
  });

  it('⚠ payment_failed is neither active nor cancelled — it needs attention', () => {
    const ops = permittedOperations(sub({ status: 'payment_failed' }), DEFAULT_SUBSCRIPTION_POLICY);
    // can still change address/payment to fix it; cannot pause a failed sub
    expect(ops.canPause).toBe(false);
    expect(ops.canChangePayment).toBe(true);
  });
});

describe('⚠ subscription adapter — reactivation creates a NEW subscription', () => {
  beforeEach(() => {
    resetMockState();
    configureMocks({ latencyMs: 0 });
    __seedDemoAccount();
    __signInAs('demo@tabasamu.co.ke');
  });

  it('reactivating a cancelled sub yields a new id, preserving history', async () => {
    const { subscriptions } = createMockAdapters();
    const list = await subscriptions.list();
    const first = list[0];
    await subscriptions.cancel(first.id);

    const re = await subscriptions.reactivate(first.id);
    expect(re.ok).toBe(true);
    if (re.ok) expect(re.value.id).not.toBe(first.id); // NEW subscription

    const after = await subscriptions.list();
    // original (cancelled) still present + the new one = history preserved
    expect(after.length).toBe(list.length + 1);
  });
});

/* ================================================================== *
 * Preferences & consent — append-only, opt-in defaults
 * ================================================================== */

describe('cookie preferences', () => {
  it('⚠ default is undecided, only necessary on', () => {
    expect(DEFAULT_COOKIE_PREFERENCES.decided).toBe(false);
    expect(DEFAULT_COOKIE_PREFERENCES.analytics).toBe(false);
    expect(DEFAULT_COOKIE_PREFERENCES.necessary).toBe(true);
  });

  it('accept-all and reject-all both count as a decision', () => {
    expect(acceptAllCookies().decided).toBe(true);
    expect(rejectAllCookies().decided).toBe(true);
    expect(rejectAllCookies().analytics).toBe(false);
    expect(acceptAllCookies().analytics).toBe(true);
  });
});

describe('channel preferences', () => {
  it('⚠ transactional email cannot be switched off; marketing defaults off', () => {
    expect(DEFAULT_CHANNEL_PREFERENCES.email.transactional).toBe(true);
    expect(DEFAULT_CHANNEL_PREFERENCES.email.marketing).toBe(false);
  });

  it('⚠ SMS transactional defaults ON (Kenya market norm)', () => {
    expect(DEFAULT_CHANNEL_PREFERENCES.sms.transactional).toBe(true);
  });

  it('⛔ WhatsApp defaults fully off (D-42 undecided)', () => {
    expect(DEFAULT_CHANNEL_PREFERENCES.whatsapp.transactional).toBe(false);
    expect(DEFAULT_CHANNEL_PREFERENCES.whatsapp.marketing).toBe(false);
  });
});

describe('⚠ consent is derived from an append-only log', () => {
  const cid = 'c1';
  const ev = (granted: boolean, at: number): ConsentEvent => ({
    customerId: cid as never, topic: 'marketing_email', granted, at,
    source: 'preferences', policyVersion: 'v1',
  });

  it('the latest event per topic wins', () => {
    const log = [ev(true, 100), ev(false, 200), ev(true, 300)];
    expect(currentConsent(log, 'marketing_email')).toBe(true);
    const log2 = [ev(true, 100), ev(false, 200)];
    expect(currentConsent(log2, 'marketing_email')).toBe(false);
  });

  it('⚠ absence of any event means WITHHELD, never assumed granted', () => {
    expect(currentConsent([], 'marketing_email')).toBe(false);
  });
});

describe('⚠ consent adapter appends, never overwrites', () => {
  beforeEach(() => {
    resetMockState();
    configureMocks({ latencyMs: 0 });
    __seedDemoAccount();
    __signInAs('demo@tabasamu.co.ke');
  });

  it('recording consent twice keeps BOTH events (audit trail)', async () => {
    const { preferences } = createMockAdapters();
    const before = (await preferences.consentHistory()).length;
    await preferences.recordConsent('marketing_sms', true, 'preferences');
    await preferences.recordConsent('marketing_sms', false, 'preferences');
    const after = await preferences.consentHistory();
    expect(after.length).toBe(before + 2); // nothing overwritten
  });

  it('⚠ a deletion request is a REQUEST with a status, not an instant action', async () => {
    const { preferences } = createMockAdapters();
    const r = await preferences.requestData('deletion');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('requested'); // not "completed"
  });
});
