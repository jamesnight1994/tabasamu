'use client';

/**
 * CART PROVIDER
 *
 * ⚠ THE SEAM. This is where React state meets the domain — and it is a THIN
 *   layer, on purpose.
 *
 *   Every rule lives in `domain/pricing` and `domain/cart`: the totals maths,
 *   the quantity clamp, the merge-on-add, the serialisation format, the
 *   hostile-input validation. This component holds a `useReducer` and calls
 *   those pure functions. It computes NOTHING itself.
 *
 *   If a total is ever wrong, the bug is in a unit-testable pure function and
 *   not tangled in a React render. That is the entire point of the boundary. [R-13]
 *
 * ⚠ IT DEPENDS ON `Adapters` (the PORT), NOT on an adapter implementation. The
 *   composition root injects the concrete set. Lint forbids the alternative.
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import {
  type CartLine,
  type Totals,
  type Discount,
  calculateTotals,
  addLine as addLineFn,
  updateLineQuantity,
  removeLine as removeLineFn,
  totalItemCount,
} from '../../domain/pricing';

import {
  serialiseCart,
  deserialiseCart,
  toCartLines,
  CART_STORAGE_KEY,
} from '../../domain/cart';

import {
  type DeliveryConfig,
  type DeliveryQuote,
  EMPTY_DELIVERY_CONFIG,
} from '../../domain/delivery';

import { type Money, type VariantId, type ZoneId, cartId as toCartId } from '../../domain/shared';
import { logger } from '../../lib/logger';

/* ================================================================== *
 * State
 * ================================================================== */

export interface CartState {
  readonly cartId: string;
  readonly lines: readonly CartLine[];
  readonly discount: Discount | null;
  readonly discountCode: string | null;
  readonly zoneId: ZoneId | null;
  readonly deliveryQuote: DeliveryQuote | null;
  readonly deliveryConfig: DeliveryConfig;
  /** ⚠ True until the stored cart has been read. Prevents a flash of "empty". */
  readonly hydrating: boolean;
  readonly error: string | null;
}

type Action =
  | { type: 'hydrated'; lines: readonly CartLine[]; cartId: string; discountCode: string | null; zoneId: ZoneId | null }
  | { type: 'add'; line: CartLine }
  | { type: 'setQuantity'; variantId: VariantId; quantity: number }
  | { type: 'remove'; variantId: VariantId }
  | { type: 'clear' }
  | { type: 'setDiscount'; discount: Discount | null; code: string | null }
  | { type: 'setZone'; zoneId: ZoneId | null; quote: DeliveryQuote | null }
  | { type: 'setDeliveryConfig'; config: DeliveryConfig }
  | { type: 'replaceLines'; lines: readonly CartLine[] }
  | { type: 'error'; message: string | null };

const initial: CartState = {
  cartId: '',
  lines: [],
  discount: null,
  discountCode: null,
  zoneId: null,
  deliveryQuote: null,
  deliveryConfig: EMPTY_DELIVERY_CONFIG, // ⛔ D-21/22/23 — zero zones until told otherwise
  hydrating: true,
  error: null,
};

/**
 * ⚠ EVERY CASE DELEGATES TO A PURE DOMAIN FUNCTION.
 *   There is no arithmetic in this reducer. Look for it — there is none.
 */
const reducer = (s: CartState, a: Action): CartState => {
  switch (a.type) {
    case 'hydrated':
      return {
        ...s,
        cartId: a.cartId,
        lines: a.lines,
        discountCode: a.discountCode,
        zoneId: a.zoneId,
        hydrating: false,
      };
    case 'add':
      return { ...s, lines: addLineFn(s.lines, a.line), error: null };
    case 'setQuantity':
      return { ...s, lines: updateLineQuantity(s.lines, a.variantId, a.quantity) };
    case 'remove':
      return { ...s, lines: removeLineFn(s.lines, a.variantId) };
    case 'clear':
      return { ...s, lines: [], discount: null, discountCode: null };
    case 'setDiscount':
      return { ...s, discount: a.discount, discountCode: a.code };
    case 'setZone':
      return { ...s, zoneId: a.zoneId, deliveryQuote: a.quote };
    case 'setDeliveryConfig':
      return { ...s, deliveryConfig: a.config };
    case 'replaceLines':
      return { ...s, lines: a.lines };
    case 'error':
      return { ...s, error: a.message };
  }
};

/* ================================================================== *
 * Context
 * ================================================================== */

export interface CartContextValue extends CartState {
  readonly totals: Totals;
  readonly itemCount: number;
  readonly isEmpty: boolean;
  addItem(variantId: VariantId, unitPrice: Money, quantity?: number): void;
  setQuantity(variantId: VariantId, quantity: number): void;
  removeItem(variantId: VariantId): void;
  clear(): void;
  applyDiscount(code: string): Promise<{ ok: boolean; message: string }>;
  removeDiscount(): void;
  setZone(zoneId: ZoneId): Promise<void>;
  replaceLines(lines: readonly CartLine[]): void;
}

const CartContext = createContext<CartContextValue | null>(null);

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>.');
  return ctx;
};

/* ================================================================== *
 * Provider
 * ================================================================== */

/**
 * ⚠ `adapters` is INJECTED, and its type is the PORT. This component has never
 *   heard of `createMockAdapters`, and it will not need to change when the real
 *   backend arrives. That swap is the Gate G2 acceptance test. [R-13]
 */
export interface CartProviderProps {
  children: ReactNode;
  adapters: import('../../ports').Adapters;
}

export function CartProvider({ children, adapters }: CartProviderProps) {
  const [state, dispatch] = useReducer(reducer, initial);

  /* ---------------- hydrate ---------------- */

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      let lines: readonly CartLine[] = [];
      let id = '';
      let code: string | null = null;
      let zone: ZoneId | null = null;

      /**
       * ⚠ `localStorage` LIVES HERE, IN THE ADAPTER-FACING LAYER — never in the
       *   domain, which is banned from touching `window` by lint.
       *
       *   And it is wrapped in try/catch because it THROWS in Safari private
       *   mode and when a quota is exceeded. An unhandled throw here would take
       *   down the entire storefront on page load, for a feature as optional as
       *   restoring a cart.
       */
      try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);
        const restored = deserialiseCart(raw);

        if (restored.kind === 'restored') {
          lines = toCartLines(restored.cart);
          id = restored.cart.cartId;
          code = restored.cart.discountCode;
          zone = (restored.cart.zoneId as ZoneId | null) ?? null;
        } else if (restored.reason.kind !== 'absent') {
          // ⚠ Not an error the customer needs to see. But we log it, because a
          //   spike in `malformed` means we shipped a serialisation bug.
          logger.warn('cart.restore.discarded', { reason: restored.reason.kind });
        }
      } catch (e) {
        logger.warn('cart.storage.unavailable', { error: String(e) });
      }

      if (!id) id = toCartId(`cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

      /** ⛔ D-21/22/23 — whatever the backend says. Today: zero zones. */
      const config = await adapters.delivery.config().catch(() => EMPTY_DELIVERY_CONFIG);

      if (cancelled) return;
      dispatch({ type: 'setDeliveryConfig', config });
      dispatch({ type: 'hydrated', lines, cartId: id, discountCode: code, zoneId: zone });
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [adapters]);

  /* ---------------- persist ---------------- */

  const first = useRef(true);

  useEffect(() => {
    // ⚠ Do not write during hydration, or we would immediately overwrite the
    //   stored cart with the empty initial state — destroying it.
    if (state.hydrating) return;
    if (first.current) {
      first.current = false;
    }

    try {
      const blob = serialiseCart(
        toCartId(state.cartId),
        state.lines,
        state.discountCode,
        state.zoneId
      );
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(blob));
    } catch (e) {
      // ⚠ Quota exceeded, or private mode. The cart still works in memory for
      //   this session. Losing persistence is survivable; crashing is not.
      logger.warn('cart.persist.failed', { error: String(e) });
    }
  }, [state.lines, state.discountCode, state.zoneId, state.cartId, state.hydrating]);

  /* ---------------- totals ---------------- */

  /**
   * ⚠ DERIVED, NEVER STORED.
   *
   *   A stored total is a total that can drift out of sync with the lines that
   *   produced it. It is recomputed by the same pure function the backend will
   *   use, so the number the customer sees and the number they are charged come
   *   from ONE implementation.
   */
  const totals = useMemo(
    () =>
      calculateTotals({
        lines: state.lines,
        discount: state.discount,
        deliveryQuote: state.deliveryQuote
          ? { fee: state.deliveryQuote.fee, leadTime: state.deliveryQuote.leadTime }
          : null,
        freeDeliveryThreshold: state.deliveryConfig.freeDeliveryThreshold, // ⛔ D-25
      }),
    [state.lines, state.discount, state.deliveryQuote, state.deliveryConfig]
  );

  /* ---------------- actions ---------------- */

  const addItem = useCallback(
    (variantId: VariantId, unitPrice: Money, quantity = 1) => {
      dispatch({
        type: 'add',
        // ⚠ The price is SNAPSHOTTED here and revalidated before payment. [F-53]
        line: { variantId, quantity, unitPrice, bundleId: null },
      });
    },
    []
  );

  const applyDiscount = useCallback(
    async (code: string): Promise<{ ok: boolean; message: string }> => {
      const trimmed = code.trim();
      if (!trimmed) return { ok: false, message: 'Enter a code.' };

      try {
        const found = await adapters.discounts.byCode(trimmed);
        if (!found) {
          return { ok: false, message: 'That code is not recognised.' };
        }
        dispatch({ type: 'setDiscount', discount: found, code: trimmed });
        return { ok: true, message: 'Code applied.' };
      } catch {
        return { ok: false, message: 'We could not check that code just now.' };
      }
    },
    [adapters]
  );

  const setZone = useCallback(
    async (zid: ZoneId) => {
      try {
        const q = await adapters.delivery.quote(zid, state.lines);
        dispatch({
          type: 'setZone',
          zoneId: zid,
          // ⚠ A FAILED quote sets the quote to null — which makes the total
          //   render as `Unavailable`, not as a number we guessed. [NN-05]
          quote: q.ok ? q.value : null,
        });
        if (!q.ok) {
          dispatch({ type: 'error', message: null });
        }
      } catch {
        dispatch({ type: 'setZone', zoneId: zid, quote: null });
      }
    },
    [adapters, state.lines]
  );

  const value: CartContextValue = useMemo(
    () => ({
      ...state,
      totals,
      itemCount: totalItemCount(state.lines),
      isEmpty: state.lines.length === 0,
      addItem,
      setQuantity: (variantId, quantity) =>
        dispatch({ type: 'setQuantity', variantId, quantity }),
      removeItem: (variantId) => dispatch({ type: 'remove', variantId }),
      clear: () => dispatch({ type: 'clear' }),
      applyDiscount,
      removeDiscount: () => dispatch({ type: 'setDiscount', discount: null, code: null }),
      setZone,
      replaceLines: (lines) => dispatch({ type: 'replaceLines', lines }),
    }),
    [state, totals, addItem, applyDiscount, setZone]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
