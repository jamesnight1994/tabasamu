'use client';

/**
 * CHECKOUT FORM
 *
 * ⚠ MOBILE-FIRST IS NOT A LAYOUT CHOICE HERE. It is the primary case.
 *   This form will overwhelmingly be filled in on a small Android handset, one
 *   thumb, on a moving matatu, on a connection that comes and goes. Every input
 *   below carries the `inputMode` / `autoComplete` / `enterKeyHint` that makes
 *   the OS keyboard behave — because a numeric keypad that shows QWERTY is a
 *   real, measurable cause of abandonment.
 *
 * ⚠ GUEST CHECKOUT IS THE DEFAULT AND THE ACCOUNT IS AN OPTION.
 *   Forcing a first-time buyer to create an account before they can pay is the
 *   most reliable way to lose them. [F-49]
 */

import { useState, useRef, useCallback } from 'react';
import { useCart } from './CartProvider';
import { CartTotals } from './Cart';
import { Button } from '../primitives/Button';
import { Field, Input, PhoneInput, Textarea, Checkbox, RadioGroup, Select } from '../primitives/Form';
import {
  validateCheckout,
  canSubmit,
  isBusy,
  cartChangeMessage,
  type SubmissionState,
  type CheckoutInput,
  type RevalidationResult,
} from '../../domain/checkout';
import { newIdempotencyKey } from '../../domain/payment/contracts';
import { hasZones, isPickupOffered } from '../../domain/delivery';
import { isEnabled } from '../../lib/flags';

export interface CheckoutFormProps {
  /** Injected. The form never touches an adapter. [R-13] */
  onPlaceOrder(input: CheckoutInput, idempotencyKey: string): Promise<void>;
  revalidate(): Promise<RevalidationResult>;
  submission: SubmissionState;
}

export function CheckoutForm({ onPlaceOrder, revalidate, submission }: CheckoutFormProps) {
  const { deliveryConfig, isEmpty, replaceLines } = useCart();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drift, setDrift] = useState<RevalidationResult | null>(null);

  /**
   * ⚠ THE FIRST OF TWO DOUBLE-SUBMIT GUARDS, AND THE ONE THAT ACTUALLY WORKS.
   *
   *   A `useState` flag is NOT sufficient. On a slow handset a double-tap can
   *   fire two submit handlers before React has re-rendered with the disabled
   *   button — the second tap reads a stale `false` and sails straight through.
   *
   *   A ref flips SYNCHRONOUSLY, in the same tick, outside the render cycle.
   *
   *   ⚠ AND IT IS STILL NOT ENOUGH. It only protects THIS tab. The second layer
   *     is the idempotency key, which protects the SERVER — from this tab, from
   *     a second tab, and from an automatic retry after a dropped connection.
   *     Two layers, because the first one will leak.
   */
  const inFlight = useRef(false);
  const idemKey = useRef<string | null>(null);

  const [form, setForm] = useState<CheckoutInput>({
    contact: { fullName: '', phone: '', email: '', createAccount: false },
    fulfilment: {
      method: 'delivery',
      address: {
        recipientName: '',
        recipientPhone: '',
        zoneId: '',
        estate: '',
        building: '',
        landmark: '',
        instructions: '',
      },
    },
    paymentMethod: 'mpesa',
    mpesaPhone: '',
    orderNotes: '',
    acceptedTerms: false as unknown as true,
  });

  const set = <K extends keyof CheckoutInput>(k: K, v: CheckoutInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setContact = (patch: Partial<CheckoutInput['contact']>) =>
    setForm((f) => ({ ...f, contact: { ...f.contact, ...patch } }));

  const setAddress = (patch: Record<string, string>) =>
    setForm((f) => ({
      ...f,
      fulfilment:
        f.fulfilment.method === 'delivery'
          ? { ...f.fulfilment, address: { ...f.fulfilment.address, ...patch } }
          : f.fulfilment,
    }));

  const address =
    form.fulfilment.method === 'delivery' ? form.fulfilment.address : null;

  /* ---------------- submit ---------------- */

  const submit = useCallback(async () => {
    // ⚠ SYNCHRONOUS. Before any await. This is the whole point of the ref.
    if (inFlight.current) return;
    if (!canSubmit(submission)) return;
    inFlight.current = true;

    try {
      setErrors({});

      /**
       * ⚠ REVALIDATE BEFORE TAKING A SHILLING.
       *
       *   The cart may have been sitting in a backgrounded tab for an hour. The
       *   price may have moved, the stock may be gone, the coupon may have died.
       *   We check, and if anything BLOCKING changed we STOP and show them —
       *   rather than charging a price they never agreed to. [F-53]
       */
      const check = await revalidate();

      if (check.requiresAcknowledgement) {
        setDrift(check);
        replaceLines(check.lines);
        inFlight.current = false;
        return; // ⚠ The customer must look before we proceed.
      }

      const parsed = validateCheckout(form);
      if (!parsed.ok) {
        const map: Record<string, string> = {};
        for (const e of parsed.error) map[e.field] = e.message;
        setErrors(map);
        inFlight.current = false;

        // Move focus to the first problem — a thumb user cannot see the
        // whole form, and a silent validation failure looks like a dead button.
        const firstField = parsed.error[0]?.field.split('.').pop();
        if (firstField) {
          document.getElementById(firstField)?.focus();
        }
        return;
      }

      /**
       * ⚠ THE KEY IS GENERATED ONCE PER ATTEMPT AND REUSED ON RETRY.
       *
       *   If this exact attempt is retried — because the connection dropped and
       *   we do not know whether the request landed — the SAME key goes back up,
       *   and the server returns the ORIGINAL payment instead of creating a
       *   second one.
       */
      idemKey.current ??= newIdempotencyKey();

      await onPlaceOrder(form, idemKey.current);
    } finally {
      inFlight.current = false;
    }
  }, [form, onPlaceOrder, revalidate, submission, replaceLines]);

  const busy = isBusy(submission);
  const err = (f: string) => errors[f];

  /* ---------------- drift gate ---------------- */

  if (drift && drift.requiresAcknowledgement) {
    return (
      <section className="mx-auto max-w-xl rounded-sm border border-terracotta/30 bg-terracotta/[0.04] p-6">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-charcoal">
          Something in your box changed
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/75">
          Please look before we take payment.
        </p>

        <ul className="mt-5 space-y-2">
          {drift.changes.map((c, i) => (
            <li
              key={i}
              className="border-l-2 border-terracotta/40 pl-3 text-sm leading-relaxed text-charcoal/85"
            >
              {cartChangeMessage(c)}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <CartTotals compact />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setDrift(null);
              // ⚠ A NEW key. This is a NEW attempt at a DIFFERENT total.
              idemKey.current = null;
            }}
          >
            That is fine — continue
          </Button>
          <Button variant="secondary" asChild>
            <a href="/cart">Back to your box</a>
          </Button>
        </div>
      </section>
    );
  }

  /* ---------------- form ---------------- */

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-10"
    >
      {/* ---------- contact ---------- */}
      <fieldset className="space-y-5">
        <Legend>Who is this for?</Legend>

        <Field label="Your name" error={err('contact.fullName')}>
          {({ inputId, describedBy }) => (
            <Input
              id={inputId}
              aria-describedby={describedBy}
              value={form.contact.fullName}
              onChange={(e) => setContact({ fullName: e.target.value })}
              autoComplete="name"
              enterKeyHint="next"
              invalid={!!err('contact.fullName')}
            />
          )}
        </Field>

        {/* ⚠ The hint explains WHY we need it. In this market the rider calls,
            and that is a reason a customer will accept. */}
        <Field
          label="Phone number"
          hint="The rider will call this number."
          error={err('contact.phone')}
        >
          {({ inputId, describedBy }) => (
            <PhoneInput
              id={inputId}
              aria-describedby={describedBy}
              value={form.contact.phone}
              onChange={(e) => setContact({ phone: e.target.value })}
              invalid={!!err('contact.phone')}
            />
          )}
        </Field>

        {/* ⚠ OPTIONAL, and labelled as such. Phone is the identity here, not email. */}
        <Field label="Email (optional)" error={err('contact.email')}>
          {({ inputId, describedBy }) => (
            <Input
              id={inputId}
              aria-describedby={describedBy}
              type="email"
              value={form.contact.email}
              onChange={(e) => setContact({ email: e.target.value })}
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
              invalid={!!err('contact.email')}
            />
          )}
        </Field>
      </fieldset>

      {/* ---------- fulfilment ---------- */}
      <fieldset className="space-y-5">
        <Legend>Where is it going?</Legend>

        {/* ⛔ D-26 — the pickup option only appears if the client has actually
            confirmed a collection point. We do not invent one. */}
        {isPickupOffered(deliveryConfig) && (
          <RadioGroup
            name="method"
            legend="Delivery or collection"
            value={form.fulfilment.method}
            onValueChange={(v) =>
              set(
                'fulfilment',
                v === 'pickup'
                  ? { method: 'pickup', pickupLocationId: deliveryConfig.pickup!.id }
                  : {
                      method: 'delivery',
                      address: {
                        recipientName: '',
                        recipientPhone: '',
                        zoneId: '',
                        estate: '',
                        building: '',
                        landmark: '',
                        instructions: '',
                      },
                    }
              )
            }
            options={[
              { value: 'delivery', label: 'Deliver to me' },
              { value: 'pickup', label: 'I will collect' },
            ]}
          />
        )}

        {form.fulfilment.method === 'delivery' && (
          <>
            {!hasZones(deliveryConfig) ? (
              // ⛔ D-21/22/23 — no zone exists. We say so rather than invent one.
              <div className="rounded-sm border border-dashed border-charcoal/25 bg-charcoal/[0.03] p-4">
                <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/60">
                  Delivery areas — awaiting confirmation
                </p>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/75">
                  Delivery zones and fees have not been confirmed. This checkout
                  cannot be completed until they are.
                </p>
                <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-charcoal/40">
                  Blocked by D-21 / D-22 / D-23
                </p>
              </div>
            ) : (
              <Field label="Delivery area" error={err('fulfilment.address.zoneId')}>
                {({ inputId, describedBy }) => (
                  <Select
                    id={inputId}
                    aria-describedby={describedBy}
                    value={address?.zoneId ?? ''}
                    onChange={(e) => setAddress({ zoneId: e.target.value })}
                    invalid={!!err('fulfilment.address.zoneId')}
                  >
                    <option value="">Choose your area</option>
                    {deliveryConfig.zones
                      .filter((z) => z.active)
                      .map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                  </Select>
                )}
              </Field>
            )}

            <Field
              label="Who receives the box?"
              error={err('fulfilment.address.recipientName')}
            >
              {({ inputId, describedBy }) => (
                <Input
                  id={inputId}
                  aria-describedby={describedBy}
                  value={address?.recipientName ?? ''}
                  onChange={(e) => setAddress({ recipientName: e.target.value })}
                  autoComplete="name"
                  invalid={!!err('fulfilment.address.recipientName')}
                />
              )}
            </Field>

            <Field
              label="Their phone number"
              hint="If it is different from yours."
              error={err('fulfilment.address.recipientPhone')}
            >
              {({ inputId, describedBy }) => (
                <PhoneInput
                  id={inputId}
                  aria-describedby={describedBy}
                  value={address?.recipientPhone ?? ''}
                  onChange={(e) => setAddress({ recipientPhone: e.target.value })}
                  invalid={!!err('fulfilment.address.recipientPhone')}
                />
              )}
            </Field>

            {/**
             * ⚠ ESTATE / BUILDING / LANDMARK — NOT line1 / line2 / postcode.
             *
             *   Nairobi does not navigate by street number. A Western address
             *   form produces addresses that are technically valid and
             *   practically undeliverable.
             */}
            <Field label="Estate or area" error={err('fulfilment.address.estate')}>
              {({ inputId, describedBy }) => (
                <Input
                  id={inputId}
                  aria-describedby={describedBy}
                  value={address?.estate ?? ''}
                  onChange={(e) => setAddress({ estate: e.target.value })}
                  placeholder="Kileleshwa"
                  invalid={!!err('fulfilment.address.estate')}
                />
              )}
            </Field>

            <Field
              label="Building, house or apartment"
              error={err('fulfilment.address.building')}
            >
              {({ inputId, describedBy }) => (
                <Input
                  id={inputId}
                  aria-describedby={describedBy}
                  value={address?.building ?? ''}
                  onChange={(e) => setAddress({ building: e.target.value })}
                  placeholder="Riverside Apartments, Block C, Flat 4"
                  invalid={!!err('fulfilment.address.building')}
                />
              )}
            </Field>

            {/* ⚠ REQUIRED. This is what the rider actually navigates by. */}
            <Field
              label="A landmark nearby"
              hint="The rider will use this to find you."
              error={err('fulfilment.address.landmark')}
            >
              {({ inputId, describedBy }) => (
                <Input
                  id={inputId}
                  aria-describedby={describedBy}
                  value={address?.landmark ?? ''}
                  onChange={(e) => setAddress({ landmark: e.target.value })}
                  placeholder="Opposite the Total petrol station"
                  invalid={!!err('fulfilment.address.landmark')}
                />
              )}
            </Field>

            <Field label="Anything else for the rider? (optional)">
              {({ inputId, describedBy }) => (
                <Textarea
                  id={inputId}
                  aria-describedby={describedBy}
                  rows={2}
                  value={address?.instructions ?? ''}
                  onChange={(e) => setAddress({ instructions: e.target.value })}
                  placeholder="Gate code, which floor, when to call"
                />
              )}
            </Field>
          </>
        )}
      </fieldset>

      {/* ---------- payment ---------- */}
      <fieldset className="space-y-5">
        <Legend>How would you like to pay?</Legend>

        <RadioGroup
          name="paymentMethod"
          legend="Payment method"
          value={form.paymentMethod}
          onValueChange={(v) => set('paymentMethod', v as 'mpesa' | 'card')}
          options={[
            { value: 'mpesa', label: 'M-PESA' },
            /**
             * ⛔ D-35 — THE CARD OPTION IS DISABLED, AND HONESTLY LABELLED.
             *
             *   Stripe may not be able to settle KES for a Kenyan entity. Until
             *   that is confirmed we do not offer a card rail we cannot honour —
             *   an option that fails at the last step is worse than no option.
             */
            {
              value: 'card',
              label: 'Card',
              disabled: !isEnabled('cardPayments'),
              hint: !isEnabled('cardPayments') ? 'Not available yet' : undefined,
            },
          ]}
        />

        {form.paymentMethod === 'mpesa' && (
          <Field
            label="M-PESA number (optional)"
            hint="Leave blank to use the number above."
            error={err('mpesaPhone')}
          >
            {({ inputId, describedBy }) => (
              <PhoneInput
                id={inputId}
                aria-describedby={describedBy}
                value={form.mpesaPhone ?? ''}
                onChange={(e) => set('mpesaPhone', e.target.value)}
                invalid={!!err('mpesaPhone')}
              />
            )}
          </Field>
        )}

        <Field label="Order notes (optional)">
          {({ inputId, describedBy }) => (
            <Textarea
              id={inputId}
              aria-describedby={describedBy}
              rows={2}
              value={form.orderNotes ?? ''}
              onChange={(e) => set('orderNotes', e.target.value)}
            />
          )}
        </Field>
      </fieldset>

      {/* ---------- summary ---------- */}
      <section className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-5">
        <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/60">
          Order summary
        </h2>
        <div className="mt-3">
          <CartTotals />
        </div>
      </section>

      {/* ---------- consent ---------- */}
      {/* ⚠ NEVER pre-ticked. Consent must be an ACTIVE choice. */}
      <Checkbox
        id="acceptedTerms"
        checked={form.acceptedTerms === true}
        onCheckedChange={(v) => set('acceptedTerms', v as unknown as true)}
        label="I accept the terms of sale."
      />
      {err('acceptedTerms') && (
        <p role="alert" className="-mt-6 text-sm text-terracotta">
          {err('acceptedTerms')}
        </p>
      )}

      <div className="space-y-3">
        <Button
          type="submit"
          size="lg"
          fullWidth
          // ⚠ The visual guard. The ref above is the guard that actually holds.
          disabled={busy || isEmpty || !hasZones(deliveryConfig)}
          loading={busy}
        >
          {submission.kind === 'submitting'
            ? 'Placing your order'
            : submission.kind === 'awaiting_payment'
              ? 'Check your phone'
              : 'Place order'}
        </Button>

        {form.paymentMethod === 'mpesa' && (
          <p className="text-center text-xs leading-relaxed text-charcoal/60">
            You will receive an M-PESA request on your phone. Nothing is charged
            until you enter your PIN.
          </p>
        )}

        {submission.kind === 'failed' && (
          <p role="alert" className="text-center text-sm text-terracotta">
            {submission.reason}
          </p>
        )}
      </div>
    </form>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="mb-1 font-[family-name:var(--font-fraunces)] text-xl text-charcoal">
      {children}
    </legend>
  );
}
