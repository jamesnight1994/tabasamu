/**
 * MOCK ADAPTERS
 *
 * These implement the ports in `src/ports`. They exist so the storefront can
 * be built, tested and demonstrated before a backend exists.
 *
 * ⚠ THEY ARE NOT A BACKEND. They are deliberately imperfect in the ways a
 *   real network is imperfect — they add latency, and the payment gateway
 *   simulates all THREE M-PESA outcomes including `unknown`. A mock that
 *   always succeeds instantly would let us ship a UI that collapses the
 *   moment it meets a real Nairobi connection. [R-10, R-14]
 *
 * ⚠ NOTHING HERE IS "OPERATIONAL". No integration is connected. [NN-04]
 */

import type {
  Adapters,
  ProductRepository,
  ProductFilter,
  InventoryService,
  Reservation,
  StockError,
  CartRepository,
  Cart,
  CartLineInput,
  DeliveryService,
  DeliveryZone,
  DiscountRepository,
  OrderRepository,
  Order,
  CreateOrderInput,
  NotificationService,
  CollectionRepository,
  BundleRepository,
} from '../../ports';

import {
  type Product,
  type Inventory,
  availableStock,
  isUnavailable,
} from '../../domain/catalogue';

import {
  type CartLine,
  type Discount,
  type DiscountError,
  calculateTotals,
  validateDiscount,
  addLine as addLineFn,
  updateLineQuantity,
  removeLine as removeLineFn,
} from '../../domain/pricing';

import type { CheckoutService } from '../../ports';
import {
  type DeliveryConfig,
  type DeliveryError,
  type DeliveryQuote as ZoneQuote,
  quoteDelivery,
  linesSubtotal,
  EMPTY_DELIVERY_CONFIG,
} from '../../domain/delivery';
import {
  type Checkout,
  type CartChange,
  type RevalidationResult,
  summariseRevalidation,
} from '../../domain/checkout';
import type { IdempotencyKey, PaymentError } from '../../domain/payment/contracts';
import {
  mockAuth,
  mockCustomer,
  mockAddresses,
  mockSubscriptions,
  mockPreferences,
  resetAccountState,
} from './accounts';
import { createMockPaymentGateway, type SimulatedOutcome } from './payments';

import {
  type ProductId,
  type VariantId,
  type CartId,
  type OrderId,
  type CustomerId,
  type ZoneId,
  type Result,
  Ok,
  Err,
  cartId as toCartId,
  orderId as toOrderId,
  customerId as toCustomerId,
  fromMajor,
} from '../../domain/shared';

import {
  MOCK_PRODUCTS,
  MOCK_INVENTORY,
  MOCK_DISCOUNTS,
  MOCK_BUNDLES,
  MOCK_COLLECTIONS,
} from './fixtures';
import { logger } from '../../lib/logger';

/* ------------------------------------------------------------------ *
 * Network simulation
 *
 * Nairobi mobile latency is not 0ms. Building against an instant mock
 * produces a UI with no loading states, which then feels broken on 3G. [P-10]
 * ------------------------------------------------------------------ */

export interface MockOptions {
  /** Simulated round-trip, ms. Set to 0 in unit tests. */
  latencyMs?: number;
  /** 0..1 — probability any call fails with a network error. */
  failureRate?: number;
  /**
   * ⚠ Forces one of the SEVEN real M-PESA outcomes — including the two that
   *   ruin naive integrations: `timeout_no_callback` and `success_late`.
   */
  forcePaymentOutcome?: SimulatedOutcome | null;
  /** Speed up the simulated PIN-entry delay in tests. */
  pinDelayMs?: number;
  /**
   * ⛔ D-21/22/23 — DEFAULTS TO ZERO ZONES.
   *   Supplying a config here is an explicit, deliberate act, used by tests and
   *   local development. Nothing invents a Nairobi zone by default. [NN-05]
   */
  deliveryConfig?: DeliveryConfig;
  /** ⛔ D-35 — the card rail is off until Stripe's KES settlement is confirmed. */
  cardEnabled?: boolean;
}

const DEFAULTS: Required<MockOptions> = {
  latencyMs: 220,
  failureRate: 0,
  forcePaymentOutcome: null,
  pinDelayMs: 4_000,
  deliveryConfig: EMPTY_DELIVERY_CONFIG, // ⛔ zero zones. Deliberate.
  cardEnabled: false, // ⛔ D-35
};

let opts: Required<MockOptions> = { ...DEFAULTS };

export const configureMocks = (o: MockOptions): void => {
  opts = { ...DEFAULTS, ...o };
};

const delay = async (): Promise<void> => {
  if (opts.latencyMs <= 0) return;
  const jitter = opts.latencyMs * (0.7 + Math.random() * 0.6);
  await new Promise((r) => setTimeout(r, jitter));
  if (opts.failureRate > 0 && Math.random() < opts.failureRate) {
    throw new TypeError('Simulated network failure (mock adapter)');
  }
};

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/* ------------------------------------------------------------------ *
 * Products
 * ------------------------------------------------------------------ */

export const mockProducts = (): ProductRepository => ({
  async list(filter?: ProductFilter): Promise<readonly Product[]> {
    await delay();
    let out = [...MOCK_PRODUCTS];
    // ⚠ Default: ACTIVE only. Gooseberry is `draft` (no photograph exists,
    //   A-07) and must not appear on the storefront.
    const status = filter?.status ?? 'active';
    out = out.filter((p) => p.status === status);
    if (filter?.slugs) out = out.filter((p) => filter.slugs!.includes(p.slug));
    return clone(out);
  },
  async bySlug(slug: string): Promise<Product | null> {
    await delay();
    return clone(MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null);
  },
  async byId(id: ProductId): Promise<Product | null> {
    await delay();
    return clone(MOCK_PRODUCTS.find((p) => p.id === id) ?? null);
  },
});

/* ------------------------------------------------------------------ *
 * Inventory
 * ------------------------------------------------------------------ */

const inventoryState = new Map<string, Inventory>(
  MOCK_INVENTORY.map((i) => [i.variantId as string, { ...i }])
);
const reservations = new Map<string, Reservation>();

export const mockInventory = (): InventoryService => ({
  async check(variantId: VariantId): Promise<Inventory | null> {
    await delay();
    const inv = inventoryState.get(variantId as string);
    if (!inv) return null;
    return { ...inv, available: availableStock(inv) };
  },

  async reserve(variantId: VariantId, qty: number) {
    await delay();
    const inv = inventoryState.get(variantId as string);
    if (!inv) return Err<StockError>({ kind: 'not_found' });

    const available = availableStock(inv);
    if (available < qty) {
      return Err<StockError>({ kind: 'insufficient', available });
    }

    inventoryState.set(variantId as string, { ...inv, reserved: inv.reserved + qty });

    const reservation: Reservation = {
      id: `res_${Math.random().toString(36).slice(2, 10)}`,
      variantId,
      quantity: qty,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    };
    reservations.set(reservation.id, reservation);
    return Ok(reservation);
  },

  async release(reservationId: string): Promise<void> {
    await delay();
    const r = reservations.get(reservationId);
    if (!r) return;
    const inv = inventoryState.get(r.variantId as string);
    if (inv) {
      inventoryState.set(r.variantId as string, {
        ...inv,
        reserved: Math.max(0, inv.reserved - r.quantity),
      });
    }
    reservations.delete(reservationId);
  },
});

/* ------------------------------------------------------------------ *
 * Delivery
 *
 * ⛔ D-21/22/23 — ZONES ARE NOT SUPPLIED. `zones()` returns EMPTY.
 *    This is not a stub to be filled in with plausible Nairobi suburbs.
 *    Inventing a delivery promise is exactly what NN-05 forbids.
 * ------------------------------------------------------------------ */

export /**
 * ⛔ D-21 / D-22 / D-23 — NO NAIROBI ZONE IS INVENTED.
 *
 *   `EMPTY_DELIVERY_CONFIG` ships zero zones. The storefront therefore renders an
 *   honest "delivery areas are being confirmed" state instead of a fabricated
 *   dropdown of suburbs with prices the business never agreed to.
 *
 *   `MOCK_DELIVERY_CONFIG` below exists ONLY so the rule engine can be exercised
 *   in tests and in local development. It is gated behind an explicit opt-in and
 *   is NEVER the default. [NN-05]
 */
const mockDelivery = (): DeliveryService => ({
  async config(): Promise<DeliveryConfig> {
    await delay();
    return clone(opts.deliveryConfig);
  },

  async zones(): Promise<readonly DeliveryZone[]> {
    await delay();
    return clone(opts.deliveryConfig.zones.filter((z) => z.active));
  },

  async quote(
    zid: ZoneId,
    lines: readonly CartLine[]
  ): Promise<Result<ZoneQuote, DeliveryError>> {
    await delay();
    // ⚠ The DOMAIN owns the rule. The adapter only supplies the config.
    const subtotal = linesSubtotal(lines);
    return quoteDelivery(opts.deliveryConfig, zid, lines, subtotal);
  },
});

const mockDiscounts = (): DiscountRepository => ({
  async byCode(code: string): Promise<Discount | null> {
    await delay();
    return MOCK_DISCOUNTS.find((d) => d.code.toLowerCase() === code.toLowerCase()) ?? null;
  },
});

/* ------------------------------------------------------------------ *
 * Cart
 * ------------------------------------------------------------------ */

const carts = new Map<string, Cart>();

const priceOf = (variantId: VariantId) => {
  for (const p of MOCK_PRODUCTS) {
    const v = p.variants.find((v) => v.id === variantId);
    if (v && !isUnavailable(v.price)) return v.price;
  }
  return null;
};

const recompute = async (cart: Cart, discount: Discount | null): Promise<Cart> => {
  const totals = calculateTotals({
    lines: cart.lines,
    discount,
    // Blocked on D-21/22 — there is no zone, so there is no quote.
    deliveryQuote: null,
    // ⛔ D-25 — no free-delivery threshold has been supplied.
    freeDeliveryThreshold: null,
  });
  return { ...cart, totals, updatedAt: new Date().toISOString() };
};

const getDiscount = async (code: string | null): Promise<Discount | null> =>
  code ? (MOCK_DISCOUNTS.find((d) => d.code === code) ?? null) : null;

export const mockCarts = (): CartRepository => ({
  async get(id: CartId): Promise<Cart | null> {
    await delay();
    return clone(carts.get(id as string) ?? null);
  },

  async create(customerId: CustomerId | null): Promise<Cart> {
    await delay();
    const id = toCartId(`cart_${Math.random().toString(36).slice(2, 10)}`);
    const empty: Cart = {
      id,
      customerId,
      lines: [],
      discountCode: null,
      zoneId: null,
      totals: calculateTotals({
        lines: [],
        discount: null,
        deliveryQuote: null,
        freeDeliveryThreshold: null,
      }),
      updatedAt: new Date().toISOString(),
    };
    carts.set(id as string, empty);
    return clone(empty);
  },

  async addLine(id: CartId, input: CartLineInput): Promise<Cart> {
    await delay();
    const cart = carts.get(id as string);
    if (!cart) throw new Error(`Cart not found: ${id}`);

    const price = priceOf(input.variantId);
    if (!price) throw new Error(`No price for variant ${input.variantId} — blocked on D-14`);

    const line: CartLine = {
      variantId: input.variantId,
      quantity: input.quantity,
      unitPrice: price, // SNAPSHOTTED
      bundleId: null,
    };
    const next = await recompute(
      { ...cart, lines: addLineFn(cart.lines, line) },
      await getDiscount(cart.discountCode)
    );
    carts.set(id as string, next);
    return clone(next);
  },

  async updateLine(id: CartId, variantId: VariantId, qty: number): Promise<Cart> {
    await delay();
    const cart = carts.get(id as string);
    if (!cart) throw new Error(`Cart not found: ${id}`);
    const next = await recompute(
      { ...cart, lines: updateLineQuantity(cart.lines, variantId, qty) },
      await getDiscount(cart.discountCode)
    );
    carts.set(id as string, next);
    return clone(next);
  },

  async removeLine(id: CartId, variantId: VariantId): Promise<Cart> {
    await delay();
    const cart = carts.get(id as string);
    if (!cart) throw new Error(`Cart not found: ${id}`);
    const next = await recompute(
      { ...cart, lines: removeLineFn(cart.lines, variantId) },
      await getDiscount(cart.discountCode)
    );
    carts.set(id as string, next);
    return clone(next);
  },

  async applyDiscount(id: CartId, code: string) {
    await delay();
    const cart = carts.get(id as string);
    if (!cart) throw new Error(`Cart not found: ${id}`);

    const found = MOCK_DISCOUNTS.find((d) => d.code.toLowerCase() === code.toLowerCase());
    const result = validateDiscount(found, cart.lines);
    if (!result.ok) return Err<DiscountError>(result.error);

    const next = await recompute({ ...cart, discountCode: result.value.code }, result.value);
    carts.set(id as string, next);
    return Ok(clone(next));
  },

  async removeDiscount(id: CartId): Promise<Cart> {
    await delay();
    const cart = carts.get(id as string);
    if (!cart) throw new Error(`Cart not found: ${id}`);
    const next = await recompute({ ...cart, discountCode: null }, null);
    carts.set(id as string, next);
    return clone(next);
  },

  async setZone(id: CartId, zoneId: ZoneId): Promise<Cart> {
    await delay();
    const cart = carts.get(id as string);
    if (!cart) throw new Error(`Cart not found: ${id}`);
    const next = await recompute(
      { ...cart, zoneId },
      await getDiscount(cart.discountCode)
    );
    carts.set(id as string, next);
    return clone(next);
  },
});

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

const orders = new Map<string, Order>();
let orderSeq = 1000;

/**
 * ⚠ DEMO ORDERS for the seeded account, so the account area is explorable.
 *   Idempotent: seeds once. Prices are PLACEHOLDERS (⛔ D-14) like everywhere else.
 */
let demoOrdersSeeded = false;
export const __seedDemoOrders = (customerId: string): void => {
  if (demoOrdersSeeded) return;
  demoOrdersSeeded = true;

  const addr = {
    id: 'addr_demo_1',
    recipientName: 'Amina Wanjiru',
    phone: '254712000111' as never,
    zoneId: '' as never,
    estate: 'Kileleshwa',
    building: 'Riverside Apartments, Block C, Flat 4',
    landmark: 'Opposite the Total petrol station',
    instructions: 'Call on arrival; gate code 4471.',
    isDefault: true,
  };

  const line = (variantId: string, name: string, sku: string, qty: number) => ({
    variantId: variantId as never,
    quantity: qty,
    unitPrice: fromMajor(550),
    productName: name,
    sku,
  });

  const mk = (
    n: number,
    status: string,
    daysAgo: number,
    ref: string | null,
    lines: ReturnType<typeof line>[]
  ): Order => ({
    id: toOrderId(`ord_demo_${n}`),
    number: `TS-${2000 + n}`,
    customerId: toCustomerId(customerId),
    lines,
    totals: calculateTotals({ lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity, unitPrice: l.unitPrice, bundleId: null })), discount: null, deliveryQuote: null, freeDeliveryThreshold: null }),
    deliveryAddress: addr,
    billingAddress: addr,
    status: status as never,
    payments: [],
    isGift: false,
    giftNote: null,
    mpesaReference: ref,
    createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  });

  orders.set('ord_demo_1', mk(1, 'delivered', 21, 'SFF6VXQ8LR', [
    line('var_passion_1l', 'Passion', 'TS-PAS-1L', 2),
    line('var_pineapple_1l', 'Pineapple', 'TS-PIN-1L', 1),
  ]));
  orders.set('ord_demo_2', mk(2, 'dispatched', 3, 'SGH2KLM9PQ', [
    line('var_grape_ginger_1l', 'Grape Ginger', 'TS-GRG-1L', 3),
  ]));
};

export const mockOrders = (): OrderRepository => ({
  async create(input: CreateOrderInput): Promise<Order> {
    await delay();
    const cart = carts.get(input.cartId as string);
    if (!cart) throw new Error(`Cart not found: ${input.cartId}`);

    const id = toOrderId(`ord_${Math.random().toString(36).slice(2, 10)}`);
    const order: Order = {
      id,
      number: `TS-${++orderSeq}`,
      customerId: input.customerId,
      // ⚠ SNAPSHOTTED. Never joins live to Variant.
      lines: cart.lines.map((l) => {
        const product = MOCK_PRODUCTS.find((p) => p.variants.some((v) => v.id === l.variantId));
        const variant = product?.variants.find((v) => v.id === l.variantId);
        return {
          variantId: l.variantId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          productName: product?.name ?? 'Unknown',
          sku: variant?.sku ?? 'UNKNOWN',
        };
      }),
      totals: cart.totals,
      deliveryAddress: { ...input.deliveryAddress, id: `addr_${orderSeq}_d` },
      billingAddress: { ...input.billingAddress, id: `addr_${orderSeq}_b` },
      // ⚠ Phase 5: renamed. `draft` → `awaiting_payment` is now a GUARDED
      //   transition, not a free assignment. See `domain/order`.
      status: 'awaiting_payment',
      payments: [],
      isGift: input.isGift,
      giftNote: input.giftNote,
      mpesaReference: null,
      createdAt: new Date().toISOString(),
    };
    orders.set(id as string, order);
    return clone(order);
  },

  async byId(id: OrderId): Promise<Order | null> {
    await delay();
    return clone(orders.get(id as string) ?? null);
  },

  async listForCustomer(id: CustomerId): Promise<readonly Order[]> {
    await delay();
    return clone([...orders.values()].filter((o) => o.customerId === id));
  },

  /**
   * ⚠ THE SUPPORT LOOKUP. The customer quotes the M-PESA code, not an order
   *   number. Matching on phone AND on M-PESA reference is what lets care
   *   answer "did my money go through?" [R-21, F-88]
   */
  async findByPhoneOrReference(query: string): Promise<readonly Order[]> {
    await delay();
    const q = query.trim().toLowerCase();
    return clone(
      [...orders.values()].filter(
        (o) =>
          o.mpesaReference?.toLowerCase() === q ||
          o.deliveryAddress.phone.toLowerCase().includes(q) ||
          o.number.toLowerCase() === q
      )
    );
  },
});

const mockNotifications = (): NotificationService => ({
  async send(message) {
    await delay();
    // ⚠ NOT OPERATIONAL. Nothing is sent. [NN-04]
    logger.info('notification (mock — nothing sent)', {
      channel: message.channel,
      template: message.template,
      to: message.to, // redacted by the logger
    });
    return Ok({ id: `notif_${Math.random().toString(36).slice(2, 10)}` });
  },
});

/* ------------------------------------------------------------------ *
 * COLLECTIONS & BUNDLES — Phase 4
 * ------------------------------------------------------------------ */

const mockCollections = (): CollectionRepository => ({
  async list() {
    await delay();
    return clone(MOCK_COLLECTIONS.filter((c) => c.status === 'active'));
  },

  async bySlug(slug: string) {
    await delay();
    return clone(MOCK_COLLECTIONS.find((c) => c.slug === slug) ?? null);
  },
});

const mockBundles = (): BundleRepository => ({
  async list() {
    await delay();
    return clone(MOCK_BUNDLES.filter((b) => b.status === 'active'));
  },

  async bySlug(slug: string) {
    await delay();
    return clone(MOCK_BUNDLES.find((b) => b.slug === slug) ?? null);
  },
});

/* ------------------------------------------------------------------ *
 * Checkout — REVALIDATION
 * ------------------------------------------------------------------ */

/**
 * ⚠ TEST SEAM. Lets a test move a price or drop stock UNDERNEATH a live cart,
 *   which is precisely what happens to a real customer who left a tab open on a
 *   bus. Without a way to simulate it, the stale-cart path is never exercised
 *   and ships broken.
 */
export const __simulateDrift = (drift: {
  priceChanges?: Record<string, number>;
  stockChanges?: Record<string, number>;
}): void => {
  if (drift.priceChanges) {
    for (const [vid, minor] of Object.entries(drift.priceChanges)) {
      priceDrift.set(vid, minor);
    }
  }
  if (drift.stockChanges) {
    for (const [vid, qty] of Object.entries(drift.stockChanges)) {
      const inv = inventoryState.get(vid);
      if (inv) inventoryState.set(vid, { ...inv, onHand: qty, available: Math.max(0, qty - inv.reserved) });
    }
  }
};

const priceDrift = new Map<string, number>();

const mockCheckout = (): CheckoutService => ({
  /**
   * ⚠ THE STALE-CART GUARD. Runs before EVERY payment, without exception.
   *
   *   The cart's prices are SNAPSHOTS taken when the item was added. They may be
   *   hours or days old. Three things can have moved underneath them:
   *     · the price   → charging the old one is a loss; charging the new one
   *                     silently is a betrayal. So we SHOW them.
   *     · the stock   → a small-batch product sells out. Silently shipping a
   *                     shorter box is worse than saying so.
   *     · the coupon  → it may have expired while the tab sat open.
   *
   *   A price DROP does not block — nobody was ever harmed by paying less than
   *   they expected. Everything else makes the customer look before we take a
   *   shilling. [F-53]
   */
  async revalidate(id: CartId): Promise<RevalidationResult> {
    await delay();

    const cart = carts.get(id as string);
    if (!cart) return summariseRevalidation([], []);

    const changes: CartChange[] = [];
    const lines: CartLine[] = [];

    for (const line of cart.lines) {
      const vid = line.variantId as string;

      const product = MOCK_PRODUCTS.find((p) =>
        p.variants.some((v) => (v.id as string) === vid)
      );
      const variant = product?.variants.find((v) => (v.id as string) === vid);
      const name = product?.name ?? 'That item';

      if (!product || !variant || product.status !== 'active') {
        changes.push({ kind: 'unavailable', variantId: line.variantId, name });
        continue;
      }

      /* ---- stock ---- */
      const inv = inventoryState.get(vid);
      const available = inv ? availableStock(inv) : 0;

      if (available <= 0) {
        changes.push({ kind: 'out_of_stock', variantId: line.variantId, name });
        continue; // the line is DROPPED — and the customer is told why
      }

      let qty = line.quantity;
      if (available < line.quantity) {
        changes.push({
          kind: 'stock_reduced',
          variantId: line.variantId,
          name,
          requested: line.quantity,
          available,
        });
        qty = available; // ⚠ adjusted DOWN, never silently
      }

      /* ---- price ---- */
      let unitPrice = line.unitPrice;
      const drifted = priceDrift.get(vid);

      if (drifted !== undefined && drifted !== line.unitPrice.amount) {
        const to = { ...line.unitPrice, amount: drifted };
        changes.push({
          kind: drifted > line.unitPrice.amount ? 'price_increased' : 'price_decreased',
          variantId: line.variantId,
          name,
          from: line.unitPrice,
          to,
        });
        unitPrice = to;
      }

      lines.push({ ...line, quantity: qty, unitPrice });
    }

    /* ---- discount ---- */
    if (cart.discountCode) {
      const d = MOCK_DISCOUNTS.find(
        (x) => x.code.toLowerCase() === cart.discountCode!.toLowerCase()
      );
      const check = validateDiscount(d, lines);
      if (!check.ok) {
        changes.push(
          check.error.kind === 'expired'
            ? { kind: 'discount_expired', code: cart.discountCode }
            : { kind: 'discount_invalid', code: cart.discountCode }
        );
      }
    }

    return summariseRevalidation(changes, lines);
  },

  /**
   * ⚠ IDEMPOTENT BY THE KEY, NOT BY THE CART.
   *
   *   Two taps of "Place order" send the SAME key, and must produce ONE order.
   *   But a customer whose first payment genuinely FAILED must be able to try
   *   again with the same cart — which is why the key is per-ATTEMPT, and not
   *   derived from the cart id.
   */
  async createOrder(
    id: CartId,
    checkout: Checkout,
    key: IdempotencyKey
  ): Promise<Result<Order, PaymentError>> {
    await delay();

    const replayed = ordersByIdemKey.get(key as string);
    if (replayed) {
      const existing = orders.get(replayed);
      if (existing) return Ok(clone(existing)); // ⚠ the SAME order. Not a second one.
    }

    const cart = carts.get(id as string);
    if (!cart || cart.lines.length === 0) {
      return Err({ kind: 'stale_checkout', detail: 'The cart is empty.' });
    }

    // ⚠ Re-check before creating. The cart may have gone stale in the
    //   seconds between the review screen and the tap.
    const check = await this.revalidate(id);
    if (check.requiresAcknowledgement) {
      return Err({
        kind: 'stale_checkout',
        detail: 'Something in the box changed. Please review it.',
      });
    }

    const oid = toOrderId(`ord_${orderSeq++}`);
    const address =
      checkout.fulfilment.method === 'delivery' ? checkout.fulfilment.address : null;

    const order: Order = {
      id: oid,
      number: `TS-${orderSeq}`,
      customerId: null,
      lines: check.lines.map((l) => {
        const product = MOCK_PRODUCTS.find((p) =>
          p.variants.some((v) => v.id === l.variantId)
        );
        const variant = product?.variants.find((v) => v.id === l.variantId);
        return {
          variantId: l.variantId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          // ⚠ SNAPSHOTTED. A later rename must not rewrite history.
          productName: product?.name ?? 'Unknown',
          sku: variant?.sku ?? 'UNKNOWN',
        };
      }),
      totals: calculateTotals({
        lines: check.lines,
        discount: null,
        deliveryQuote: null,
        freeDeliveryThreshold: opts.deliveryConfig.freeDeliveryThreshold,
      }),
      deliveryAddress: {
        id: 'addr_1',
        recipientName: address?.recipientName ?? checkout.contact.fullName,
        phone: address?.recipientPhone ?? checkout.contact.phone,
        zoneId: (address?.zoneId ?? '') as ZoneId,
        estate: address?.estate ?? '',
        building: address?.building ?? '',
        landmark: address?.landmark ?? '',
        instructions: address?.instructions ?? '',
        isDefault: true,
      },
      billingAddress: {
        id: 'addr_1',
        recipientName: checkout.contact.fullName,
        phone: checkout.contact.phone,
        zoneId: (address?.zoneId ?? '') as ZoneId,
        estate: address?.estate ?? '',
        building: address?.building ?? '',
        landmark: address?.landmark ?? '',
        instructions: '',
        isDefault: true,
      },
      // ⚠ `draft` — NOT `paid`. Payment has not been attempted yet.
      status: 'draft',
      payments: [],
      isGift: false, // ⛔ D-44 — gifting not confirmed
      giftNote: null,
      mpesaReference: null,
      createdAt: new Date().toISOString(),
    };

    orders.set(oid as string, order);
    ordersByIdemKey.set(key as string, oid as string);

    return Ok(clone(order));
  },
});

const ordersByIdemKey = new Map<string, string>();

/* ------------------------------------------------------------------ *
 * Composition root
 * ------------------------------------------------------------------ */

export const createMockAdapters = (options?: MockOptions): Adapters => {
  if (options) configureMocks(options);
  return {
    products: mockProducts(),
    collections: mockCollections(),
    bundles: mockBundles(),
    inventory: mockInventory(),
    carts: mockCarts(),
    delivery: mockDelivery(),
    discounts: mockDiscounts(),
    orders: mockOrders(),
    payments: createMockPaymentGateway({
      forceOutcome: opts.forcePaymentOutcome ?? undefined,
      pinDelayMs: opts.pinDelayMs,
      cardEnabled: opts.cardEnabled,
    }),
    checkout: mockCheckout(),
    notifications: mockNotifications(),
    auth: mockAuth(),
    customer: mockCustomer(),
    addresses: mockAddresses(),
    subscriptions: mockSubscriptions(),
    preferences: mockPreferences(),
  };
};

/** Test helper — clears all in-memory state between tests. */
export const resetMockState = (): void => {
  carts.clear();
  orders.clear();
  reservations.clear();
  inventoryState.clear();
  for (const i of MOCK_INVENTORY) inventoryState.set(i.variantId as string, { ...i });
  orderSeq = 1000;
  ordersByIdemKey.clear();
  priceDrift.clear();
  resetAccountState();
  demoOrdersSeeded = false;
  opts = { ...DEFAULTS };
};
