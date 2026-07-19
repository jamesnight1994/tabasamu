# Reporting Schema — Phase 7

**Status:** Reference. Source: `src/domain/admin/reporting.ts`.

Each report declares its columns as a stable schema. The backend fills the rows; the CSV export is built from the same schema, so the export format is documented and cannot drift from what the screen shows.

## The CSV contract

`toCsv(schema, rows)` builds a **CRLF-terminated** CSV with a header row. Fields containing a comma, quote, or newline are quoted and internal quotes are doubled — RFC 4180. This escaping is tested directly (a corrupt export is found at the worst possible time, so it is tested at the best).

⚠ **Money columns carry a `Pending` marker.** A blocked value (D-14) exports as the literal `awaiting confirmation`, never as `0` or an invented figure. A spreadsheet that says a number is pending is honest; one that says `0` is wrong.

## The report types

### `sales`

| Column | Label | Type |
|---|---|---|
| `date` | Date | date |
| `orders` | Orders | number |
| `units` | Units | number |
| `revenue` | Revenue | money ⛔ D-14 |

### `product`

| Column | Label | Type |
|---|---|---|
| `name` | Product | text |
| `sku` | SKU | text |
| `units` | Units sold | number |
| `revenue` | Revenue | money ⛔ D-14 |

### `customer`

| Column | Label | Type |
|---|---|---|
| `name` | Customer | text |
| `orders` | Orders | number |
| `ltv` | Lifetime value | money ⛔ D-14 |
| `joined` | Joined | date |

### `payment`

| Column | Label | Type |
|---|---|---|
| `reference` | Reference | text |
| `provider` | Provider | text |
| `status` | Status | text |
| `amount` | Amount | money ⛔ D-14 |
| `date` | Date | date |

### `discount`

| Column | Label | Type |
|---|---|---|
| `code` | Code | text |
| `used` | Times used | number |
| `status` | Status | text |

### `subscription`

| Column | Label | Type |
|---|---|---|
| `id` | Subscription | text |
| `status` | Status | text |
| `frequency` | Frequency | text |
| `cycles` | Cycles | number |

### `inventory`

| Column | Label | Type |
|---|---|---|
| `name` | Product | text |
| `sku` | SKU | text |
| `onHand` | On hand | number |
| `reserved` | Reserved | number |
| `available` | Available | number |

### `delivery`

_Schema defined in source._

## Ranges

Every report takes a `DateRange { from, to }` in epoch ms. The console defaults to the last 30 days; the backend honours the supplied range.

## For the backend

- Fill rows against these exact keys; the CSV and the on-screen table both read them.
- Return money columns as `Unavailable` until D-14; do not substitute `0`.
- Preserve the CRLF + RFC-4180 escaping (or reuse the shared `toCsv`).