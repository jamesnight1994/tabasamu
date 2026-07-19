'use client';

/**
 * ADMIN SCREENS — Inventory, Promotions, Staff
 *
 * Each screen reads through the admin adapter, gates mutations behind `Gate`,
 * confirms consequential actions, and relies on the adapter to write the audit
 * event. The UI never writes audit itself — it calls the action.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdmin, useStaff, Gate } from './AdminProvider';
import {
  PageHeader, Table, Row, Cell, Badge, AdminButton, ConfirmDialog, useConfirm, Notice,
} from './kit';
import {
  type StockMovement, type StockReasonCode, STOCK_REASON_CODES, reasonLabel,
  onHandFromMovements, adjustmentErrorMessage, validateAdjustment,
} from '../../domain/admin/stock-movement';
import {
  type Promotion, type PromotionInput, promotionStatus, promotionStatusCopy,
  promotionValueLabel, usageSummary, validatePromotion,
} from '../../domain/admin/promotions';
import {
  type StaffMember, type Role, ROLES, roleLabel, roleDescription, permissionsForRole,
} from '../../domain/admin/rbac';
import type { VariantId } from '../../domain/shared';

/* ================================================================== *
 * INVENTORY
 * ================================================================== */

const DEMO_VARIANTS = [
  { id: 'var_passion_1l', name: 'Passion' },
  { id: 'var_pineapple_1l', name: 'Pineapple' },
  { id: 'var_grape_ginger_1l', name: 'Grape Ginger' },
];

export function AdminInventory() {
  const admin = useAdmin();
  const [selected, setSelected] = useState(DEMO_VARIANTS[0].id);
  const [movements, setMovements] = useState<readonly StockMovement[]>([]);

  const load = useCallback(async () => {
    const m = await admin.adminInventory.movements(selected as VariantId);
    setMovements(m);
  }, [admin, selected]);

  useEffect(() => { void load(); }, [load]);

  const onHand = onHandFromMovements(movements);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Stock is a history of movements, never a silent edit. Every change carries a reason."
        actions={
          <Gate permission="inventory.export">
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={async () => {
                const r = await admin.adminInventory.exportCsv();
                if (r.ok) downloadCsv(r.value, 'inventory.csv');
              }}
            >
              Export CSV
            </AdminButton>
          </Gate>
        }
      />

      <div className="flex flex-wrap gap-2">
        {DEMO_VARIANTS.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelected(v.id)}
            className={[
              'rounded-sm px-3 py-1.5 text-sm transition-colors',
              selected === v.id ? 'bg-charcoal text-cream' : 'border border-charcoal/20 text-charcoal/70 hover:bg-charcoal/[0.04]',
            ].join(' ')}
          >
            {v.name}
          </button>
        ))}
      </div>

      <div className="flex items-baseline gap-4">
        <span className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">{onHand}</span>
        <span className="text-sm text-charcoal/60">on hand</span>
      </div>

      <Gate permission="inventory.adjust" fallback={<Notice>You have read-only access to inventory.</Notice>}>
        <AdjustForm variantId={selected} currentOnHand={onHand} onDone={load} />
      </Gate>

      <div>
        <h2 className="mb-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-charcoal/55">
          Movement history
        </h2>
        <Table head={['When', 'Change', 'Reason', 'Note', 'By', 'Balance']}>
          {movements.map((m) => (
            <Row key={m.id}>
              <Cell mono>{new Date(m.at).toLocaleDateString()}</Cell>
              <Cell mono>
                <span className={m.delta > 0 ? 'text-forest' : 'text-terracotta'}>
                  {m.delta > 0 ? '+' : ''}{m.delta}
                </span>
              </Cell>
              <Cell>{reasonLabel(m.reason)}</Cell>
              <Cell>{m.note || '—'}</Cell>
              <Cell>{m.actorName}</Cell>
              <Cell mono>{m.balanceAfter}</Cell>
            </Row>
          ))}
        </Table>
      </div>
    </div>
  );
}

function AdjustForm({ variantId, currentOnHand, onDone }: { variantId: string; currentOnHand: number; onDone: () => void }) {
  const admin = useAdmin();
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState<StockReasonCode>('received');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    const d = parseInt(delta, 10);
    if (Number.isNaN(d)) { setError('Enter a number.'); return; }
    const input = { variantId: variantId as VariantId, delta: d, reason, note };
    const valid = validateAdjustment(input, currentOnHand);
    if (!valid.ok) { setError(adjustmentErrorMessage(valid.error)); return; }
    setBusy(true);
    const r = await admin.adminInventory.adjust(input);
    setBusy(false);
    if (r.ok) { setDelta(''); setNote(''); onDone(); }
    else setError(r.error.message ?? 'Could not adjust stock.');
  };

  return (
    <div className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-4">
      <h3 className="mb-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-charcoal/55">
        Adjust stock
      </h3>
      <div className="grid gap-3 sm:grid-cols-[100px_1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block text-xs text-charcoal/60">Change (±)</span>
          <input value={delta} onChange={(e) => setDelta(e.target.value)} inputMode="numeric" placeholder="+48"
            className="w-full rounded-sm border border-charcoal/20 bg-cream px-2 py-1.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-charcoal/60">Reason</span>
          <select value={reason} onChange={(e) => setReason(e.target.value as StockReasonCode)}
            className="w-full rounded-sm border border-charcoal/20 bg-cream px-2 py-1.5 text-sm">
            {STOCK_REASON_CODES.map((c) => <option key={c} value={c}>{reasonLabel(c)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-charcoal/60">Note</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Batch reference, reason…"
            className="w-full rounded-sm border border-charcoal/20 bg-cream px-2 py-1.5 text-sm" />
        </label>
        <AdminButton onClick={submit} disabled={busy}>Record</AdminButton>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-terracotta">{error}</p>}
    </div>
  );
}

/* ================================================================== *
 * PROMOTIONS
 * ================================================================== */

export function AdminPromotions() {
  const admin = useAdmin();
  const [promotions, setPromotions] = useState<readonly Promotion[]>([]);
  const [creating, setCreating] = useState(false);
  const confirm = useConfirm();

  const load = useCallback(async () => setPromotions(await admin.promotions.list()), [admin]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions"
        description="Discount codes with restrictions, limits and date windows."
        actions={
          <Gate permission="promotion.create">
            <AdminButton size="sm" onClick={() => setCreating(true)}>New promotion</AdminButton>
          </Gate>
        }
      />

      <Table head={['Code', 'Value', 'Status', 'Usage', 'Window', '']}>
        {promotions.map((p) => {
          const status = promotionStatus(p);
          const copy = promotionStatusCopy(status);
          return (
            <Row key={p.id}>
              <Cell mono>{p.code}</Cell>
              <Cell>{promotionValueLabel(p)}</Cell>
              <Cell><Badge tone={copy.tone}>{copy.label}</Badge></Cell>
              <Cell mono>{usageSummary(p)}</Cell>
              <Cell mono>
                {p.endsAt ? `until ${new Date(p.endsAt).toLocaleDateString()}` : 'open-ended'}
              </Cell>
              <Cell>
                {p.active && (
                  <Gate permission="promotion.deactivate">
                    <AdminButton variant="ghost" size="sm"
                      onClick={() => confirm.ask(async () => { await admin.promotions.deactivate(p.id); void load(); })}>
                      Deactivate
                    </AdminButton>
                  </Gate>
                )}
              </Cell>
            </Row>
          );
        })}
      </Table>

      {creating && <PromotionForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); void load(); }} />}

      <ConfirmDialog
        open={confirm.isOpen}
        title="Deactivate this promotion?"
        body="Customers will no longer be able to use this code. You can create a new one later — this is reversible."
        confirmLabel="Deactivate"
        onConfirm={confirm.confirm}
        onCancel={confirm.cancel}
      />
    </div>
  );
}

function PromotionForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const admin = useAdmin();
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed' | 'free_delivery'>('percentage');
  const [value, setValue] = useState('10');
  const [usageLimit, setUsageLimit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErrors({});
    const input: PromotionInput = {
      code, type, value: parseInt(value, 10) || 0,
      productRestriction: [], customerRestriction: [], minimumSpend: null,
      startsAt: null, endsAt: null,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : null, perCustomerLimit: null, active: true,
    };
    const valid = validatePromotion(input);
    if (!valid.ok) {
      const map: Record<string, string> = {};
      for (const e of valid.error) map[e.field] = e.message;
      setErrors(map);
      return;
    }
    setBusy(true);
    const r = await admin.promotions.create(valid.value);
    setBusy(false);
    if (r.ok) onSaved();
    else setErrors({ code: r.error.message ?? 'Could not create.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
      <div className="w-full max-w-md rounded-sm border border-charcoal/15 bg-cream p-5">
        <h2 className="font-[family-name:var(--font-fraunces)] text-lg text-charcoal">New promotion</h2>
        <div className="mt-4 space-y-3">
          <Labelled label="Code" error={errors.code}>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10"
              autoCapitalize="characters" className="w-full rounded-sm border border-charcoal/20 bg-cream px-2 py-1.5 text-sm" />
          </Labelled>
          <Labelled label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full rounded-sm border border-charcoal/20 bg-cream px-2 py-1.5 text-sm">
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
              <option value="free_delivery">Free delivery</option>
            </select>
          </Labelled>
          {type !== 'free_delivery' && (
            <Labelled label={type === 'percentage' ? 'Percent' : 'Amount (minor units)'} error={errors.value}>
              <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="numeric"
                className="w-full rounded-sm border border-charcoal/20 bg-cream px-2 py-1.5 text-sm" />
            </Labelled>
          )}
          <Labelled label="Usage limit (optional)" error={errors.usageLimit}>
            <input value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} inputMode="numeric" placeholder="Unlimited"
              className="w-full rounded-sm border border-charcoal/20 bg-cream px-2 py-1.5 text-sm" />
          </Labelled>
        </div>
        <div className="mt-5 flex gap-2">
          <AdminButton onClick={submit} disabled={busy}>Create</AdminButton>
          <AdminButton variant="ghost" onClick={onClose}>Cancel</AdminButton>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * STAFF
 * ================================================================== */

export function AdminStaff() {
  const admin = useAdmin();
  const { staff: me } = useStaff();
  const [staff, setStaff] = useState<readonly StaffMember[]>([]);
  const [showRoles, setShowRoles] = useState(false);

  const load = useCallback(async () => setStaff(await admin.staff.list()), [admin]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Who can access the admin area, and what they can do."
        actions={<AdminButton variant="secondary" size="sm" onClick={() => setShowRoles((s) => !s)}>
          {showRoles ? 'Hide' : 'Show'} role reference
        </AdminButton>}
      />

      {showRoles && (
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => (
            <div key={r} className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-3">
              <p className="font-medium text-sm text-charcoal">{roleLabel(r)}</p>
              <p className="mt-0.5 text-xs text-charcoal/60">{roleDescription(r)}</p>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-charcoal/45">
                {permissionsForRole(r).length} permissions
              </p>
            </div>
          ))}
        </div>
      )}

      <Table head={['Name', 'Email', 'Role', 'Status', '']}>
        {staff.map((s) => (
          <Row key={s.id}>
            <Cell>{s.name}</Cell>
            <Cell mono>{s.email}</Cell>
            <Cell>
              <Gate permission="staff.manage" fallback={roleLabel(s.role)}>
                <RoleSelect
                  value={s.role}
                  disabled={s.id === me?.id}
                  onChange={async (role) => { await admin.staff.changeRole(s.id, role); void load(); }}
                />
              </Gate>
            </Cell>
            <Cell><Badge tone={s.active ? 'positive' : 'neutral'}>{s.active ? 'Active' : 'Inactive'}</Badge></Cell>
            <Cell>
              {s.active && s.id !== me?.id && (
                <Gate permission="staff.manage">
                  <AdminButton variant="ghost" size="sm"
                    onClick={async () => { await admin.staff.deactivate(s.id); void load(); }}>
                    Deactivate
                  </AdminButton>
                </Gate>
              )}
            </Cell>
          </Row>
        ))}
      </Table>
      {/* ⚠ You cannot change your own role or deactivate yourself — a guard
          against locking the last super admin out. */}
    </div>
  );
}

function RoleSelect({ value, onChange, disabled }: { value: Role; onChange: (r: Role) => void; disabled?: boolean }) {
  return (
    <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as Role)}
      className="rounded-sm border border-charcoal/20 bg-cream px-2 py-1 text-xs disabled:opacity-50">
      {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
    </select>
  );
}

/* ---------------- shared ---------------- */

function Labelled({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-charcoal/60">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-terracotta">{error}</span>}
    </label>
  );
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
