'use client';

/**
 * PREFERENCES
 *
 * ⚠ EVERY TOGGLE HERE WRITES AN AUDITABLE CONSENT EVENT.
 *   Flipping "marketing email" on isn't just a UI state — it calls
 *   `recordConsent`, which APPENDS to the consent log. The current value is
 *   derived from that log, never stored beside it. This is what makes consent
 *   provable under the Data Protection Act. [D-43]
 *
 * ⚠ TRANSACTIONAL MESSAGES ARE NOT TOGGLEABLE.
 *   You cannot switch off "your order shipped". Those switches are simply not
 *   rendered; the marketing ones are.
 *
 * ⚠ DELETION IS A REQUEST, NOT A BUTTON THAT NUKES YOUR ROW.
 *   Some records must be retained (tax, completed orders). The UI submits a
 *   request with a status and says so plainly. [NN-05]
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdapters } from './AdapterProvider';
import { Button } from '../primitives/Button';
import { Switch } from '../primitives/Form';
import { Dialog } from '../primitives/Overlay';
import {
  type ChannelPreferences,
  type CookiePreferences,
  type DataRequest,
  dataRequestCopy,
} from '../../domain/preferences';

export function Preferences() {
  const { preferences } = useAdapters();
  const [channels, setChannels] = useState<ChannelPreferences | null>(null);
  const [cookies, setCookies] = useState<CookiePreferences | null>(null);
  const [requests, setRequests] = useState<readonly DataRequest[]>([]);

  const load = useCallback(async () => {
    const [c, k, r] = await Promise.all([
      preferences.channels(),
      preferences.cookies(),
      preferences.dataRequests(),
    ]);
    setChannels(c);
    setCookies(k);
    setRequests(r);
  }, [preferences]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateChannels = useCallback(
    async (next: ChannelPreferences, topic: Parameters<typeof preferences.recordConsent>[0], granted: boolean) => {
      setChannels(next); // optimistic
      await preferences.updateChannels(next);
      // ⚠ Every marketing change is also recorded as a consent event.
      await preferences.recordConsent(topic, granted, 'preferences');
    },
    [preferences]
  );

  if (!channels || !cookies) {
    return <div className="h-64 animate-pulse rounded-sm bg-charcoal/5" />;
  }

  return (
    <div className="space-y-10">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-charcoal">Preferences</h1>

      {/* Marketing channels */}
      <section className="space-y-4">
        <SectionLabel>How we can reach you</SectionLabel>
        <p className="text-sm leading-relaxed text-charcoal/70">
          Order updates always come through — you cannot switch those off. These control marketing
          only.
        </p>

        <div className="space-y-4 rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-5">
          <Switch
            id="email-marketing"
            checked={channels.email.marketing}
            onCheckedChange={(v) =>
              void updateChannels(
                { ...channels, email: { ...channels.email, marketing: v } },
                'marketing_email',
                v
              )
            }
            label="Email — occasional news"
          />
          <Switch
            id="sms-marketing"
            checked={channels.sms.marketing}
            onCheckedChange={(v) =>
              void updateChannels(
                { ...channels, sms: { ...channels.sms, marketing: v } },
                'marketing_sms',
                v
              )
            }
            label="SMS — occasional offers"
          />
          {/* ⛔ WhatsApp marketing — D-42 undecided. Shown, but its sending is
              stubbed; capturing the preference now is harmless and useful. */}
          <Switch
            id="whatsapp-marketing"
            checked={channels.whatsapp.marketing}
            onCheckedChange={(v) =>
              void updateChannels(
                { ...channels, whatsapp: { ...channels.whatsapp, marketing: v } },
                'marketing_whatsapp',
                v
              )
            }
            label="WhatsApp — occasional offers"
            hint="Coming soon"
          />
        </div>
      </section>

      {/* Cookies */}
      <section className="space-y-4">
        <SectionLabel>Cookies</SectionLabel>
        <div className="space-y-4 rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-charcoal">Necessary</p>
              <p className="text-xs text-charcoal/55">Always on. The site cannot work without these.</p>
            </div>
            <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-charcoal/40">
              On
            </span>
          </div>
          <Switch
            id="cookies-analytics"
            checked={cookies.analytics}
            onCheckedChange={(v) => {
              const next = { ...cookies, analytics: v, decided: true };
              setCookies(next);
              void preferences.updateCookies(next);
              void preferences.recordConsent('cookies_analytics', v, 'preferences');
            }}
            label="Analytics"
            hint="Helps us understand what is useful."
          />
          <Switch
            id="cookies-marketing"
            checked={cookies.marketing}
            onCheckedChange={(v) => {
              const next = { ...cookies, marketing: v, decided: true };
              setCookies(next);
              void preferences.updateCookies(next);
              void preferences.recordConsent('cookies_marketing', v, 'preferences');
            }}
            label="Marketing"
          />
        </div>
      </section>

      {/* Data rights */}
      <section className="space-y-4">
        <SectionLabel>Your data</SectionLabel>
        <DataRights requests={requests} onChanged={load} />
      </section>
    </div>
  );
}

function DataRights({
  requests,
  onChanged,
}: {
  requests: readonly DataRequest[];
  onChanged: () => void;
}) {
  const { preferences } = useAdapters();
  const [confirm, setConfirm] = useState<'export' | 'deletion' | null>(null);

  const submit = useCallback(
    async (kind: 'export' | 'deletion') => {
      await preferences.requestData(kind);
      setConfirm(null);
      onChanged();
    },
    [preferences, onChanged]
  );

  return (
    <div className="space-y-4 rounded-sm border border-charcoal/12 bg-charcoal/[0.02] p-5">
      <div className="flex flex-wrap gap-3">
        <Button size="sm" variant="secondary" onClick={() => setConfirm('export')}>
          Request my data
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirm('deletion')}>
          Request account deletion
        </Button>
      </div>

      {requests.length > 0 && (
        <ul className="space-y-2 border-t border-charcoal/10 pt-4">
          {requests.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-charcoal/80">
                {r.kind === 'export' ? 'Data export' : 'Account deletion'}
              </span>
              <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-charcoal/55">
                {r.status.replace('_', ' ')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {confirm && (
        <Dialog open onOpenChange={(o) => !o && setConfirm(null)} title={dataRequestCopy(confirm).title}>
          <p className="text-sm leading-relaxed text-charcoal/80">{dataRequestCopy(confirm).body}</p>
          <div className="mt-5 flex gap-3">
            <Button onClick={() => void submit(confirm)}>Submit request</Button>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Not now
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-charcoal/55">
      {children}
    </h2>
  );
}
