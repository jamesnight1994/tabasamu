'use client';

const PLACEHOLDER_ACTIVITY = [
  { id: '1', title: 'Order #1001 — Paid', detail: '2× Kenyan PB 340g · M-Pesa', time: '2h ago' },
  { id: '2', title: "Product 'Classic Roast' updated", detail: 'Description and images refreshed', time: '5h ago' },
  { id: '3', title: 'Order #998 — Shipped', detail: 'Nairobi CBD · Standard delivery', time: 'Yesterday' },
  { id: '4', title: 'New product draft saved', detail: 'Holiday Gift Set — not published', time: 'Yesterday' },
  { id: '5', title: 'Order #995 — Pending payment', detail: 'STK push sent · awaiting confirmation', time: '2 days ago' },
  { id: '6', title: 'Inventory threshold alert', detail: 'Tumbler Mint — placeholder rule', time: '3 days ago' },
] as const;

export function AdminDashboardActivityTab() {
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-default-200 rounded-lg border border-default-200 bg-white">
        {PLACEHOLDER_ACTIVITY.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted">{item.detail}</p>
            </div>
            <span className="shrink-0 text-xs text-muted">{item.time}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        Connect to Nest/Medusa activity feed in a later phase.
      </p>
    </div>
  );
}
