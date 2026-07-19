'use client';

/**
 * CART UI
 *
 * ⚠ THE HARDEST THING THIS FILE DOES IS REFUSE TO SHOW A NUMBER.
 *
 *   The delivery fee and the order total are `Pending<Money>`. Until the customer
 *   picks a zone — and until the CLIENT has actually supplied that zone's fee
 *   (⛔ D-22) — the total is genuinely unknown, and it renders as an explicit
 *   "awaiting confirmation" marker rather than as `KES 0`.
 *
 *   A zero that should be a number is not a cosmetic bug. It is a quoted price
 *   the business never agreed to, and the customer discovers the truth at the
 *   door. [NN-05, P-03]
 */

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { PendingValue } from './Price';
import { Button } from '../primitives/Button';
import { Field, Input, QuantityControl, Select } from '../primitives/Form';
import { EmptyState } from '../primitives/Surface';
import { formatMoney, type Money, type ZoneId } from '../../domain/shared';
import { isUnavailable } from '../../domain/catalogue';
import { hasZones } from '../../domain/delivery';
import { cn } from '../../lib/utils/cn';

/* ================================================================== *
 * Line
 * ================================================================== */

export interface CartLineViewProps {
  variantId: string;
  name: string;
  variantLabel: string;
  unitPrice: Money;
  quantity: number;
  imageUrl?: string | null;
  onQuantityChange(q: number): void;
  onRemove(): void;
}

export function CartLineView({
  name,
  variantLabel,
  unitPrice,
  quantity,
  onQuantityChange,
  onRemove,
}: CartLineViewProps) {
  return (
    <li className="flex gap-4 border-b border-charcoal/10 py-5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-fraunces)] text-base text-charcoal">
          {name}
        </p>
        {/* ⚠ The variant is never implied. 1L and 500ml are different products. */}
        <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-charcoal/55">
          {variantLabel}
        </p>

        <div className="mt-3 flex items-center gap-4">
          <QuantityControl
            value={quantity}
            onChange={onQuantityChange}
            min={1}
            max={99}
            itemName={name}
          />

          {/**
           * ⚠ A TEXT BUTTON, NOT A BIN ICON.
           *   N-02/N-03: an icon without a label is a guess. Removing an item is
           *   destructive and irreversible in one tap — it gets a word.
           */}
          <button
            type="button"
            onClick={onRemove}
            className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-charcoal/55 underline underline-offset-4 transition-colors hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-[family-name:var(--font-mono)] text-sm tabular-nums text-charcoal">
          {formatMoney({ ...unitPrice, amount: unitPrice.amount * quantity })}
        </p>
        {quantity > 1 && (
          <p className="mt-1 font-[family-name:var(--font-mono)] text-xs tabular-nums text-charcoal/50">
            {formatMoney(unitPrice)} each
          </p>
        )}
      </div>
    </li>
  );
}

/* ================================================================== *
 * Zone selector — ⛔ D-21/22/23
 * ================================================================== */

/**
 * ⚠ P-03 — THE FEE MUST BE KNOWABLE BEFORE THE CART.
 *   Hiding the delivery cost until the final checkout step is the single biggest
 *   first-time-buyer frustration in this market (R-08). So the zone selector
 *   appears in the cart, not three screens later.
 *
 * ⛔ AND TODAY IT HAS NOTHING TO OFFER, because D-21/22/23 are unanswered.
 *   It therefore renders an honest explanation rather than a fabricated dropdown
 *   of Nairobi suburbs with invented prices.
 */
export function ZoneSelector() {
  const { deliveryConfig, zoneId, setZone } = useCart();

  if (!hasZones(deliveryConfig)) {
    return (
      <div className="rounded-sm border border-dashed border-charcoal/25 bg-charcoal/[0.03] p-4">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/60">
          Delivery — awaiting confirmation
        </p>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/75">
          Delivery areas and fees are being confirmed. Your total does not yet
          include delivery.
        </p>
        {/* ⚠ The decision ID is VISIBLE. A blocked field is traceable to a real
            open question, and cannot be mistaken for a design choice. */}
        <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-charcoal/40">
          Blocked by D-21 / D-22 / D-23
        </p>
      </div>
    );
  }

  return (
    <Field label="Where are we delivering to?">
      {({ inputId, describedBy }) => (
        <Select
          id={inputId}
          aria-describedby={describedBy}
          value={zoneId ?? ''}
          onChange={(e) => void setZone(e.target.value as ZoneId)}
        >
          <option value="">Choose your area</option>
          {deliveryConfig.zones
            .filter((z) => z.active)
            .map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
                {z.areas.length > 0 ? ` — ${z.areas.slice(0, 3).join(', ')}` : ''}
              </option>
            ))}
        </Select>
      )}
    </Field>
  );
}

/* ================================================================== *
 * Discount — ⚠ P-07: a field and a line item. NEVER a banner or a timer.
 * ================================================================== */

export function DiscountField() {
  const { discountCode, applyDiscount, removeDiscount } = useCart();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (discountCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-sm bg-forest/[0.06] px-3 py-2.5">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-forest">
          {discountCode} applied
        </p>
        <button
          type="button"
          onClick={() => {
            removeDiscount();
            setMsg(null);
          }}
          className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-charcoal/55 underline underline-offset-4 hover:text-terracotta"
        >
          Remove
        </button>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    const r = await applyDiscount(code);
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) setCode('');
    setBusy(false);
  };

  return (
    <div>
      <div className="flex gap-2">
        <Input
          id="discount"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Discount code"
          aria-label="Discount code"
          // ⚠ Codes are typed in caps and phones love to autocorrect them.
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <Button
          variant="secondary"
          onClick={() => void submit()}
          disabled={busy || code.trim().length === 0}
        >
          Apply
        </Button>
      </div>
      {msg && (
        <p
          role="status"
          className={cn(
            'mt-2 text-xs',
            msg.ok ? 'text-forest' : 'text-terracotta'
          )}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}

/* ================================================================== *
 * Totals
 * ================================================================== */

/**
 * ⚠ THE MOST HONEST COMPONENT IN THE APPLICATION.
 *
 *   `delivery` and `total` are `Pending<Money>`. When they are `Unavailable`,
 *   this renders the blocked marker — NOT a zero, NOT a dash, NOT a guess.
 *
 *   ⛔ And `tax` is ALWAYS `Unavailable` (D-16), because nobody has told us
 *      whether the trading entity is VAT-registered. Printing "VAT: KES 0.00"
 *      would be a fabricated claim about someone's tax status.
 */
export function CartTotals({ compact = false }: { compact?: boolean }) {
  const { totals } = useCart();

  const Row = ({
    label,
    children,
    strong = false,
  }: {
    label: string;
    children: React.ReactNode;
    strong?: boolean;
  }) => (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 py-2',
        strong && 'border-t border-charcoal/15 pt-3 mt-1'
      )}
    >
      <span
        className={cn(
          'font-[family-name:var(--font-mono)] uppercase tracking-[0.14em]',
          strong ? 'text-xs text-charcoal' : 'text-[11px] text-charcoal/60'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'text-right tabular-nums',
          strong
            ? 'font-[family-name:var(--font-fraunces)] text-lg text-charcoal'
            : 'font-[family-name:var(--font-mono)] text-sm text-charcoal/85'
        )}
      >
        {children}
      </span>
    </div>
  );

  return (
    <div className={cn(compact ? 'text-sm' : '')}>
      <Row label="Subtotal">{formatMoney(totals.subtotal)}</Row>

      {totals.discount.amount > 0 && (
        <Row label="Discount">
          <span className="text-forest">−{formatMoney(totals.discount)}</span>
        </Row>
      )}

      <Row label="Delivery">
        {isUnavailable(totals.delivery) ? (
          // ⚠ NOT "KES 0". We do not know yet, and we say so.
          <PendingValue value={totals.delivery} />
        ) : totals.delivery.amount === 0 ? (
          <span className="text-forest">Free</span>
        ) : (
          formatMoney(totals.delivery)
        )}
      </Row>

      {/* ⛔ D-16 — VAT status unknown. `tax` is ALWAYS Unavailable. We never
          print a tax line with a number in it. */}

      <Row label="Total" strong>
        {isUnavailable(totals.total) ? (
          <PendingValue value={totals.total} />
        ) : (
          formatMoney(totals.total)
        )}
      </Row>
    </div>
  );
}

/* ================================================================== *
 * Empty
 * ================================================================== */

export function EmptyCart({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <EmptyState
      title="Your box is empty."
      body="Nothing here yet. The flavours are through the shop."
      action={
        <Button variant="secondary" asChild onClick={onDismiss}>
          <Link href="/shop">See the flavours</Link>
        </Button>
      }
    />
  );
}

/* ================================================================== *
 * Drawer contents
 * ================================================================== */

export interface CartContentsProps {
  onClose?: () => void;
  /** Resolves a variant id to display copy. Injected — the cart holds ids, not names. */
  resolve(variantId: string): { name: string; variantLabel: string } | null;
}

export function CartContents({ onClose, resolve }: CartContentsProps) {
  const { lines, setQuantity, removeItem, hydrating, isEmpty } = useCart();

  // ⚠ Prevents a flash of "your box is empty" before storage is read — which
  //   would look, for a beat, exactly like we lost the customer's cart.
  if (hydrating) {
    return (
      <div className="space-y-4 py-6" aria-busy="true" aria-live="polite">
        <div className="h-16 animate-pulse rounded-sm bg-charcoal/5" />
        <div className="h-16 animate-pulse rounded-sm bg-charcoal/5" />
        <span className="sr-only">Loading your box.</span>
      </div>
    );
  }

  if (isEmpty) return <EmptyCart onDismiss={onClose} />;

  return (
    <div className="space-y-6">
      <ul className="list-none">
        {lines.map((l) => {
          const meta = resolve(l.variantId);
          return (
            <CartLineView
              key={l.variantId}
              variantId={l.variantId}
              name={meta?.name ?? 'Item'}
              variantLabel={meta?.variantLabel ?? ''}
              unitPrice={l.unitPrice}
              quantity={l.quantity}
              onQuantityChange={(q) => setQuantity(l.variantId, q)}
              onRemove={() => removeItem(l.variantId)}
            />
          );
        })}
      </ul>

      <ZoneSelector />
      <DiscountField />
      <CartTotals compact />
    </div>
  );
}
