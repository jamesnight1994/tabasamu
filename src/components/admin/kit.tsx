'use client';

/**
 * ADMIN UI KIT
 *
 * Shared primitives for the admin screens. Deliberately plain and dense — this
 * is an operational tool. Everything here uses brand tokens (never off-palette),
 * but the register is calm and utilitarian, not the editorial shopfront.
 */

import { useState, type ReactNode } from 'react';
import { isUnavailable, type Pending } from '../../domain/catalogue';
import { type Money, formatMoney } from '../../domain/shared';

/* ---------------- Page header ---------------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-charcoal/10 pb-4">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-charcoal">{title}</h1>
        {description && <p className="mt-1 text-sm text-charcoal/65">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

/* ---------------- Metric card ---------------- */

export function MetricCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'neutral' | 'positive' | 'attention';
}) {
  const accent =
    tone === 'positive' ? 'text-forest' : tone === 'attention' ? 'text-terracotta' : 'text-charcoal';
  return (
    <div className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-4">
      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-charcoal/50">
        {label}
      </p>
      <p className={`mt-1.5 font-[family-name:var(--font-fraunces)] text-2xl ${accent}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-charcoal/50">{hint}</p>}
    </div>
  );
}

/**
 * ⚠ Renders a Pending<Money> honestly. A blocked value shows the awaiting-
 *   confirmation marker with its decision id — never KES 0. [NN-05]
 */
export function MoneyValue({ value }: { value: Pending<Money> }) {
  if (isUnavailable(value)) {
    return (
      <span className="font-[family-name:var(--font-mono)] text-sm font-normal text-muted-gold" title={value.blockedBy}>
        Awaiting confirmation
      </span>
    );
  }
  return <>{formatMoney(value)}</>;
}

/* ---------------- Table ---------------- */

export function Table({ head, children }: { head: readonly string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-charcoal/12">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-charcoal/12 bg-charcoal/[0.03]">
            {head.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-[family-name:var(--font-mono)] text-[10px] font-normal uppercase tracking-[0.12em] text-charcoal/55"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <tr className="border-b border-charcoal/8 last:border-0 hover:bg-charcoal/[0.02]">{children}</tr>;
}

export function Cell({ children, mono = false }: { children: ReactNode; mono?: boolean }) {
  return (
    <td className={`px-3 py-2.5 align-middle ${mono ? 'font-[family-name:var(--font-mono)] text-xs' : ''}`}>
      {children}
    </td>
  );
}

/* ---------------- Status badge ---------------- */

export function Badge({ tone, children }: { tone: 'positive' | 'neutral' | 'attention'; children: ReactNode }) {
  const cls =
    tone === 'positive'
      ? 'bg-forest/10 text-forest'
      : tone === 'attention'
        ? 'bg-terracotta/10 text-terracotta'
        : 'bg-charcoal/[0.06] text-charcoal/70';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.1em] ${cls}`}>
      {children}
    </span>
  );
}

/* ---------------- Admin button ---------------- */

export function AdminButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const base =
    'inline-flex items-center justify-center rounded-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal';
  const sizes = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm';
  const variants = {
    primary: 'bg-charcoal text-cream hover:bg-charcoal/90',
    secondary: 'border border-charcoal/25 text-charcoal hover:bg-charcoal/[0.04]',
    ghost: 'text-charcoal/70 hover:bg-charcoal/[0.04]',
    danger: 'border border-terracotta/40 text-terracotta hover:bg-terracotta/[0.06]',
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes} ${variants}`}>
      {children}
    </button>
  );
}

/* ---------------- Confirm dialog ---------------- */

/**
 * ⚠ CONSEQUENTIAL ACTIONS GET A CONFIRMATION, and irreversible ones say so.
 *   The brief asks for reversible behaviour where practical and clear warnings
 *   where not. This dialog carries a `destructive` flag that changes the copy
 *   and the button, so a refund never looks like a routine save.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-sm border border-charcoal/15 bg-cream p-5 shadow-lg">
        <h2 className="font-[family-name:var(--font-fraunces)] text-lg text-charcoal">{title}</h2>
        <div className="mt-2 text-sm leading-relaxed text-charcoal/75">{body}</div>
        <div className="mt-5 flex gap-2">
          <AdminButton variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </AdminButton>
          <AdminButton variant="ghost" onClick={onCancel}>
            Cancel
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

/** A small hook to manage a confirm dialog around an action. */
export function useConfirm() {
  const [pending, setPending] = useState<(() => void) | null>(null);
  return {
    isOpen: pending !== null,
    ask: (action: () => void) => setPending(() => action),
    confirm: () => {
      pending?.();
      setPending(null);
    },
    cancel: () => setPending(null),
  };
}

/* ---------------- Empty / blocked notice ---------------- */

export function Notice({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'blocked' }) {
  const cls =
    tone === 'blocked'
      ? 'border-dashed border-muted-gold/40 bg-muted-gold/[0.06]'
      : 'border-charcoal/15 bg-charcoal/[0.02]';
  return <div className={`rounded-sm border p-4 text-sm leading-relaxed text-charcoal/75 ${cls}`}>{children}</div>;
}
