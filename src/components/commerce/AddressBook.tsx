'use client';

/**
 * ADDRESS BOOK
 *
 * ⚠ THE SINGLE-DEFAULT INVARIANT IS ENFORCED IN THE DOMAIN, DISPLAYED HERE.
 *   The UI never computes "which is default" or "what happens when I delete the
 *   default" — it calls the domain functions (`withDefaultAddress`, etc.) via
 *   the adapter, and re-reads the list. Two addresses can never both show as
 *   default because the domain won't produce that state. [F-78]
 *
 * ⛔ THE ZONE FIELD IS PRESENT BUT NOT REQUIRED (D-21/22/23).
 *   No delivery zones exist yet, so we cannot force a zone choice. The field is
 *   there for when zones arrive; today it is optional and honestly labelled.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdapters } from './AdapterProvider';
import { Button } from '../primitives/Button';
import { Field, Input, PhoneInput, Textarea } from '../primitives/Form';
import { Dialog } from '../primitives/Overlay';
import { EmptyState } from '../primitives/Surface';
import {
  validateAddress,
  type SavedAddress,
  type AddressInput,
} from '../../domain/identity/customer';
import { type AddressId } from '../../domain/shared';

const EMPTY: AddressInput = {
  label: '', recipientName: '', recipientPhone: '', zoneId: '',
  estate: '', building: '', landmark: '', instructions: '',
};

export function AddressBook() {
  const { addresses } = useAdapters();
  const [book, setBook] = useState<SavedAddress[] | null>(null);
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = useCallback(async () => {
    const list = await addresses.list().catch(() => []);
    setBook([...list]);
  }, [addresses]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const remove = useCallback(
    async (id: AddressId) => {
      await addresses.remove(id);
      void reload();
    },
    [addresses, reload]
  );

  const setDefault = useCallback(
    async (id: AddressId) => {
      await addresses.setDefault(id);
      void reload();
    },
    [addresses, reload]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">Addresses</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          Add address
        </Button>
      </div>

      {book === null ? (
        <div className="space-y-3">
          <div className="h-28 animate-pulse rounded-sm bg-charcoal/5" />
        </div>
      ) : book.length === 0 ? (
        <EmptyState
          title="No saved addresses"
          body="Save an address to make checkout and subscriptions quicker."
          action={<Button variant="secondary" onClick={() => setCreating(true)}>Add your first address</Button>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {book.map((a) => (
            <li key={a.id} className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-[family-name:var(--font-fraunces)] text-base text-charcoal">
                  {a.label}
                </span>
                {a.isDefault && (
                  <span className="rounded-full bg-forest/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-forest">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/75">
                {a.recipientName}
                <br />
                {a.building}, {a.estate}
                <br />
                {a.landmark}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <button
                  onClick={() => setEditing(a)}
                  className="font-[family-name:var(--font-mono)] uppercase tracking-[0.14em] text-charcoal/60 underline underline-offset-4 hover:text-terracotta"
                >
                  Edit
                </button>
                {!a.isDefault && (
                  <button
                    onClick={() => void setDefault(a.id)}
                    className="font-[family-name:var(--font-mono)] uppercase tracking-[0.14em] text-charcoal/60 underline underline-offset-4 hover:text-forest"
                  >
                    Make default
                  </button>
                )}
                <button
                  onClick={() => void remove(a.id)}
                  className="font-[family-name:var(--font-mono)] uppercase tracking-[0.14em] text-charcoal/60 underline underline-offset-4 hover:text-terracotta"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <AddressDialog
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}

function AddressDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: SavedAddress | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { addresses } = useAdapters();
  const [form, setForm] = useState<AddressInput>(
    initial
      ? {
          label: initial.label,
          recipientName: initial.recipientName,
          recipientPhone: initial.recipientPhone,
          zoneId: initial.zoneId,
          estate: initial.estate,
          building: initial.building,
          landmark: initial.landmark,
          instructions: initial.instructions,
        }
      : EMPTY
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof AddressInput, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const err = (f: string) => errors[f];

  const save = useCallback(async () => {
    setBusy(true);
    setErrors({});
    // ⛔ requireZone:false — no zones exist yet (D-21/22/23).
    const parsed = validateAddress(form, { requireZone: false });
    if (!parsed.ok) {
      const map: Record<string, string> = {};
      for (const e of parsed.error) map[e.field] = e.message;
      setErrors(map);
      setBusy(false);
      return;
    }
    const res = initial
      ? await addresses.update(initial.id, parsed.value)
      : await addresses.add(parsed.value);
    setBusy(false);
    if (res.ok) onSaved();
  }, [form, initial, addresses, onSaved]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={initial ? 'Edit address' : 'Add address'}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="space-y-5"
      >
        <Field label="Name for this address" hint='Like "Home" or "Office".' error={err('label')}>
          {({ inputId, describedBy }) => (
            <Input id={inputId} aria-describedby={describedBy} value={form.label}
              onChange={(e) => set('label', e.target.value)} invalid={!!err('label')} />
          )}
        </Field>

        <Field label="Who receives the box?" error={err('recipientName')}>
          {({ inputId, describedBy }) => (
            <Input id={inputId} aria-describedby={describedBy} autoComplete="name" value={form.recipientName}
              onChange={(e) => set('recipientName', e.target.value)} invalid={!!err('recipientName')} />
          )}
        </Field>

        <Field label="Their phone number" error={err('recipientPhone')}>
          {({ inputId, describedBy }) => (
            <PhoneInput id={inputId} aria-describedby={describedBy} value={form.recipientPhone}
              onChange={(e) => set('recipientPhone', e.target.value)} invalid={!!err('recipientPhone')} />
          )}
        </Field>

        <Field label="Estate or area" error={err('estate')}>
          {({ inputId, describedBy }) => (
            <Input id={inputId} aria-describedby={describedBy} value={form.estate} placeholder="Kileleshwa"
              onChange={(e) => set('estate', e.target.value)} invalid={!!err('estate')} />
          )}
        </Field>

        <Field label="Building, house or apartment" error={err('building')}>
          {({ inputId, describedBy }) => (
            <Input id={inputId} aria-describedby={describedBy} value={form.building}
              placeholder="Riverside Apartments, Block C, Flat 4"
              onChange={(e) => set('building', e.target.value)} invalid={!!err('building')} />
          )}
        </Field>

        <Field label="A landmark nearby" hint="The rider will use this to find you." error={err('landmark')}>
          {({ inputId, describedBy }) => (
            <Input id={inputId} aria-describedby={describedBy} value={form.landmark}
              placeholder="Opposite the Total petrol station"
              onChange={(e) => set('landmark', e.target.value)} invalid={!!err('landmark')} />
          )}
        </Field>

        <Field label="Anything else for the rider? (optional)">
          {({ inputId, describedBy }) => (
            <Textarea id={inputId} aria-describedby={describedBy} rows={2} value={form.instructions}
              onChange={(e) => set('instructions', e.target.value)} placeholder="Gate code, which floor, when to call" />
          )}
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={busy}>
            {initial ? 'Save changes' : 'Add address'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
