'use client';

/**
 * ADMIN SCREENS — Products, Content, Reports, Audit, Settings
 *
 * Same discipline: read through the admin adapter, gate mutations, confirm the
 * consequential ones, let the adapter write audit. Reports build a CSV through
 * the shared `toCsv` contract so the export format is documented and stable.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdmin, Gate } from './AdminProvider';
import {
  PageHeader, Table, Row, Cell, Badge, AdminButton, Notice,
} from './kit';
import { useAdapters } from '../commerce/AdapterProvider';
import {
  REPORT_TYPES, reportLabel, type ReportType, type ReportResult, toCsv, REPORT_SCHEMAS,
} from '../../domain/admin/reporting';
import {
  auditActionLabel, reversibilityOf, type AuditEvent,
} from '../../domain/admin/audit';
import type { Product } from '../../domain/catalogue';
import type { ContentBlock, StoreSettings } from '../../ports/admin';

/* ================================================================== *
 * PRODUCTS
 * ================================================================== */

export function AdminProducts() {
  const admin = useAdmin();
  const storefront = useAdapters();
  const [products, setProducts] = useState<readonly Product[] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    setProducts(await storefront.products.list().catch(() => []));
  }, [storefront]);

  useEffect(() => { void load(); }, [load]);

  const act = async (fn: () => Promise<{ ok: boolean }>, msg: string) => {
    const r = await fn();
    setFeedback(r.ok ? msg : 'Not permitted.');
    void load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="The catalogue. Create, edit, duplicate, archive, and schedule publication."
        actions={<Gate permission="product.edit"><AdminButton disabled>New product</AdminButton></Gate>}
      />

      <Notice tone="blocked">
        Prices show as “awaiting confirmation” (D-14) and product copy that touches ingredients or claims
        is client-supplied (D-49/50/51/52). Editing here changes structure, not unapproved claims.
      </Notice>

      {feedback && <Notice>{feedback}</Notice>}

      {products === null ? (
        <div className="h-40 animate-pulse rounded-sm bg-charcoal/5" />
      ) : (
        <Table head={['Product', 'Variants', 'Status', 'Actions']}>
          {products.map((p) => (
            <Row key={p.id}>
              <Cell>{p.name}</Cell>
              <Cell>{p.variants.length}</Cell>
              <Cell><Badge tone={p.status === 'active' ? 'positive' : 'neutral'}>{p.status}</Badge></Cell>
              <Cell>
                <div className="flex gap-2">
                  <Gate permission="product.edit">
                    <AdminButton size="sm" variant="secondary" onClick={() => void act(() => admin.adminProducts.duplicate(p.id as string), `Duplicated ${p.name} (audited).`)}>Duplicate</AdminButton>
                  </Gate>
                  <Gate permission="product.archive">
                    <AdminButton size="sm" variant="danger" onClick={() => void act(() => admin.adminProducts.archive(p.id as string), `Archived ${p.name} (audited).`)}>Archive</AdminButton>
                  </Gate>
                </div>
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ================================================================== *
 * CONTENT
 * ================================================================== */

const CONTENT_KINDS = ['homepage_section', 'announcement', 'faq', 'journal', 'testimonial'] as const;

export function AdminContent() {
  const admin = useAdmin();
  const [kind, setKind] = useState<string>('homepage_section');
  const [blocks, setBlocks] = useState<readonly ContentBlock[] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBlocks(await admin.content.list(kind));
  }, [admin, kind]);

  useEffect(() => { void load(); }, [load]);

  const act = async (fn: () => Promise<{ ok: boolean }>, msg: string) => {
    const r = await fn();
    setFeedback(r.ok ? msg : 'Not permitted.');
    void load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Content" description="Homepage sections, announcements, FAQs, journal and testimonials — draft and publish." />

      <Notice tone="blocked">
        FAQ answers touching health, safety or provenance must come from the client in writing (D-46/49).
        This screen manages publication state, not the truth of a claim.
      </Notice>

      <div className="flex flex-wrap gap-2">
        {CONTENT_KINDS.map((k) => (
          <AdminButton key={k} size="sm" variant={kind === k ? 'primary' : 'ghost'} onClick={() => setKind(k)}>
            {k.replace('_', ' ')}
          </AdminButton>
        ))}
      </div>

      {feedback && <Notice>{feedback}</Notice>}

      {blocks === null ? (
        <div className="h-32 animate-pulse rounded-sm bg-charcoal/5" />
      ) : blocks.length === 0 ? (
        <Notice>No {kind.replace('_', ' ')} blocks yet.</Notice>
      ) : (
        <Table head={['Title', 'Status', 'Updated', 'Actions']}>
          {blocks.map((b) => (
            <Row key={b.id}>
              <Cell>{b.title}</Cell>
              <Cell><Badge tone={b.status === 'published' ? 'positive' : 'neutral'}>{b.status}</Badge></Cell>
              <Cell mono>{new Date(b.updatedAt).toLocaleDateString()}</Cell>
              <Cell>
                <Gate permission="content.publish" fallback={<span className="text-xs text-charcoal/45">view only</span>}>
                  {b.status === 'published'
                    ? <AdminButton size="sm" variant="secondary" onClick={() => void act(() => admin.content.unpublish(b.id), 'Unpublished (audited).')}>Unpublish</AdminButton>
                    : <AdminButton size="sm" onClick={() => void act(() => admin.content.publish(b.id), 'Published (audited).')}>Publish</AdminButton>}
                </Gate>
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ================================================================== *
 * REPORTS
 * ================================================================== */

export function AdminReports() {
  const admin = useAdmin();
  const [type, setType] = useState<ReportType>('sales');
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    const to = Date.now();
    const from = to - 1000 * 60 * 60 * 24 * 30;
    const r = await admin.reporting.run(type, { from, to });
    setResult(r);
    setLoading(false);
  }, [admin, type]);

  useEffect(() => { void run(); }, [run]);

  const columns = REPORT_SCHEMAS[type];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Sales, products, customers, payments, discounts, subscriptions, inventory and delivery — with a stable CSV export."
        actions={
          <Gate permission="report.export">
            <AdminButton variant="secondary" disabled={!result} onClick={() => {
              if (result) downloadCsv(`${type}-report.csv`, toCsv(columns, result.rows));
            }}>Export CSV</AdminButton>
          </Gate>
        }
      />

      <Notice tone="blocked">
        Revenue and monetary columns show “awaiting confirmation” until approved prices exist (D-14). The
        report structure and CSV contract are final; the numbers fill in when prices are set.
      </Notice>

      <div className="flex flex-wrap gap-2">
        {REPORT_TYPES.map((t) => (
          <AdminButton key={t} size="sm" variant={type === t ? 'primary' : 'ghost'} onClick={() => setType(t)}>
            {reportLabel(t)}
          </AdminButton>
        ))}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-sm bg-charcoal/5" />
      ) : !result || result.rows.length === 0 ? (
        <Notice>No rows for this report in the selected range.</Notice>
      ) : (
        <Table head={columns.map((c) => c.label)}>
          {result.rows.map((r, i) => (
            <Row key={i}>
              {columns.map((c) => <Cell key={c.key} mono={typeof r[c.key] === 'number'}>{String(r[c.key] ?? '—')}</Cell>)}
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ================================================================== *
 * AUDIT LOG
 * ================================================================== */

export function AdminAudit() {
  const admin = useAdmin();
  const [events, setEvents] = useState<readonly AuditEvent[] | null>(null);

  useEffect(() => {
    void (async () => setEvents(await admin.audit.list({})))();
  }, [admin]);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Who did what, to which target, and when. Append-only — the record of every consequential action." />

      {events === null ? (
        <div className="h-40 animate-pulse rounded-sm bg-charcoal/5" />
      ) : events.length === 0 ? (
        <Notice>No audit events yet. Consequential actions will appear here.</Notice>
      ) : (
        <Table head={['When', 'Who', 'Action', 'Target', 'Reversibility']}>
          {events.map((e) => (
            <Row key={e.id}>
              <Cell mono>{new Date(e.at).toLocaleString()}</Cell>
              <Cell>{e.actorName}</Cell>
              <Cell>{auditActionLabel(e.action)}</Cell>
              <Cell mono>{e.target}</Cell>
              <Cell>
                <Badge tone={reversibilityOf(e.action) === 'reversible' ? 'positive' : reversibilityOf(e.action) === 'irreversible' ? 'attention' : 'neutral'}>
                  {reversibilityOf(e.action)}
                </Badge>
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ================================================================== *
 * SETTINGS
 * ================================================================== */

export function AdminSettings() {
  const admin = useAdmin();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [flags, setFlags] = useState<Readonly<Record<string, boolean>>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, f] = await Promise.all([admin.settings.get(), admin.settings.featureFlags()]);
    setSettings(s);
    setFlags(f);
  }, [admin]);

  useEffect(() => { void load(); }, [load]);

  const toggleMaintenance = async () => {
    if (!settings) return;
    const r = await admin.settings.update({ maintenanceMode: !settings.maintenanceMode });
    setFeedback(r.ok ? 'Store settings updated (audited).' : 'Not permitted.');
    void load();
  };

  const toggleFlag = async (flag: string, on: boolean) => {
    const r = await admin.settings.toggleFlag(flag, on);
    setFeedback(r.ok ? `Flag ${flag} ${on ? 'on' : 'off'} (audited).` : 'Not permitted.');
    void load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Store details, order numbering, tax, feature flags and maintenance mode." />

      {feedback && <Notice>{feedback}</Notice>}

      {settings === null ? (
        <div className="h-40 animate-pulse rounded-sm bg-charcoal/5" />
      ) : (
        <>
          <section className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-5 text-sm text-charcoal/80">
            <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">Store</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <p>Name: {settings.storeName}</p>
              <p>Currency: {settings.currency}</p>
              <p>Contact: {settings.contactEmail}</p>
              <p>Order prefix: {settings.orderNumberPrefix}</p>
              <p>Tax: {settings.taxEnabled ? 'enabled' : 'off (D-16 unconfirmed)'}</p>
              <p>Maintenance: {settings.maintenanceMode ? 'ON' : 'off'}</p>
            </div>
            <Gate permission="settings.edit" fallback={<p className="mt-3 text-xs text-charcoal/50">You can view settings but not change them.</p>}>
              <div className="mt-4">
                <AdminButton variant={settings.maintenanceMode ? 'danger' : 'secondary'} onClick={() => void toggleMaintenance()}>
                  {settings.maintenanceMode ? 'Turn off maintenance mode' : 'Turn on maintenance mode'}
                </AdminButton>
              </div>
            </Gate>
          </section>

          <section className="rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-5">
            <h3 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">Feature flags</h3>
            <p className="mt-2 text-xs leading-relaxed text-charcoal/55">
              Each flag is blocked on a decision — turning one on here does not remove that block; it records intent.
            </p>
            <div className="mt-4 space-y-2">
              {Object.keys(flags).length === 0 ? (
                <p className="text-sm text-charcoal/60">No flags configured.</p>
              ) : Object.entries(flags).map(([flag, on]) => (
                <div key={flag} className="flex items-center justify-between gap-4">
                  <span className="font-[family-name:var(--font-mono)] text-sm text-charcoal">{flag}</span>
                  <Gate permission="settings.edit" fallback={<Badge tone={on ? 'positive' : 'neutral'}>{on ? 'on' : 'off'}</Badge>}>
                    <AdminButton size="sm" variant={on ? 'secondary' : 'ghost'} onClick={() => void toggleFlag(flag, !on)}>
                      {on ? 'On' : 'Off'}
                    </AdminButton>
                  </Gate>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ================================================================== *
 * shared
 * ================================================================== */

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
