/**
 * MOCK ACCOUNT ADAPTERS — Phase 6
 *
 * ⚠ DELIBERATELY REALISTIC, INCLUDING THE UNPLEASANT PARTS.
 *
 *   A mock that always succeeds teaches the UI nothing. This one rate-limits
 *   after repeated failures, refuses sign-in for an unverified account, keeps an
 *   append-only consent log, enforces the single-default address invariant, and
 *   drives a real subscription state machine. The UI is built against these
 *   behaviours, so the real backend arriving changes nothing above the adapter.
 *
 * ⚠ WHAT IT DOES NOT DO: move money. Subscription billing is blocked on D-09,
 *   so `resolveFailedPayment` transitions state on confirmed recovery and
 *   charges nothing — there is no charging model to invoke.
 *
 * ⚠ SECURITY THEATRE AVOIDED: this stores plaintext passwords in a Map because
 *   it is an in-memory dev mock with throwaway data. The REAL adapter hashes
 *   server-side. This is called out so nobody mistakes the mock for a pattern.
 */

import {
  type AuthService,
  type CustomerService,
  type AddressService,
  type SubscriptionService,
  type PreferencesService,
} from '../../ports';
import {
  type Result,
  Ok,
  Err,
  customerId as toCustomerId,
  addressId as toAddressId,
  subscriptionId as toSubscriptionId,
  type AddressId,
  type SubscriptionId,
} from '../../domain/shared';
import {
  type Session,
  type Email,
  type ValidRegistration,
  type AuthError,
  type RequestResetResult,
  type CompleteResetResult,
  type ResetToken,
  email as toEmail,
} from '../../domain/identity/auth';
import {
  type CustomerProfile,
  type SavedAddress,
  type ValidAddress,
  withAddedAddress,
  withRemovedAddress,
  withDefaultAddress,
  withUpdatedAddress,
} from '../../domain/identity/customer';
import {
  type Subscription,
  type SubscriptionPolicy,
  type SubscriptionLine,
  type Frequency,
  DEFAULT_SUBSCRIPTION_POLICY,
  pause as pauseFn,
  resume as resumeFn,
  cancel as cancelFn,
  changeFlavours as changeFlavoursFn,
  changeFrequency as changeFrequencyFn,
  changeAddress as changeAddressFn,
  markRecovered,
} from '../../domain/subscription';
import {
  type ChannelPreferences,
  type CookiePreferences,
  type ConsentEvent,
  type ConsentTopic,
  type DataRequest,
  type DataRequestKind,
  DEFAULT_CHANNEL_PREFERENCES,
  DEFAULT_COOKIE_PREFERENCES,
} from '../../domain/preferences';
import { unavailable } from '../../domain/catalogue';
import { __seedDemoOrders } from './index';

/* ================================================================== *
 * In-memory store
 * ================================================================== */

interface MockAccount {
  customerId: string;
  email: Email;
  password: string; // ⚠ mock only — real adapter hashes server-side
  fullName: string;
  phone: string;
  emailVerified: boolean;
  createdAt: number;
}

const accounts = new Map<string, MockAccount>(); // key: email
const failCounts = new Map<string, { count: number; until: number }>(); // key: email
let currentEmail: string | null = null; // the "cookie"

const addressBooks = new Map<string, SavedAddress[]>(); // key: customerId
const subscriptions = new Map<string, Subscription[]>(); // key: customerId
const channelPrefs = new Map<string, ChannelPreferences>();
const cookiePrefs = new Map<string, CookiePreferences>();
const consentLog = new Map<string, ConsentEvent[]>(); // append-only per customer
const dataRequests = new Map<string, DataRequest[]>();
const resetTokens = new Map<string, string>(); // token -> email
const verifyTokens = new Map<string, string>(); // token -> email

let seq = 1;
const nextId = (p: string) => `${p}_${Date.now().toString(36)}_${(seq++).toString(36)}`;

const RATE_LIMIT_THRESHOLD = 5;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 30 * 60 * 1000;

const latency = () => new Promise((r) => setTimeout(r, 40 + Math.random() * 60));

const sessionFor = (a: MockAccount): Session => ({
  customerId: a.customerId,
  email: a.email,
  displayName: a.fullName.split(' ')[0] || a.fullName,
  emailVerified: a.emailVerified,
  expiresAt: Date.now() + SESSION_TTL_MS,
});

/* ================================================================== *
 * Seed — one demo account so the account area is explorable
 * ================================================================== */

const seedDemo = () => {
  if (accounts.size > 0) return;
  const cid = toCustomerId('cust_demo');
  const demo: MockAccount = {
    customerId: cid,
    email: toEmail('demo@tabasamu.co.ke'),
    password: 'tabasamu-demo-2026',
    fullName: 'Amina Wanjiru',
    phone: '254712000111',
    emailVerified: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90, // ~3 months ago
  };
  accounts.set(demo.email, demo);

  // A default address so the book is non-empty.
  addressBooks.set(cid, [
    {
      id: toAddressId('addr_demo_1'),
      label: 'Home',
      recipientName: 'Amina Wanjiru',
      recipientPhone: '254712000111' as SavedAddress['recipientPhone'],
      zoneId: '', // ⛔ D-21/22/23 — no zone exists to reference yet
      estate: 'Kileleshwa',
      building: 'Riverside Apartments, Block C, Flat 4',
      landmark: 'Opposite the Total petrol station',
      instructions: 'Call on arrival; gate code 4471.',
      isDefault: true,
    },
  ]);

  // ⛔ A subscription in a DELIVERABLE-looking state, but with billing blocked.
  subscriptions.set(cid, [
    {
      id: toSubscriptionId('sub_demo_1'),
      status: 'active',
      frequency: { unit: 'month', interval: 1 }, // display only; not "offered" until D-07
      lines: [
        { variantId: 'var_passion_1l' as SubscriptionLine['variantId'], quantity: 2, productName: 'Passion' },
        { variantId: 'var_pineapple_1l' as SubscriptionLine['variantId'], quantity: 1, productName: 'Pineapple' },
      ],
      deliveryAddressId: toAddressId('addr_demo_1'),
      paymentMethod: 'mpesa',
      // ⛔ D-09 — next charge date & amount are unknowable. Delivery date shown
      //    if the backend supplies it; here it's honestly Unavailable.
      nextDeliveryAt: unavailable('D-09', 'Billing/delivery scheduling model not decided.'),
      estimatedTotal: unavailable('D-09', 'Subscription billing amount not decided.'),
      completedCycles: 2,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    },
  ]);

  channelPrefs.set(cid, DEFAULT_CHANNEL_PREFERENCES);
  cookiePrefs.set(cid, DEFAULT_COOKIE_PREFERENCES);
  consentLog.set(cid, [
    {
      customerId: cid,
      topic: 'terms_of_sale',
      granted: true,
      at: demo.createdAt,
      source: 'registration',
      policyVersion: 'pending-D-43',
    },
  ]);

  __seedDemoOrders(cid);
};

const requireSession = (): MockAccount | null => {
  if (!currentEmail) return null;
  return accounts.get(currentEmail) ?? null;
};

/* ================================================================== *
 * Auth
 * ================================================================== */

export const mockAuth = (): AuthService => ({
  async register(input: ValidRegistration): Promise<Result<Session, AuthError>> {
    await latency();
    seedDemo();
    if (accounts.has(input.email)) {
      // ⚠ We do NOT reveal "already registered" as a hard error that enables
      //   enumeration — but for a mock we return invalid_credentials-style
      //   generic failure. The real backend sends a "you already have an
      //   account" email instead of confirming on-screen.
      return Err({ kind: 'invalid_credentials' });
    }
    const cid = toCustomerId(nextId('cust'));
    const account: MockAccount = {
      customerId: cid,
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      phone: input.phone,
      emailVerified: false, // ⚠ must verify before full access
      createdAt: Date.now(),
    };
    accounts.set(input.email, account);
    addressBooks.set(cid, []);
    subscriptions.set(cid, []);
    channelPrefs.set(cid, {
      ...DEFAULT_CHANNEL_PREFERENCES,
      email: { ...DEFAULT_CHANNEL_PREFERENCES.email, marketing: input.marketingOptIn },
    });
    cookiePrefs.set(cid, DEFAULT_COOKIE_PREFERENCES);
    consentLog.set(cid, [
      { customerId: cid, topic: 'terms_of_sale', granted: true, at: Date.now(), source: 'registration', policyVersion: 'pending-D-43' },
      { customerId: cid, topic: 'marketing_email', granted: input.marketingOptIn, at: Date.now(), source: 'registration', policyVersion: 'pending-D-43' },
    ]);

    // Issue a verification token (in reality emailed).
    verifyTokens.set(nextId('vt'), input.email);
    currentEmail = input.email;
    return Ok(sessionFor(account));
  },

  async signIn(email: Email, password: string): Promise<Result<Session, AuthError>> {
    await latency();
    seedDemo();

    // ⚠ Rate-limit check FIRST, before we even look at credentials.
    const fc = failCounts.get(email);
    if (fc && fc.count >= RATE_LIMIT_THRESHOLD && Date.now() < fc.until) {
      return Err({ kind: 'rate_limited', retryAfterMs: fc.until - Date.now() });
    }

    const account = accounts.get(email);
    // ⚠ Same generic failure whether the account is missing or the password is
    //   wrong — no enumeration oracle.
    if (!account || account.password !== password) {
      const next = (fc?.count ?? 0) + 1;
      failCounts.set(email, { count: next, until: Date.now() + RATE_LIMIT_WINDOW_MS });
      return Err({ kind: 'invalid_credentials' });
    }

    // Correct credentials but unverified → distinct, actionable state.
    if (!account.emailVerified) {
      return Err({ kind: 'unverified', email });
    }

    failCounts.delete(email);
    currentEmail = email;
    return Ok(sessionFor(account));
  },

  async signOut(): Promise<void> {
    await latency();
    currentEmail = null;
  },

  async currentSession(): Promise<Session | null> {
    seedDemo();
    const a = requireSession();
    return a ? sessionFor(a) : null;
  },

  async refresh(): Promise<Result<Session, AuthError>> {
    await latency();
    const a = requireSession();
    return a ? Ok(sessionFor(a)) : Err({ kind: 'invalid_credentials' });
  },

  async requestPasswordReset(email: Email): Promise<RequestResetResult> {
    await latency();
    // ⚠ ALWAYS 'sent'. We do not confirm whether the account exists.
    if (accounts.has(email)) {
      resetTokens.set(nextId('rt'), email);
    }
    return { kind: 'sent' };
  },

  async completePasswordReset(token: ResetToken, newPassword: string): Promise<CompleteResetResult> {
    await latency();
    const email = resetTokens.get(token);
    if (!email) return { kind: 'invalid_token' };
    const account = accounts.get(email);
    if (!account) return { kind: 'invalid_token' };
    account.password = newPassword;
    resetTokens.delete(token);
    failCounts.delete(email); // a successful reset clears the lockout
    return { kind: 'ok' };
  },

  async verifyEmail(token: string): Promise<Result<true, { kind: string }>> {
    await latency();
    const email = verifyTokens.get(token);
    if (!email) return Err({ kind: 'invalid_token' });
    const account = accounts.get(email);
    if (account) account.emailVerified = true;
    verifyTokens.delete(token);
    return Ok(true);
  },

  async resendVerification(email: Email): Promise<Result<true, AuthError>> {
    await latency();
    if (accounts.has(email)) verifyTokens.set(nextId('vt'), email);
    return Ok(true); // always ok — no enumeration
  },
});

/* ================================================================== *
 * Customer
 * ================================================================== */

export const mockCustomer = (): CustomerService => ({
  async profile(): Promise<CustomerProfile | null> {
    seedDemo();
    const a = requireSession();
    if (!a) return null;
    return {
      id: toCustomerId(a.customerId),
      email: a.email,
      fullName: a.fullName,
      phone: a.phone as CustomerProfile['phone'],
      emailVerified: a.emailVerified,
      createdAt: a.createdAt,
    };
  },

  async updateProfile(update): Promise<Result<CustomerProfile, { kind: string }>> {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    if (update.fullName !== undefined) a.fullName = update.fullName;
    if (update.phone !== undefined) a.phone = update.phone;
    return Ok({
      id: toCustomerId(a.customerId),
      email: a.email,
      fullName: a.fullName,
      phone: a.phone as CustomerProfile['phone'],
      emailVerified: a.emailVerified,
      createdAt: a.createdAt,
    });
  },
});

/* ================================================================== *
 * Addresses — the single-default invariant enforced via domain fns
 * ================================================================== */

const bookFor = (cid: string): SavedAddress[] => addressBooks.get(cid) ?? [];

export const mockAddresses = (): AddressService => ({
  async list(): Promise<readonly SavedAddress[]> {
    seedDemo();
    const a = requireSession();
    return a ? bookFor(a.customerId) : [];
  },

  async add(address: ValidAddress): Promise<Result<SavedAddress, { kind: string }>> {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    const saved: SavedAddress = { id: toAddressId(nextId('addr')), ...address, isDefault: false };
    const next = withAddedAddress(bookFor(a.customerId), saved);
    addressBooks.set(a.customerId, [...next]);
    // Return the stored version (its isDefault may have been set true if first).
    return Ok(next.find((x) => x.id === saved.id)!);
  },

  async update(id: AddressId, fields: ValidAddress): Promise<Result<SavedAddress, { kind: string }>> {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    const next = withUpdatedAddress(bookFor(a.customerId), id, fields);
    addressBooks.set(a.customerId, [...next]);
    const updated = next.find((x) => x.id === id);
    return updated ? Ok(updated) : Err({ kind: 'not_found' });
  },

  async remove(id: AddressId): Promise<Result<true, { kind: string }>> {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    addressBooks.set(a.customerId, [...withRemovedAddress(bookFor(a.customerId), id)]);
    return Ok(true);
  },

  async setDefault(id: AddressId): Promise<Result<true, { kind: string }>> {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    addressBooks.set(a.customerId, [...withDefaultAddress(bookFor(a.customerId), id)]);
    return Ok(true);
  },
});

/* ================================================================== *
 * Subscriptions — real state machine, NO billing (D-09)
 * ================================================================== */

const subsFor = (cid: string): Subscription[] => subscriptions.get(cid) ?? [];

const applySub = (
  cid: string,
  id: SubscriptionId,
  fn: (s: Subscription) => Result<Subscription, { kind: string }>
): Result<Subscription, { kind: string }> => {
  const list = subsFor(cid);
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return Err({ kind: 'not_found' });
  const res = fn(list[idx]);
  if (!res.ok) return res;
  const next = [...list];
  next[idx] = res.value;
  subscriptions.set(cid, next);
  return Ok(res.value);
};

export const mockSubscriptions = (policy: SubscriptionPolicy = DEFAULT_SUBSCRIPTION_POLICY): SubscriptionService => ({
  async policy(): Promise<SubscriptionPolicy> {
    return policy; // ⛔ empty offeredFrequencies until D-07
  },

  async list(): Promise<readonly Subscription[]> {
    seedDemo();
    const a = requireSession();
    return a ? subsFor(a.customerId) : [];
  },

  async byId(id: SubscriptionId): Promise<Subscription | null> {
    seedDemo();
    const a = requireSession();
    if (!a) return null;
    return subsFor(a.customerId).find((s) => s.id === id) ?? null;
  },

  async pause(id) {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    return applySub(a.customerId, id, (s) => {
      const r = pauseFn(s, policy);
      return r.ok ? Ok(r.value) : Err({ kind: r.error.kind });
    });
  },

  async resume(id) {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    return applySub(a.customerId, id, (s) => {
      const r = resumeFn(s, policy);
      return r.ok ? Ok(r.value) : Err({ kind: r.error.kind });
    });
  },

  async skipNext(id) {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    // ⛔ Skipping shifts the next DELIVERY. The date itself is Unavailable
    //    (D-09), so this is a no-op on the (unknown) schedule but a valid
    //    intent we record by returning the subscription unchanged in state.
    return applySub(a.customerId, id, (s) =>
      s.status === 'active'
        ? Ok(s)
        : Err({ kind: 'not_permitted' })
    );
  },

  async cancel(id) {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    return applySub(a.customerId, id, (s) => {
      const r = cancelFn(s, policy);
      return r.ok ? Ok(r.value) : Err({ kind: r.error.kind });
    });
  },

  async reactivate(id) {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    const list = subsFor(a.customerId);
    const old = list.find((s) => s.id === id);
    if (!old) return Err({ kind: 'not_found' });
    // ⚠ A NEW subscription — history preserved, old one stays terminal.
    const fresh: Subscription = {
      ...old,
      id: toSubscriptionId(nextId('sub')),
      status: 'active',
      completedCycles: 0,
      createdAt: Date.now(),
    };
    subscriptions.set(a.customerId, [...list, fresh]);
    return Ok(fresh);
  },

  async changeFrequency(id, frequency: Frequency) {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    return applySub(a.customerId, id, (s) => {
      const r = changeFrequencyFn(s, policy, frequency);
      return r.ok ? Ok(r.value) : Err({ kind: r.error.kind });
    });
  },

  async changeFlavours(id, lines: readonly SubscriptionLine[]) {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    return applySub(a.customerId, id, (s) => {
      const r = changeFlavoursFn(s, policy, lines);
      return r.ok ? Ok(r.value) : Err({ kind: r.error.kind });
    });
  },

  async changeAddress(id, addressId: AddressId) {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    return applySub(a.customerId, id, (s) => {
      const r = changeAddressFn(s, policy, addressId);
      return r.ok ? Ok(r.value) : Err({ kind: r.error.kind });
    });
  },

  async changePaymentMethod(id, method: 'mpesa' | 'card') {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    return applySub(a.customerId, id, (s) => Ok({ ...s, paymentMethod: method }));
  },

  async resolveFailedPayment(id) {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    // ⛔ D-09 — state transition only, no charge triggered.
    return applySub(a.customerId, id, (s) => {
      const r = markRecovered(s);
      return r.ok ? Ok(r.value) : Err({ kind: r.error.kind });
    });
  },
});

/* ================================================================== *
 * Preferences & consent — append-only log
 * ================================================================== */

export const mockPreferences = (): PreferencesService => ({
  async channels(): Promise<ChannelPreferences> {
    seedDemo();
    const a = requireSession();
    return (a && channelPrefs.get(a.customerId)) || DEFAULT_CHANNEL_PREFERENCES;
  },

  async updateChannels(prefs): Promise<Result<ChannelPreferences, { kind: string }>> {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    channelPrefs.set(a.customerId, prefs);
    return Ok(prefs);
  },

  async cookies(): Promise<CookiePreferences> {
    const a = requireSession();
    return (a && cookiePrefs.get(a.customerId)) || DEFAULT_COOKIE_PREFERENCES;
  },

  async updateCookies(prefs): Promise<Result<CookiePreferences, { kind: string }>> {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    cookiePrefs.set(a.customerId, prefs);
    return Ok(prefs);
  },

  async recordConsent(topic: ConsentTopic, granted: boolean, source: string): Promise<Result<ConsentEvent, { kind: string }>> {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    // ⚠ APPEND. Never overwrite. The log is the legal record. [D-43]
    const event: ConsentEvent = {
      customerId: toCustomerId(a.customerId),
      topic,
      granted,
      at: Date.now(),
      source,
      policyVersion: 'pending-D-43',
    };
    const log = consentLog.get(a.customerId) ?? [];
    consentLog.set(a.customerId, [...log, event]);
    return Ok(event);
  },

  async consentHistory(): Promise<readonly ConsentEvent[]> {
    const a = requireSession();
    return (a && consentLog.get(a.customerId)) || [];
  },

  async requestData(kind: DataRequestKind): Promise<Result<DataRequest, { kind: string }>> {
    await latency();
    const a = requireSession();
    if (!a) return Err({ kind: 'unauthenticated' });
    const req: DataRequest = {
      kind,
      status: 'requested',
      requestedAt: Date.now(),
      note: null,
    };
    const list = dataRequests.get(a.customerId) ?? [];
    dataRequests.set(a.customerId, [...list, req]);
    return Ok(req);
  },

  async dataRequests(): Promise<readonly DataRequest[]> {
    const a = requireSession();
    return (a && dataRequests.get(a.customerId)) || [];
  },
});

/** Test/dev helper — wipes account state and re-seeds nothing. */
export const resetAccountState = (): void => {
  accounts.clear();
  failCounts.clear();
  currentEmail = null;
  addressBooks.clear();
  subscriptions.clear();
  channelPrefs.clear();
  cookiePrefs.clear();
  consentLog.clear();
  dataRequests.clear();
  resetTokens.clear();
  verifyTokens.clear();
  seq = 1;
};

/** Test helper — force a session without going through signIn. */
export const __signInAs = (email: string): void => {
  currentEmail = email;
};

/** Test helper — expose tokens the "email" would carry. */
export const __latestResetToken = (): string | null => {
  const keys = [...resetTokens.keys()];
  return keys.length ? keys[keys.length - 1] : null;
};
export const __latestVerifyToken = (): string | null => {
  const keys = [...verifyTokens.keys()];
  return keys.length ? keys[keys.length - 1] : null;
};
export const __seedDemoAccount = (): void => seedDemo();
