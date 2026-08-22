import type { AdminProductRow } from './products-types';

export function filterAdminProducts(
  rows: AdminProductRow[],
  query: string,
): AdminProductRow[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;

  return rows.filter((row) =>
    [
      row.name,
      row.slug,
      row.flavour,
      row.primarySku,
      row.descriptorLabel,
      row.status,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalized)),
  );
}
