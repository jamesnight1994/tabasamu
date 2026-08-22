'use client';

import { Card } from '@heroui/react';

const STAT_CARDS = [
  { label: 'Orders today', value: '—', note: 'Awaiting orders API' },
  { label: 'Revenue (KES)', value: '—', note: 'Pricing TBD (D-14)' },
  { label: 'Active products', value: '—', note: 'Connect to Nest catalogue' },
  { label: 'Low stock', value: '—', note: 'Awaiting inventory rules' },
] as const;

export function AdminDashboardOverviewTab() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_CARDS.map((stat) => (
        <Card key={stat.label} className="border border-default-200 shadow-sm">
          <Card.Header className="pb-1">
            <Card.Description className="text-xs uppercase tracking-wide text-muted">
              {stat.label}
            </Card.Description>
            <Card.Title className="text-3xl font-semibold text-foreground">{stat.value}</Card.Title>
          </Card.Header>
          <Card.Content className="pt-0">
            <p className="text-xs text-muted">{stat.note}</p>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}
