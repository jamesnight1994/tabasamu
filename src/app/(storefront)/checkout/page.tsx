'use client';

/**
 * CHECKOUT PAGE — THE ORCHESTRATOR
 *
 * ⚠ THE ONLY PLACE THE PAYMENT SEQUENCE IS ASSEMBLED. Read the order of
 *   operations carefully, because every step exists to prevent a specific way of
 *   taking a customer's money and giving them nothing:
 *
 *     1. REVALIDATE   — the cart may be stale (price moved, stock gone)
 *     2. CREATE ORDER — guarded by an idempotency key (double-tap → ONE order)
 *     3. STK PUSH     — returns an ACKNOWLEDGEMENT, not a result
 *     4. POLL         — the server is the authority, never this page
 *     5. RESOLVE      — succeeded / failed / ⚠ unknown
 *
 * ⚠ STEP 3 IS THE ONE EVERYONE GETS WRONG. Safaricom returns HTTP 200 the moment
 *   it ACCEPTS the push — before a PIN is typed, and whether or not one ever is.
 *   Nothing on this page treats that response as payment.
 */

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';

import { CheckoutForm } from '../../../components/commerce/CheckoutForm';
import { PaymentStatusScreen } from '../../../components/commerce/PaymentStatus';
import { useCart } from '../../../components/commerce/CartProvider';
import { useAdapters } from '../../../components/commerce/AdapterProvider';
import { Button } from '../../../components/primitives/Button';
import { EmptyState } from '../../../components/primitives/Surface';

import {
  validateCheckout,
  stkPhoneFor,
  type SubmissionState,
  type CheckoutInput,
} from '../../../domain/checkout';
import { idempotencyKey, paymentErrorMessage } from '../../../domain/payment/contracts';
import type { E164Phone } from '../../../domain/identity/phone';
import { logger } from '../../../lib/logger';
import { NoIndex } from '../../../components/seo/NoIndex';

export default function CheckoutPage() {
  const adapters = useAdapters();
  const cart = useCart();

  const [submission, setSubmission] = useState<SubmissionState>({ kind: 'idle' });
  const [providerRef, setProviderRef] = useState<string | null>(null);
  const [phone, setPhone] = useState<E164Phone | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | undefined>();

  /* ---------------- revalidate ---------------- */

  const revalidate = useCallback(
    () => adapters.checkout.revalidate(cart.cartId as never),
    [adapters, cart.cartId]
  );

  /* ---------------- place order ---------------- */

  const placeOrder = useCallback(
    async (input: CheckoutInput, key: string) => {
      const parsed = validateCheckout(input);
      if (!parsed.ok) {
        setSubmission({ kind: 'failed', reason: 'Please check the form.', retryable: true });
        return;
      }
      const checkout = parsed.value;

      setSubmission({ kind: 'submitting', idempotencyKey: key });

      try {
        /* ---- 2. create the order ---- */
        const order = await adapters.checkout.createOrder(
          cart.cartId as never,
          checkout,
          idempotencyKey(key)
        );

        if (!order.ok) {
          // ⚠ A stale cart is RETRYABLE — the form re-runs revalidation and
          //   shows the customer what moved, rather than dead-ending them.
          setSubmission({
            kind: 'failed',
            reason: paymentErrorMessage(order.error),
            retryable: true,
          });
          return;
        }

        setOrderNumber(order.value.number);

        /* ---- 3. initiate payment ---- */
        const stkPhone = stkPhoneFor(checkout);
        setPhone(stkPhone);

        const init = await adapters.payments.initiate({
          orderId: order.value.id,
          amount: order.value.totals.subtotal,
          provider: checkout.paymentMethod,
          phone: checkout.paymentMethod === 'mpesa' ? stkPhone : undefined,
          // ⚠ THE SAME KEY the order was created with. A retry of this exact
          //   attempt reaches the SAME payment, not a second STK push.
          idempotencyKey: idempotencyKey(key),
        });

        if (!init.ok) {
          setSubmission({
            kind: 'failed',
            reason: paymentErrorMessage(init.error),
            retryable: init.error.kind !== 'provider_not_configured',
          });
          return;
        }

        /**
         * ⚠ NOTE WHAT WE DO **NOT** DO HERE.
         *
         *   We do not clear the cart. We do not show a receipt. We do not mark
         *   the order paid. The response we just received says only that
         *   Safaricom ACCEPTED the request — the customer has not touched their
         *   phone yet.
         *
         *   We move to `awaiting_payment` and we ASK THE SERVER, repeatedly,
         *   what actually happened. [R-10, F-58]
         */
        setProviderRef(init.value.providerRef);
        setSubmission({
          kind: 'awaiting_payment',
          providerRef: init.value.providerRef,
          paymentId: init.value.paymentId,
        });

        if (init.value.replayed) {
          // The customer double-tapped. There is already a prompt on their phone.
          logger.info('checkout.initiate.replayed', { providerRef: init.value.providerRef });
        }
      } catch (e) {
        /**
         * ⚠ A THROWN NETWORK ERROR IS **NOT** A FAILED PAYMENT.
         *
         *   The request may well have landed and the STK push may already be on
         *   the customer's handset. We say the honest thing — that we could not
         *   reach the service — and the idempotency key makes the retry safe.
         */
        logger.error('checkout.failed', { error: String(e) });
        setSubmission({
          kind: 'failed',
          reason: 'We could not reach the payment service. Your box is still here.',
          retryable: true,
        });
      }
    },
    [adapters, cart.cartId]
  );

  /* ---------------- status polling ---------------- */

  const fetchStatus = useCallback(
    async (ref: string) => {
      const r = await adapters.payments.status(ref);
      return r.ok ? r.value : null;
    },
    [adapters]
  );

  const retry = useCallback(() => {
    setProviderRef(null);
    setSubmission({ kind: 'idle' });
  }, []);

  /* ---------------- render ---------------- */

  const showPaymentScreen = submission.kind === 'awaiting_payment' && providerRef && phone;

  const content = useMemo(() => {
    if (showPaymentScreen) {
      return (
        <PaymentStatusScreen
          providerRef={providerRef!}
          phone={phone!}
          fetchStatus={fetchStatus}
          onRetry={retry}
          orderNumber={orderNumber}
        />
      );
    }

    if (cart.isEmpty && !cart.hydrating) {
      return (
        <EmptyState
          title="Your box is empty."
          body="There is nothing to check out yet."
          action={
            <Button variant="secondary" asChild>
              <Link href="/shop">See the flavours</Link>
            </Button>
          }
        />
      );
    }

    return (
      <CheckoutForm
        onPlaceOrder={placeOrder}
        revalidate={revalidate}
        submission={submission}
      />
    );
  }, [
    showPaymentScreen,
    providerRef,
    phone,
    fetchStatus,
    retry,
    orderNumber,
    cart.isEmpty,
    cart.hydrating,
    placeOrder,
    revalidate,
    submission,
  ]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-6 sm:py-16">
      <NoIndex />
      {!showPaymentScreen && (
        <h1 className="mb-10 font-[family-name:var(--font-fraunces)] text-3xl text-charcoal sm:text-4xl">
          Checkout
        </h1>
      )}
      {content}
    </div>
  );
}
