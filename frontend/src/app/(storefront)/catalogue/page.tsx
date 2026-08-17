'use client';

/**
 * COMPONENT CATALOGUE
 *
 * The Storybook-equivalent. A route rather than a separate Storybook install,
 * deliberately: it renders inside the REAL app, with the REAL fonts, the REAL
 * tokens and the REAL CSS cascade. A component that passes in an isolated
 * Storybook iframe and then breaks in the app has taught us nothing.
 *
 * It is `noindex`, and it is excluded from the production build by
 * `NEXT_PUBLIC_APP_ENV=production` (see `notFound()` below).
 */

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { Button } from '../../../components/primitives/Button';
import {
  Field,
  Input,
  PhoneInput,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
  QuantityControl,
  FormError,
} from '../../../components/primitives/Form';
import {
  Card,
  Badge,
  SectionHeader,
  EditorialQuote,
  Breadcrumbs,
  Skeleton,
  SkeletonText,
  EmptyState,
  ErrorState,
  Pagination,
} from '../../../components/primitives/Surface';
import { Dialog, Drawer, Tabs, Accordion, Toast } from '../../../components/primitives/Overlay';
import {
  PriceDisplay,
  FlavourSwatch,
  StockStatusDisplay,
  PendingValue,
} from '../../../components/commerce/Price';
import { Logo } from '../../../components/primitives/Logo';
import { FLAVOUR_STRIPS, unavailable } from '../../../domain/catalogue';
import { fromMajor } from '../../../domain/shared';
import { CONTRAST_LEDGER } from '../../../tokens/tokens';
import { clientEnv } from '../../../lib/config/env';

function Spec({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-[--color-border] py-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-[length:--text-h3]">{title}</h2>
        {note && <p className="measure text-[length:--text-small] text-[--color-ink-muted]">{note}</p>}
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-4">{children}</div>;
}

export default function CataloguePage() {
  // Not shipped to production.
  if (clientEnv().NEXT_PUBLIC_APP_ENV === 'production') notFound();

  const [qty, setQty] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [radio, setRadio] = useState('mpesa');
  const [switched, setSwitched] = useState(false);

  return (
    <div className="mx-auto max-w-[--container-wide] px-4 py-16 md:px-8">
      <SectionHeader
        as="h1"
        eyebrow="Phase 2"
        title="Component catalogue"
        intro="Every foundation primitive, rendered in the real app with the real tokens. Resize the window — everything here is authored at 360px first."
        className="mb-8"
      />

      {/* ---------------- LOGO ---------------- */}
      <Spec
        title="Logo"
        note="Approved brand artwork (2026-07-15). Full logo + coloured monogram on light (cream) fields; white monogram on approved dark surfaces. There is no approved reversed full lockup — dark surfaces use the white monogram."
      >
        <Row>
          <div className="rounded-[--radius-md] bg-[--color-canvas] p-6">
            <Logo variant="full" width={220} />
          </div>
          <div className="rounded-[--radius-md] bg-[--color-canvas] p-6">
            <Logo variant="monogram" width={56} />
          </div>
        </Row>
        <Row>
          <div className="rounded-[--radius-md] bg-[--color-action] p-6" data-ground="dark">
            <Logo variant="monogram" tone="dark" width={56} />
          </div>
          <div className="rounded-[--radius-md] bg-[--color-accent] p-6" data-ground="dark">
            <Logo variant="monogram" tone="dark" width={56} />
          </div>
          <div className="rounded-[--radius-md] bg-[--color-link] p-6" data-ground="dark">
            <Logo variant="monogram" tone="dark" width={56} />
          </div>
        </Row>
      </Spec>

      {/* ---------------- COLOUR ---------------- */}
      <Spec
        title="Colour & contrast ledger"
        note="Audited, not assumed. `npm run lint:contrast` recomputes every pair and fails CI on a violation."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-[--color-border]">
                <th className="label-caps py-2 text-[--color-ink-muted]">Pair</th>
                <th className="label-caps py-2 text-[--color-ink-muted]">Ratio</th>
                <th className="label-caps py-2 text-[--color-ink-muted]">Use</th>
                <th className="label-caps py-2 text-[--color-ink-muted]">Result</th>
              </tr>
            </thead>
            <tbody>
              {CONTRAST_LEDGER.map((c) => (
                <tr key={c.use} className="border-b border-[--color-border]">
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="grid size-8 place-items-center rounded-[--radius-sm] font-mono text-[length:--text-micro]"
                        style={{ background: c.bg, color: c.fg }}
                      >
                        Aa
                      </span>
                    </span>
                  </td>
                  <td className="spec-mono py-3">{c.ratio.toFixed(2)}:1</td>
                  <td className="py-3 text-[length:--text-caption] text-[--color-ink-muted]">
                    {c.use}
                  </td>
                  <td className="py-3">
                    <Badge tone={c.pass === 'FAIL' ? 'error' : 'success'}>{c.pass}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Spec>

      {/* ---------------- TYPE ---------------- */}
      <Spec title="Typography" note="Fraunces for display. DM Sans for interface. JetBrains Mono for the spec register only.">
        <h1>Feel the shift from within.</h1>
        <h2>A controlled conversation.</h2>
        <h3>The visible world.</h3>
        <p className="measure">
          Tabasamu Sips was born in a Nairobi kitchen, brewed for friends, refined over months of
          fermenting in batches small enough that every bottle could be tasted before it left the
          door.
        </p>
        <p className="label-caps text-[--color-ink-muted]">Premium · Kenyan · Kombucha</p>
        <p className="spec-mono">TS-PINEAP-1L · #C05A2C · Batch 0472</p>
        <EditorialQuote>Rooted in the soil, crafted for the soul.</EditorialQuote>
      </Spec>

      {/* ---------------- BUTTONS ---------------- */}
      <Spec
        title="Buttons"
        note="⚠ D-04(a), client-authorised: PRIMARY is charcoal/cream (12.87:1). Terracotta is the SECONDARY/outline CTA. The solid `accent` variant is 4.14:1 and is force-upgraded to `lg` at runtime, because it only meets AA at large-text sizes."
      >
        <Row>
          <Button variant="primary">Add to box</Button>
          <Button variant="secondary">Learn more</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Remove</Button>
        </Row>
        <Row>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button variant="accent">Accent (forced to lg)</Button>
        </Row>
        <Button fullWidth>Full width — the mobile CTA</Button>
      </Spec>

      {/* ---------------- FORMS ---------------- */}
      <Spec title="Form controls" note="Every field has a real label. Errors are wired with aria-describedby and are never colour-only.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Full name" required>
            {({ inputId, describedBy }) => (
              <Input id={inputId} aria-describedby={describedBy} placeholder="Amina Wanjiru" />
            )}
          </Field>

          <Field
            label="Phone number"
            required
            hint="The rider will call this number."
            error="That does not look like a Kenyan mobile number."
          >
            {({ inputId, describedBy }) => (
              <PhoneInput id={inputId} aria-describedby={describedBy} invalid />
            )}
          </Field>

          <Field label="Delivery area" hint="⛔ D-21 — zones not supplied.">
            {({ inputId, describedBy }) => (
              <Select id={inputId} aria-describedby={describedBy} placeholder="Awaiting zones" disabled>
                <option value="">—</option>
              </Select>
            )}
          </Field>

          <Field label="Delivery instructions">
            {({ inputId, describedBy }) => (
              <Textarea id={inputId} aria-describedby={describedBy} placeholder="Gate colour, landmark, floor…" />
            )}
          </Field>
        </div>

        <Checkbox label="This is a gift" hint="The packing slip will carry no pricing." checked={checked} onCheckedChange={setChecked} />

        <RadioGroup
          name="payment"
          legend="Payment method"
          value={radio}
          onValueChange={setRadio}
          options={[
            { value: 'mpesa', label: 'M-PESA', hint: 'You will get a prompt on your phone.' },
            { value: 'card', label: 'Card', hint: '⛔ D-35 — the card rail may not be viable.', disabled: true },
          ]}
        />

        <Switch label="Send SMS updates" hint="⛔ D-41 — SMS provider not chosen." checked={switched} onCheckedChange={setSwitched} />

        <Row>
          <QuantityControl value={qty} onChange={setQty} itemName="Pineapple Ginger" />
          <FormError>Some details need another look.</FormError>
        </Row>
      </Spec>

      {/* ---------------- COMMERCE ---------------- */}
      <Spec
        title="Commerce primitives"
        note="⚠ The 'indicative' marker on every price is deliberate. No price has been approved (D-14), and a placeholder that looks real WILL end up in a screenshot someone believes."
      >
        <Row>
          <PriceDisplay price={fromMajor(550)} size="lg" />
          <PriceDisplay price={fromMajor(550)} compareAt={fromMajor(650)} />
          <PriceDisplay price={unavailable('D-14', 'No approved price exists.')} />
        </Row>

        <div>
          <p className="label-caps mb-3 text-[--color-ink-muted]">
            Flavour swatches — the ONLY legal use of an off-palette strip hex
          </p>
          <div className="flex flex-wrap gap-4">
            {Object.values(FLAVOUR_STRIPS).map((s) => (
              <FlavourSwatch key={s.label} strip={s} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <StockStatusDisplay status={{ kind: 'in_stock' }} />
          <StockStatusDisplay status={{ kind: 'low_stock', remaining: 2 }} />
          <StockStatusDisplay status={{ kind: 'next_batch', date: '2026-08-02' }} />
          <StockStatusDisplay status={{ kind: 'out_of_stock' }} />
        </div>

        <Row>
          <PendingValue value={unavailable('D-05', 'Regulated food information, not supplied.')} />
          <PendingValue value={unavailable('D-50', 'Rooibos or hibiscus?')} />
        </Row>
      </Spec>

      {/* ---------------- SURFACES ---------------- */}
      <Spec title="Surfaces & feedback">
        <Row>
          <Badge>Neutral</Badge>
          <Badge tone="success">In stock</Badge>
          <Badge tone="warning">Blocked</Badge>
          <Badge tone="error">Failed</Badge>
          <Badge tone="info">Info</Badge>
        </Row>

        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: 'Pineapple Ginger' }]} />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5"><SkeletonText lines={3} /></Card>
          <Card className="p-5"><Skeleton className="h-24" /></Card>
          <Card elevation="raised" className="p-5">
            <p className="text-[length:--text-small] text-[--color-ink-muted]">Raised card</p>
          </Card>
        </div>

        <Card><EmptyState title="Your box is empty." body="Nothing here yet." /></Card>
        <Card><ErrorState body="We could not reach the network. Check your connection and try again." /></Card>

        <Pagination currentPage={2} totalPages={4} hrefFor={(p) => `?page=${p}`} />
      </Spec>

      {/* ---------------- OVERLAYS ---------------- */}
      <Spec title="Overlays & disclosure" note="Focus trapping, focus restoration and scroll locking are handled by Radix. Test them with the keyboard.">
        <Row>
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>Open dialog</Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open drawer</Button>
          <Button variant="secondary" onClick={() => setToastOpen(true)}>Show toast</Button>
        </Row>

        <Tabs
          items={[
            { value: 'a', label: 'Tasting note', content: <p className="measure">Pineapple, warm ginger.</p> },
            { value: 'b', label: 'Ingredients', content: <PendingValue value={unavailable('D-05', 'Regulated.')} /> },
            { value: 'c', label: 'Delivery', content: <PendingValue value={unavailable('D-21', 'Zones not supplied.')} /> },
          ]}
        />

        <Accordion
          items={[
            { value: '1', trigger: 'How is it brewed?', content: <PendingValue value={unavailable('D-52', 'Six days or fourteen? The sources disagree.')} /> },
            { value: '2', trigger: 'Where do you deliver?', content: <PendingValue value={unavailable('D-21', 'Zones not supplied.')} /> },
          ]}
        />

        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Remove this from your box?"
          description="It will stay in the shop if you change your mind."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Keep it</Button>
              <Button variant="destructive" onClick={() => setDialogOpen(false)}>Remove</Button>
            </>
          }
        >
          <p className="text-[--color-ink-muted]">One bottle of Pineapple Ginger, 1 Litre.</p>
        </Dialog>

        <Drawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title="Your box"
          footer={<Button fullWidth>Checkout</Button>}
        >
          <p className="text-[--color-ink-muted]">Full width at 360px. A panel from md up.</p>
        </Drawer>

        <Toast
          open={toastOpen}
          onOpenChange={setToastOpen}
          tone="success"
          title="Added to your box"
          description="Pineapple Ginger, 1 Litre."
        />
      </Spec>
    </div>
  );
}
