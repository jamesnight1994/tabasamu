/**
 * PORTS — THE BACKEND HANDOVER CONTRACT
 *
 * This directory IS the contract with the backend developer.
 *
 * RULES:
 *  1. Every port is a typed interface. No implementation lives here.
 *  2. NO COMPONENT MAY IMPORT AN ADAPTER. Components depend on these
 *     interfaces; adapters are injected at the composition root.
 *     Enforced by `eslint-plugin-boundaries`. A violation FAILS THE BUILD. [R-13]
 *  3. Ports are provider-agnostic by design. `PaymentGateway` says nothing
 *     about Stripe, because Stripe may not be viable at all (⛔ D-35).
 *
 * ACCEPTANCE TEST FOR THE HANDOVER (Gate G2):
 *   The full user-flow test suite runs GREEN against BOTH `MockAdapters`
 *   and `HttpAdapters`, with ZERO changes above the adapter layer.
 *   If it passes, the handover is clean. If it fails, backend logic has
 *   leaked upward — and it is caught here, not in production.
 */

import type {
  ProductId,
  VariantId,
  CartId,
  OrderId,
  CustomerId,
  AddressId,
  SubscriptionId,
  ZoneId,
  PaymentId,
  Money,
  Result,
  ISODateTime,
} from '../domain/shared';
import type {
  Email,
  Session,
  ValidRegistration,
  AuthError,
  RequestResetResult,
  CompleteResetResult,
  ResetToken,
} from '../domain/identity/auth';
import type {
  CustomerProfile,
  SavedAddress,
  ValidAddress,
} from '../domain/identity/customer';
import type {
  Subscription,
  SubscriptionPolicy,
  SubscriptionLine,
  Frequency,
} from '../domain/subscription';
import type {
  ChannelPreferences,
  CookiePreferences,
  ConsentEvent,
  ConsentTopic,
  DataRequest,
  DataRequestKind,
} from '../domain/preferences';
import type {
  Product,
  Inventory,
  FlavourSlug,
  Collection,
  Bundle,
} from '../domain/catalogue';
import type {
  CartLine,
  Totals,
  Discount,
  DiscountError,
} from '../domain/pricing';
import type { Payment, WebhookEvent } from '../domain/payment';
import type {
  IdempotencyKey,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentStatusResponse,
  PaymentError,
  CancelPaymentRequest,
  CancelPaymentResponse,
  RefundRequest,
  RefundResponse,
  ReconcileRequest,
  ReconcileResult,
  WebhookVerification,
  WebhookProcessResult,
} from '../domain/payment/contracts';
import type {
  DeliveryZone,
  DeliveryConfig,
  DeliveryError,
  DeliveryQuote as ZoneQuote,
} from '../domain/delivery';
import type { Checkout, RevalidationResult } from '../domain/checkout';
import type { OrderStatus } from '../domain/order';
import type { E164Phone } from '../domain/identity/phone';

/* ================================================================== *
 * CATALOGUE
 * ================================================================== */

export interface ProductFilter {
  readonly status?: 'active' | 'draft' | 'archived';
  readonly slugs?: readonly FlavourSlug[];
}

export interface ProductRepository {
  list(filter?: ProductFilter): Promise<readonly Product[]>;
  bySlug(slug: string): Promise<Product | null>;
  byId(id: ProductId): Promise<Product | null>;
}

/* ================================================================== *
 * CATALOGUE — Phase 4
 *
 * ⚠ Search, filter and sort are DOMAIN functions (`domain/catalogue/query`),
 *   deliberately. Today they run in memory over six products. Tomorrow the
 *   backend runs them in SQL over six hundred.
 *
 *   Because the QUERY is a typed value rather than logic buried in a component,
 *   that migration is an adapter swap: the HTTP adapter forwards the same
 *   `CatalogueQuery` to the API and returns the same `CatalogueResult`. The UI
 *   does not change. [R-13]
 * ================================================================== */

export interface CollectionRepository {
  list(): Promise<readonly Collection[]>;
  bySlug(slug: string): Promise<Collection | null>;
}

export interface BundleRepository {
  list(): Promise<readonly Bundle[]>;
  bySlug(slug: string): Promise<Bundle | null>;
}

/* ================================================================== *
 * INVENTORY
 * ================================================================== */

export type StockError =
  | { kind: 'insufficient'; available: number }
  | { kind: 'not_found' }
  | { kind: 'inactive' };

export interface Reservation {
  readonly id: string;
  readonly variantId: VariantId;
  readonly quantity: number;
  readonly expiresAt: ISODateTime;
}

export interface InventoryService {
  check(variantId: VariantId): Promise<Inventory | null>;
  reserve(variantId: VariantId, qty: number): Promise<Result<Reservation, StockError>>;
  release(reservationId: string): Promise<void>;
}

/* ================================================================== *
 * CART
 * ================================================================== */

export interface Cart {
  readonly id: CartId;
  readonly customerId: CustomerId | null;
  readonly lines: readonly CartLine[];
  readonly discountCode: string | null;
  /** Set as early as the PDP, not deferred to checkout. [P-03] */
  readonly zoneId: ZoneId | null;
  readonly totals: Totals;
  readonly updatedAt: ISODateTime;
}

export interface CartLineInput {
  readonly variantId: VariantId;
  readonly quantity: number;
}

export interface CartRepository {
  get(id: CartId): Promise<Cart | null>;
  create(customerId: CustomerId | null): Promise<Cart>;
  addLine(id: CartId, line: CartLineInput): Promise<Cart>;
  updateLine(id: CartId, variantId: VariantId, qty: number): Promise<Cart>;
  removeLine(id: CartId, variantId: VariantId): Promise<Cart>;
  applyDiscount(id: CartId, code: string): Promise<Result<Cart, DiscountError>>;
  removeDiscount(id: CartId): Promise<Cart>;
  setZone(id: CartId, zoneId: ZoneId): Promise<Cart>;
}

/* ================================================================== *
 * DELIVERY
 * ⛔ D-21 / D-22 / D-23 — zones, fees and lead times NOT supplied.
 * ================================================================== */

/**
 * ⚠ `DeliveryZone` now lives in `domain/delivery`, alongside the RULE ENGINE
 *   that consumes it. Zones, fees and lead times arrive as CONFIGURATION —
 *   see `DeliveryConfig`. Not one Nairobi zone is hard-coded. [⛔ D-21/22/23]
 */
export type { DeliveryZone, DeliveryConfig, DeliveryQuote as ZoneQuote } from '../domain/delivery';

export interface DeliveryService {
  /**
   * ⚠ The WHOLE config, not just the zones. The free-delivery threshold, the
   *   pickup location and the scheduled-delivery switch are all business rules
   *   the backend owns — the UI must never assume them. [⛔ D-24/25/26]
   */
  config(): Promise<DeliveryConfig>;
  zones(): Promise<readonly DeliveryZone[]>;
  /**
   * ⚠ Called from the PDP, NOT just the cart.
   *   P-03: the fee must be knowable BEFORE the cart. This is the mitigation
   *   for R-08 — the biggest first-time-buyer frustration in this market.
   */
  quote(
    zoneId: ZoneId,
    lines: readonly CartLine[]
  ): Promise<Result<ZoneQuote, DeliveryError>>;
}

/* ================================================================== *
 * DISCOUNTS
 * ================================================================== */

export interface DiscountRepository {
  byCode(code: string): Promise<Discount | null>;
}

/* ================================================================== *
 * ORDERS
 * ================================================================== */

/**
 * ⚠ MOVED. `OrderStatus` and its TRANSITION TABLE now live in `domain/order`.
 *
 *   Phase 4's nine-state union had no `payment_expired`, no `ready_for_dispatch`,
 *   no `refund_pending`, no `partially_refunded` — and, most importantly, no
 *   `manual_reconciliation`. It was also an unguarded union: any status could be
 *   assigned to any order, so a duplicate M-PESA callback could drive
 *   `delivered → paid` without complaint.
 *
 *   It is re-exported here so existing imports keep working. [Phase 5]
 */
export type { OrderStatus } from '../domain/order';

export interface Address {
  readonly id: string;
  /** Separate from the customer's own name — required by the gift journey. */
  readonly recipientName: string;
  /** ⚠ The rider will call this number. */
  readonly phone: E164Phone;
  readonly zoneId: ZoneId;
  /**
   * ⚠ Nairobi addressing is ESTATE/BUILDING/LANDMARK-based, not
   *   street-number-based. A Western line1/line2/postcode form is the
   *   WRONG SHAPE for this market. This model is deliberately different.
   */
  readonly estate: string;
  readonly building: string;
  readonly landmark: string;
  readonly instructions: string;
  readonly isDefault: boolean;
}

export interface OrderLine {
  readonly variantId: VariantId;
  readonly quantity: number;
  readonly unitPrice: Money;
  /** ⚠ SNAPSHOTTED. Does NOT join live to Variant — a later price change
   *    must not retroactively rewrite historical orders. */
  readonly productName: string;
  readonly sku: string;
}

export interface Order {
  readonly id: OrderId;
  /** Human-readable. Rendered in JetBrains Mono. */
  readonly number: string;
  readonly customerId: CustomerId | null;
  readonly lines: readonly OrderLine[];
  readonly totals: Totals;
  readonly deliveryAddress: Address;
  readonly billingAddress: Address;
  readonly status: OrderStatus;
  /** ⚠ 1..* — a retried M-PESA push creates a SECOND Payment, not a mutation. */
  readonly payments: readonly Payment[];
  readonly isGift: boolean;
  /** ⚠ The packing slip for a gift order carries NO pricing. */
  readonly giftNote: string | null;
  /** ⚠ The primary support key. The customer quotes this, not an order number. */
  readonly mpesaReference: string | null;
  readonly createdAt: ISODateTime;
}

export interface CreateOrderInput {
  readonly cartId: CartId;
  readonly customerId: CustomerId | null;
  readonly deliveryAddress: Omit<Address, 'id'>;
  readonly billingAddress: Omit<Address, 'id'>;
  readonly isGift: boolean;
  readonly giftNote: string | null;
}

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  byId(id: OrderId): Promise<Order | null>;
  listForCustomer(id: CustomerId): Promise<readonly Order[]>;
  /**
   * ⚠ THE SUPPORT LOOKUP. The customer will quote the M-PESA code, not an
   *   order number. Lookup must work by phone AND by M-PESA reference. [R-21, F-88]
   */
  findByPhoneOrReference(query: string): Promise<readonly Order[]>;
}

/* ================================================================== *
 * PAYMENTS
 * ⚠ Deliberately provider-agnostic. See D-35 / R-05 — the card rail may
 *   not be Stripe. This abstraction is what makes that swap survivable.
 * ================================================================== */

export interface PaymentGateway {
  /**
   * ⚠ RETURNS AN ACKNOWLEDGEMENT, NOT A RESULT.
   *   `InitiatePaymentResponse.status` is narrowed to `'initiated' | 'pending'`
   *   at the type level — it CANNOT report success. An STK push returns HTTP 200
   *   the moment Safaricom ACCEPTS it, long before the customer types a PIN.
   *   Treating that as payment is the classic Daraja bug, and the type makes it
   *   unrepresentable. [R-10, F-58]
   */
  initiate(
    req: InitiatePaymentRequest
  ): Promise<Result<InitiatePaymentResponse, PaymentError>>;

  /**
   * ⚠ SERVER-AUTHORITATIVE. Keyed by `providerRef` (the M-PESA
   *   `CheckoutRequestID`). This is what makes the pending state survive a page
   *   reload AND a connection drop. The client NEVER decides the outcome of a
   *   payment for itself. This is the POLLING FALLBACK for a late callback.
   */
  status(providerRef: string): Promise<Result<PaymentStatusResponse, PaymentError>>;

  /**
   * ⚠ For M-PESA this means "stop waiting", NOT "reach into Safaricom and undo
   *   it" — an STK push cannot be recalled once sent. `supported: false` is the
   *   honest answer, and the UI must say so rather than implying we cancelled it.
   */
  cancel(req: CancelPaymentRequest): Promise<Result<CancelPaymentResponse, PaymentError>>;

  /**
   * ⛔ D-36 / D-37. An M-PESA refund is a MANUAL B2C reversal, not an API call.
   *   `RefundResponse.requiresManualAction` is TRUE for M-PESA, and the admin UI
   *   must never present it as one-click. It is a task with a state.
   */
  refund(req: RefundRequest): Promise<Result<RefundResponse, PaymentError>>;

  /**
   * ⚠ THE MECHANISM THAT RESOLVES `unknown`.
   *   Some callbacks never arrive; the money may have left the account anyway.
   *   Without this, we quietly keep the money of every customer whose callback
   *   was lost. [R-10, F-60]
   */
  reconcile(req: ReconcileRequest): Promise<Result<ReconcileResult, PaymentError>>;

  byId(id: PaymentId): Promise<Payment | null>;

  /** Read-only. Append-only log. For customer care. */
  webhookHistory(paymentId: PaymentId): Promise<readonly WebhookEvent[]>;
}

/* ================================================================== *
 * WEBHOOKS — ⚠ BACKEND-ONLY. Listed here as the CONTRACT the backend owes.
 *
 * The frontend cannot implement any of this and must never try. It is stated
 * in the port so the obligation is explicit at handover rather than assumed.
 * ================================================================== */

export interface WebhookHandler {
  /** ⚠ Signature verified FIRST. An invalid signature is DISCARDED, not processed. */
  verify(rawBody: string, headers: Readonly<Record<string, string>>): WebhookVerification;
  /** ⚠ MUST be idempotent. M-PESA WILL deliver the same callback twice. */
  process(verification: WebhookVerification, rawBody: string): Promise<WebhookProcessResult>;
}

/* ================================================================== *
 * CHECKOUT
 * ================================================================== */

export interface CheckoutService {
  /**
   * ⚠ CALLED BEFORE EVERY PAYMENT, WITHOUT EXCEPTION.
   *   A cart restored from storage carries SNAPSHOTTED prices that may be days
   *   old. Charging the old price is a loss; charging the new one silently is a
   *   betrayal. We revalidate, and we show the customer what moved. [F-53]
   */
  revalidate(cartId: CartId): Promise<RevalidationResult>;

  /**
   * Creates the order in `draft` and reserves stock.
   * ⚠ Guarded by `idempotencyKey` — a double-tap must not create two orders.
   */
  createOrder(
    cartId: CartId,
    checkout: Checkout,
    idempotencyKey: IdempotencyKey
  ): Promise<Result<Order, PaymentError>>;
}

/* ================================================================== *
 * SUBSCRIPTIONS
 * ⛔ HARD-BLOCKED on D-09.
 *
 * M-PESA has NO card-on-file equivalent. A subscriber cannot be silently
 * charged each cycle. The four candidate billing models produce MATERIALLY
 * DIFFERENT data models and interfaces:
 *   (a) re-prompt with an STK push each cycle
 *   (b) M-PESA standing order / Ratiba
 *   (c) card-only  — but see D-35, the card rail may not exist
 *   (d) pre-paid block (buy 3 months up front)
 *
 * NO SUBSCRIPTION CODE WILL BE WRITTEN UNTIL THE CLIENT CHOOSES. [R-06]
 * ================================================================== */

/* ================================================================== *
 * PHASE 6 — AUTH, CUSTOMER, ADDRESS, SUBSCRIPTION, PREFERENCES
 *
 * ⚠ ALL PROVIDER-NEUTRAL. These interfaces name no auth vendor, no session
 *   mechanism, no billing model. The mock implements them in-memory; the real
 *   backend implements them against whatever the client chooses (D-53/54/55 for
 *   auth; D-09 for subscription billing). The UI depends only on these shapes.
 * ================================================================== */

/**
 * ⚠ THE FRONTEND NEVER RECEIVES A TOKEN FROM THESE METHODS.
 *   `signIn`/`register` establish a session server-side (httpOnly cookie) and
 *   return only a Session DESCRIPTOR. The token the browser can read is the
 *   token an XSS can steal, so there isn't one. [D-55]
 */
export interface AuthService {
  register(input: ValidRegistration): Promise<Result<Session, AuthError>>;
  signIn(email: Email, password: string): Promise<Result<Session, AuthError>>;
  signOut(): Promise<void>;
  /** Reads the current session from the cookie, or null. Used on load + route guards. */
  currentSession(): Promise<Session | null>;
  /** Refreshes / extends the session if the mechanism supports it. */
  refresh(): Promise<Result<Session, AuthError>>;

  /** ⚠ Always resolves 'sent' for any valid email — no account enumeration. */
  requestPasswordReset(email: Email): Promise<RequestResetResult>;
  completePasswordReset(token: ResetToken, newPassword: string): Promise<CompleteResetResult>;

  /** Email verification. `verify` consumes a token; `resend` re-sends the link. */
  verifyEmail(token: string): Promise<Result<true, { kind: string }>>;
  resendVerification(email: Email): Promise<Result<true, AuthError>>;
}

export interface CustomerService {
  profile(): Promise<CustomerProfile | null>;
  updateProfile(update: { fullName?: string; phone?: string }): Promise<Result<CustomerProfile, { kind: string }>>;
}

export interface AddressService {
  list(): Promise<readonly SavedAddress[]>;
  add(address: ValidAddress): Promise<Result<SavedAddress, { kind: string }>>;
  update(id: AddressId, fields: ValidAddress): Promise<Result<SavedAddress, { kind: string }>>;
  remove(id: AddressId): Promise<Result<true, { kind: string }>>;
  setDefault(id: AddressId): Promise<Result<true, { kind: string }>>;
}

/**
 * ⚠ MANAGEMENT ONLY. NO BILLING. [D-09]
 *   Every method here mutates subscription STATE. None of them moves money.
 *   `policy()` returns the configurable policy (⛔ empty frequencies until D-07).
 *   Failed-payment RECOVERY is `resolveFailedPayment`, which performs the state
 *   transition the backend confirms — it does not itself charge anything,
 *   because the charging model is undecided.
 */
export interface SubscriptionService {
  policy(): Promise<SubscriptionPolicy>;
  list(): Promise<readonly Subscription[]>;
  byId(id: SubscriptionId): Promise<Subscription | null>;

  pause(id: SubscriptionId): Promise<Result<Subscription, { kind: string }>>;
  resume(id: SubscriptionId): Promise<Result<Subscription, { kind: string }>>;
  skipNext(id: SubscriptionId): Promise<Result<Subscription, { kind: string }>>;
  cancel(id: SubscriptionId): Promise<Result<Subscription, { kind: string }>>;
  /** ⚠ Creates a NEW subscription; does not resurrect a terminal one. */
  reactivate(id: SubscriptionId): Promise<Result<Subscription, { kind: string }>>;

  changeFrequency(id: SubscriptionId, frequency: Frequency): Promise<Result<Subscription, { kind: string }>>;
  changeFlavours(id: SubscriptionId, lines: readonly SubscriptionLine[]): Promise<Result<Subscription, { kind: string }>>;
  changeAddress(id: SubscriptionId, addressId: AddressId): Promise<Result<Subscription, { kind: string }>>;
  changePaymentMethod(id: SubscriptionId, method: 'mpesa' | 'card'): Promise<Result<Subscription, { kind: string }>>;

  /** ⛔ D-09 — performs the confirmed state transition only; triggers no charge. */
  resolveFailedPayment(id: SubscriptionId): Promise<Result<Subscription, { kind: string }>>;
}

export interface PreferencesService {
  channels(): Promise<ChannelPreferences>;
  updateChannels(prefs: ChannelPreferences): Promise<Result<ChannelPreferences, { kind: string }>>;

  cookies(): Promise<CookiePreferences>;
  updateCookies(prefs: CookiePreferences): Promise<Result<CookiePreferences, { kind: string }>>;

  /** ⚠ Append-only. Recording a consent NEVER overwrites; it adds an event. [D-43] */
  recordConsent(topic: ConsentTopic, granted: boolean, source: string): Promise<Result<ConsentEvent, { kind: string }>>;
  consentHistory(): Promise<readonly ConsentEvent[]>;

  /** ⚠ A REQUEST, not an action. Deletion is not instant/unconditional. [D-43] */
  requestData(kind: DataRequestKind): Promise<Result<DataRequest, { kind: string }>>;
  dataRequests(): Promise<readonly DataRequest[]>;
}

/* ================================================================== *
 * NOTIFICATIONS
 * ⛔ D-40 (email provider), D-41 (SMS provider), D-42 (WhatsApp's role).
 *
 * ⚠ In Kenya, SMS is the EXPECTED order-confirmation channel — more than
 *   email. The port is channel-agnostic so the choice is an adapter, not
 *   a rewrite.
 * ================================================================== */

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export interface NotificationMessage {
  readonly channel: NotificationChannel;
  readonly to: string;
  readonly template: string;
  readonly data: Readonly<Record<string, string | number>>;
}

export interface NotificationService {
  send(message: NotificationMessage): Promise<Result<{ id: string }, { kind: string }>>;
}

/* ================================================================== *
 * THE COMPOSITION ROOT
 * Every adapter set must satisfy this. The G2 acceptance test swaps one
 * implementation of this interface for another and expects zero changes
 * above the adapter layer.
 * ================================================================== */

export interface Adapters {
  readonly products: ProductRepository;
  /** Phase 4 — curated product groups. */
  readonly collections: CollectionRepository;
  /** Phase 4 — preset + build-your-own boxes. */
  readonly bundles: BundleRepository;
  readonly inventory: InventoryService;
  readonly carts: CartRepository;
  readonly delivery: DeliveryService;
  readonly discounts: DiscountRepository;
  readonly orders: OrderRepository;
  readonly payments: PaymentGateway;
  /** Phase 5 — revalidation + order creation. */
  readonly checkout: CheckoutService;
  readonly notifications: NotificationService;
  /** Phase 6 — customer self-service. */
  readonly auth: AuthService;
  readonly customer: CustomerService;
  readonly addresses: AddressService;
  readonly subscriptions: SubscriptionService;
  readonly preferences: PreferencesService;
}
