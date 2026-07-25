import type {
  Adapters,
  ProductRepository,
  ProductFilter,
  CollectionRepository,
  BundleRepository,
  InventoryService,
  CartRepository,
  Cart,
  CartLineInput,
  DeliveryService,
  DiscountRepository,
  OrderRepository,
  Order,
  CreateOrderInput,
  CheckoutService,
  NotificationService,
  AuthService,
  CustomerService,
  AddressService,
  SubscriptionService,
  PreferencesService,
  PaymentGateway,
} from '../../ports';
import type { Collection, Inventory, FlavourSlug } from '../../domain/catalogue';
import { availableStock, unavailable } from '../../domain/catalogue';
import {
  EMPTY_DELIVERY_CONFIG,
  linesSubtotal,
  quoteDelivery,
  type DeliveryConfig,
  type DeliveryZone,
} from '../../domain/delivery';
import {
  fromMajor,
  Ok,
  Err,
  type Result,
  cartId,
  zoneId,
  variantId,
  customerId as toCustomerId,
  paymentId,
  orderId,
  zero,
} from '../../domain/shared';
import type { CartLine } from '../../domain/pricing';
import { calculateTotals } from '../../domain/pricing';
import type { Checkout, RevalidationResult } from '../../domain/checkout';
import type {
  IdempotencyKey,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentError,
  PaymentStatusResponse,
  CancelPaymentRequest,
  CancelPaymentResponse,
  RefundRequest,
  RefundResponse,
  ReconcileRequest,
  ReconcileResult,
} from '../../domain/payment/contracts';
import type { Payment } from '../../domain/payment';
import type { Email, Session, ValidRegistration, AuthError } from '../../domain/identity/auth';
import type { CustomerProfile, ValidAddress } from '../../domain/identity/customer';
import { AppError, appError } from '../../lib/errors';
import { medusaFetch } from './medusa-client';
import { mapMedusaProduct, type MedusaStoreProduct } from './map-product';

/* eslint-disable @typescript-eslint/no-explicit-any */
const stub = (name: string): any =>
  new Proxy(
    {},
    {
      get: (_t, method: string) => () => {
        throw new AppError(
          'SERVER',
          'This part of the site is not connected yet.',
          new Error(`HttpAdapters.${name}.${String(method)} is not implemented for Medusa MVP.`)
        );
      },
    }
  );
/* eslint-enable @typescript-eslint/no-explicit-any */

const CUSTOMER_TOKEN_KEY = 'tabasamu_medusa_token';
const CART_ID_KEY = 'tabasamu_medusa_cart_id';
const SESSION_TTL_MS = 30 * 60 * 1000;

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CUSTOMER_TOKEN_KEY);
};

const setToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  else window.localStorage.removeItem(CUSTOMER_TOKEN_KEY);
};

const getStoredCartId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CART_ID_KEY);
};

const setStoredCartId = (id: string | null): void => {
  if (typeof window === 'undefined') return;
  if (id) window.localStorage.setItem(CART_ID_KEY, id);
  else window.localStorage.removeItem(CART_ID_KEY);
};

// Medusa Store fields: nested `*variants.calculated_price` / `*variants.prices`
// return 400 on this backend. Request images + variants; pricing uses region
// context elsewhere when available.
const PRODUCT_FIELDS = '+thumbnail,+images.url,+images.alt,+images.rank,*variants';

const productsRepo = (): ProductRepository => ({
  async list(filter?: ProductFilter) {
    const data = await medusaFetch<{ products: MedusaStoreProduct[] }>(
      `/store/products?limit=100&fields=${encodeURIComponent(PRODUCT_FIELDS)}`
    );
    let products = (data.products ?? []).map((p, i) => mapMedusaProduct(p, i + 1));
    if (filter?.status) products = products.filter((p) => p.status === filter.status);
    if (filter?.slugs?.length) {
      const set = new Set(filter.slugs);
      products = products.filter((p) => set.has(p.slug as FlavourSlug));
    }
    return products;
  },
  async bySlug(slug: string) {
    const data = await medusaFetch<{ products: MedusaStoreProduct[] }>(
      `/store/products?handle=${encodeURIComponent(slug)}&limit=1&fields=${encodeURIComponent(PRODUCT_FIELDS)}`
    );
    const raw = data.products?.[0];
    return raw ? mapMedusaProduct(raw, 1) : null;
  },
  async byId(id) {
    try {
      const data = await medusaFetch<{ product: MedusaStoreProduct }>(
        `/store/products/${id}?fields=${encodeURIComponent(PRODUCT_FIELDS)}`
      );
      return data.product ? mapMedusaProduct(data.product, 1) : null;
    } catch (e) {
      if (e instanceof AppError && e.code === 'NOT_FOUND') return null;
      throw e;
    }
  },
});

const collectionsRepo = (): CollectionRepository => ({
  async list() {
    const data = await medusaFetch<{ collections: Array<{ id: string; title: string; handle?: string }> }>(
      '/store/collections?limit=50'
    );
    return (data.collections ?? []).map(
      (c, i): Collection => ({
        id: c.id,
        slug: c.handle ?? c.id,
        title: c.title,
        description: unavailable('R-03', 'Collection copy is not supplied via Medusa yet.'),
        productIds: [],
        image: unavailable('R-03', 'No collection photograph exists.'),
        status: 'active',
        position: i + 1,
      })
    );
  },
  async bySlug(slug: string) {
    const all = await collectionsRepo().list();
    return all.find((c) => c.slug === slug) ?? null;
  },
});

const inventoryService = (): InventoryService => ({
  async check(vid) {
    const products = await productsRepo().list();
    for (const p of products) {
      const v = p.variants.find((x) => x.id === vid);
      if (!v) continue;
      const onHand = 10; // Store API may not expose raw on-hand; Medusa enforces at cart.
      const inv: Inventory = {
        variantId: v.id,
        onHand,
        reserved: 0,
        available: onHand,
        lowStockThreshold: unavailable('D-27', 'Threshold not supplied.'),
        policy: 'deny',
        nextBatch: null,
      };
      return { ...inv, available: availableStock(inv) };
    }
    return null;
  },
  async reserve() {
    return Err({ kind: 'not_found' });
  },
  async release() {
    /* no-op — Medusa owns reservations in cart */
  },
});

type MedusaCart = {
  id: string;
  currency_code?: string;
  items?: Array<{
    id: string;
    variant_id: string;
    quantity: number;
    unit_price?: number;
    title?: string;
    variant?: { sku?: string };
  }>;
  shipping_total?: number;
  subtotal?: number;
  total?: number;
  region_id?: string;
};

const mapCart = (c: MedusaCart): Cart => {
  const lines: CartLine[] = (c.items ?? []).map((item) => ({
    variantId: variantId(item.variant_id),
    quantity: item.quantity,
    unitPrice: fromMajor(item.unit_price ?? 0),
    bundleId: null,
  }));
  const deliveryQuote =
    c.shipping_total != null && c.shipping_total > 0
      ? {
          fee: fromMajor(c.shipping_total),
          leadTime: 'Demo lead time — commercial windows pending (D-23).',
        }
      : null;
  const totals = calculateTotals({
    lines,
    discount: null,
    deliveryQuote,
    freeDeliveryThreshold: null,
  });
  return {
    id: cartId(c.id),
    customerId: null,
    lines,
    discountCode: null,
    zoneId: c.region_id ? zoneId(c.region_id) : null,
    totals,
    updatedAt: new Date().toISOString(),
  };
};

const ensureCart = async (): Promise<MedusaCart> => {
  const existing = getStoredCartId();
  if (existing) {
    try {
      const data = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${existing}`);
      if (data.cart) return data.cart;
    } catch {
      setStoredCartId(null);
    }
  }
  const created = await medusaFetch<{ cart: MedusaCart }>('/store/carts', {
    method: 'POST',
    body: {},
  });
  setStoredCartId(created.cart.id);
  return created.cart;
};

const cartsRepo = (): CartRepository => ({
  async get(id) {
    try {
      const data = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${id}`);
      return data.cart ? mapCart(data.cart) : null;
    } catch {
      return null;
    }
  },
  async create() {
    const c = await ensureCart();
    return mapCart(c);
  },
  async addLine(_id, line: CartLineInput) {
    const c = await ensureCart();
    const data = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${c.id}/line-items`, {
      method: 'POST',
      body: { variant_id: String(line.variantId), quantity: line.quantity },
    });
    return mapCart(data.cart);
  },
  async updateLine(_id, vid, qty) {
    const c = await ensureCart();
    const item = c.items?.find((i) => i.variant_id === String(vid));
    if (!item) return mapCart(c);
    if (qty <= 0) {
      const data = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${c.id}/line-items/${item.id}`, {
        method: 'DELETE',
      });
      return mapCart(data.cart ?? c);
    }
    const data = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${c.id}/line-items/${item.id}`, {
      method: 'POST',
      body: { quantity: qty },
    });
    return mapCart(data.cart);
  },
  async removeLine(id, vid) {
    return cartsRepo().updateLine(id, vid, 0);
  },
  async applyDiscount() {
    return Err({ kind: 'not_found' });
  },
  async removeDiscount(id) {
    const c = await cartsRepo().get(id);
    if (!c) throw appError('NOT_FOUND');
    return c;
  },
  async setZone(id, zid) {
    const c = await ensureCart();
    try {
      const opts = await medusaFetch<{
        shipping_options: Array<{ id: string }>;
      }>(`/store/shipping-options?cart_id=${c.id}`);
      const option = opts.shipping_options?.[0];
      if (option) {
        const data = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${c.id}/shipping-methods`, {
          method: 'POST',
          body: { option_id: option.id },
        });
        return mapCart({ ...data.cart, region_id: String(zid) });
      }
    } catch {
      /* fall through */
    }
    const current = await cartsRepo().get(id);
    if (!current) throw appError('NOT_FOUND');
    return { ...current, zoneId: zid };
  },
});

const DEMO_ZONE: DeliveryZone = {
  id: zoneId('nairobi_demo'),
  name: 'Nairobi (MVP demo)',
  areas: ['Nairobi'],
  fee: fromMajor(200),
  leadTime: 'Demo lead time — commercial windows pending (D-23).',
  minimumOrder: null,
  active: true,
};

const deliveryService = (): DeliveryService => ({
  async config(): Promise<DeliveryConfig> {
    return {
      ...EMPTY_DELIVERY_CONFIG,
      zones: [DEMO_ZONE],
      deliversOutsideNairobi: false,
    };
  },
  async zones() {
    const cfg = await deliveryService().config();
    return cfg.zones;
  },
  async quote(zid, lines) {
    const cfg = await deliveryService().config();
    return quoteDelivery(cfg, zid, lines, linesSubtotal(lines));
  },
});

const sessionFromCustomer = (customer: {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}): Session => ({
  customerId: customer.id,
  email: customer.email as Email,
  displayName: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email,
  emailVerified: true,
  expiresAt: Date.now() + SESSION_TTL_MS,
});

const authService = (): AuthService => ({
  async register(input: ValidRegistration) {
    try {
      await medusaFetch('/store/customers', {
        method: 'POST',
        body: {
          email: input.email,
          password: input.password,
          first_name: input.fullName.split(' ')[0] ?? input.fullName,
          last_name: input.fullName.split(' ').slice(1).join(' ') || undefined,
        },
      });
      return authService().signIn(input.email, input.password);
    } catch {
      return Err({ kind: 'invalid_credentials' } as AuthError);
    }
  },
  async signIn(email: Email, password: string) {
    try {
      const auth = await medusaFetch<{ token?: string }>('/auth/customer/emailpass', {
        method: 'POST',
        body: { email, password },
      });
      if (auth.token) setToken(auth.token);
      const me = await medusaFetch<{
        customer: { id: string; email: string; first_name?: string; last_name?: string };
      }>('/store/customers/me', { token: auth.token });
      return Ok(sessionFromCustomer(me.customer));
    } catch {
      return Err({ kind: 'invalid_credentials' });
    }
  },
  async signOut() {
    setToken(null);
  },
  async currentSession() {
    const token = getToken();
    if (!token) return null;
    try {
      const me = await medusaFetch<{
        customer: { id: string; email: string; first_name?: string; last_name?: string };
      }>('/store/customers/me', { token });
      return sessionFromCustomer(me.customer);
    } catch {
      setToken(null);
      return null;
    }
  },
  async refresh() {
    const s = await authService().currentSession();
    return s ? Ok(s) : Err({ kind: 'invalid_credentials' });
  },
  async requestPasswordReset() {
    return { kind: 'sent' as const };
  },
  async completePasswordReset() {
    return { kind: 'ok' as const };
  },
  async verifyEmail() {
    return Ok(true as const);
  },
  async resendVerification() {
    return Ok(true as const);
  },
});

const customerService = (): CustomerService => ({
  async profile() {
    const token = getToken();
    if (!token) return null;
    const me = await medusaFetch<{
      customer: { id: string; email: string; first_name?: string; last_name?: string; phone?: string };
    }>('/store/customers/me', { token });
    const c = me.customer;
    const profile: CustomerProfile = {
      id: toCustomerId(c.id),
      email: c.email as Email,
      fullName: [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email,
      phone: (c.phone ?? '254700000000') as CustomerProfile['phone'],
      emailVerified: true,
      createdAt: Date.now(),
    };
    return profile;
  },
  async updateProfile(update) {
    const token = getToken();
    if (!token) return Err({ kind: 'unauthorised' });
    await medusaFetch('/store/customers/me', {
      method: 'POST',
      token,
      body: {
        first_name: update.fullName?.split(' ')[0],
        last_name: update.fullName?.split(' ').slice(1).join(' '),
        phone: update.phone,
      },
    });
    const p = await customerService().profile();
    return p ? Ok(p) : Err({ kind: 'not_found' });
  },
});

const addressesService = (): AddressService => ({
  async list() {
    return [];
  },
  async add(_address: ValidAddress) {
    return Err({ kind: 'not_implemented' });
  },
  async update() {
    return Err({ kind: 'not_implemented' });
  },
  async remove() {
    return Err({ kind: 'not_implemented' });
  },
  async setDefault() {
    return Err({ kind: 'not_implemented' });
  },
});

const ordersRepo = (): OrderRepository => ({
  async create(_input: CreateOrderInput) {
    throw new AppError('SERVER', 'Create orders via checkout.complete on Medusa.');
  },
  async byId(id) {
    const token = getToken();
    if (!token) return null;
    try {
      const data = await medusaFetch<{ order: Record<string, unknown> }>(`/store/orders/${id}`, { token });
      return data.order as unknown as Order;
    } catch {
      return null;
    }
  },
  async listForCustomer() {
    const token = getToken();
    if (!token) return [];
    const data = await medusaFetch<{ orders: Order[] }>('/store/orders', { token });
    return data.orders ?? [];
  },
  async findByPhoneOrReference() {
    return [];
  },
});

const nowIso = (): string => new Date().toISOString();

const paymentsGateway = (): PaymentGateway => ({
  async initiate(req: InitiatePaymentRequest): Promise<Result<InitiatePaymentResponse, PaymentError>> {
    // Manual / system provider — acknowledge only (not live M-PESA).
    return Ok({
      paymentId: paymentId(`pay_manual_${String(req.orderId)}`),
      providerRef: `manual_${req.idempotencyKey}`,
      status: 'initiated',
      card: null,
      replayed: false,
      createdAt: nowIso(),
    });
  },
  async status(providerRef: string): Promise<Result<PaymentStatusResponse, PaymentError>> {
    return Ok({
      paymentId: paymentId(`pay_manual_${providerRef}`),
      orderId: orderId('ord_pending'),
      status: 'pending',
      transactionRef: null,
      failureReason: null,
      callbackReceived: false,
      updatedAt: nowIso(),
    });
  },
  async cancel(req: CancelPaymentRequest): Promise<Result<CancelPaymentResponse, PaymentError>> {
    return Ok({
      paymentId: req.paymentId,
      supported: false,
      status: 'failed',
    });
  },
  async refund(req: RefundRequest): Promise<Result<RefundResponse, PaymentError>> {
    return Ok({
      refundId: `ref_manual_${Date.now()}`,
      paymentId: req.paymentId,
      amount: req.amount ?? zero(),
      status: 'pending_manual',
      requiresManualAction: true,
      providerRef: null,
      createdAt: nowIso(),
    });
  },
  async reconcile(req: ReconcileRequest): Promise<Result<ReconcileResult, PaymentError>> {
    return Ok({
      paymentId: req.paymentId,
      status: 'unknown',
      transactionRef: null,
      method: 'manual_till_check',
      resolvedAt: null,
    });
  },
  async byId(): Promise<Payment | null> {
    return null;
  },
  async webhookHistory() {
    return [];
  },
});

const checkoutService = (): CheckoutService => ({
  async revalidate(_cartId): Promise<RevalidationResult> {
    return { changes: [], lines: [], requiresAcknowledgement: false };
  },
  async createOrder(_cartId, _checkout: Checkout, _key: IdempotencyKey) {
    try {
      const c = await ensureCart();
      const completed = await medusaFetch<{
        type?: string;
        order?: { id: string };
      }>(`/store/carts/${c.id}/complete`, { method: 'POST' });
      setStoredCartId(null);
      if (completed.order) {
        return Ok(completed.order as unknown as Order);
      }
      return Err({ kind: 'order_not_payable', status: 'incomplete' });
    } catch {
      return Err({ kind: 'network' });
    }
  },
});

export const createHttpAdapters = (): Adapters => ({
  products: productsRepo(),
  collections: collectionsRepo(),
  bundles: stub('bundles') as BundleRepository,
  inventory: inventoryService(),
  carts: cartsRepo(),
  delivery: deliveryService(),
  discounts: stub('discounts') as DiscountRepository,
  orders: ordersRepo(),
  payments: paymentsGateway(),
  checkout: checkoutService(),
  notifications: stub('notifications') as NotificationService,
  auth: authService(),
  customer: customerService(),
  addresses: addressesService(),
  subscriptions: stub('subscriptions') as SubscriptionService,
  preferences: stub('preferences') as PreferencesService,
});
