/**
 * CUSTOMER & ADDRESS BOOK DOMAIN
 *
 * Pure rules for the customer profile and their saved addresses. The storage is
 * the adapter's concern; the INVARIANTS live here, where they can be tested
 * without a database.
 *
 * ⚠ THE ONE INVARIANT THAT BITES IF YOU GET IT WRONG:
 *   an address book has AT MOST ONE default, and if it has any entries it has
 *   EXACTLY one default. Every mutation below preserves that, so the checkout
 *   never has to ask "what if two addresses are both default?" — it can't happen.
 */

import { type Result, Ok, Err, type CustomerId, type AddressId } from '../shared';
import { normalisePhone, type E164Phone } from './phone';
import { type Email } from './auth';

/* ================================================================== *
 * Customer profile
 * ================================================================== */

export interface CustomerProfile {
  readonly id: CustomerId;
  readonly email: Email;
  readonly fullName: string;
  readonly phone: E164Phone;
  readonly emailVerified: boolean;
  /** Epoch ms. For the "member since" line — a small, real touch. */
  readonly createdAt: number;
}

export interface ProfileUpdate {
  readonly fullName?: string;
  readonly phone?: string;
}

export type ProfileFieldError =
  | { field: 'fullName'; message: string }
  | { field: 'phone'; message: string };

export const validateProfileUpdate = (
  update: ProfileUpdate
): Result<{ fullName?: string; phone?: E164Phone }, readonly ProfileFieldError[]> => {
  const errors: ProfileFieldError[] = [];
  const out: { fullName?: string; phone?: E164Phone } = {};

  if (update.fullName !== undefined) {
    const name = update.fullName.trim();
    if (name.length === 0) errors.push({ field: 'fullName', message: 'Enter your name.' });
    else out.fullName = name;
  }

  if (update.phone !== undefined) {
    const phone = normalisePhone(update.phone);
    if (!phone.ok) errors.push({ field: 'phone', message: 'Enter a valid Kenyan phone number.' });
    else out.phone = phone.value;
  }

  return errors.length > 0 ? Err(errors) : Ok(out);
};

/* ================================================================== *
 * Saved address — the Nairobi shape (estate/building/landmark)
 * ================================================================== */

/**
 * ⚠ SAME SHAPE AS THE CHECKOUT ADDRESS, DELIBERATELY.
 *   Nairobi navigates by estate + building + landmark, not street number +
 *   postcode. A saved address that can't be used at checkout is worse than no
 *   saved address, so the two share one shape. [P-03, F-78]
 */
export interface SavedAddress {
  readonly id: AddressId;
  readonly label: string; // "Home", "Mum's place" — the customer's own word
  readonly recipientName: string;
  readonly recipientPhone: E164Phone;
  readonly zoneId: string; // ⛔ resolves against DeliveryConfig — zones are D-21/22/23
  readonly estate: string;
  readonly building: string;
  readonly landmark: string;
  readonly instructions: string;
  readonly isDefault: boolean;
}

export interface AddressInput {
  readonly label: string;
  readonly recipientName: string;
  readonly recipientPhone: string;
  readonly zoneId: string;
  readonly estate: string;
  readonly building: string;
  readonly landmark: string;
  readonly instructions: string;
}

export type AddressFieldError =
  | { field: 'label'; message: string }
  | { field: 'recipientName'; message: string }
  | { field: 'recipientPhone'; message: string }
  | { field: 'zoneId'; message: string }
  | { field: 'estate'; message: string }
  | { field: 'building'; message: string }
  | { field: 'landmark'; message: string };

export interface ValidAddress {
  readonly label: string;
  readonly recipientName: string;
  readonly recipientPhone: E164Phone;
  readonly zoneId: string;
  readonly estate: string;
  readonly building: string;
  readonly landmark: string;
  readonly instructions: string;
}

/**
 * ⚠ `requireZone` IS A PARAMETER, NOT A CONSTANT.
 *   Today no zones exist (⛔ D-21/22/23), so the address book cannot force a
 *   zone choice — that would make it impossible to save any address at all.
 *   When zones are configured, the caller flips this on and the zone becomes
 *   required. The rule is honest about the current blocked state instead of
 *   inventing zones to validate against. [NN-05]
 */
export const validateAddress = (
  input: AddressInput,
  opts: { requireZone: boolean } = { requireZone: false }
): Result<ValidAddress, readonly AddressFieldError[]> => {
  const errors: AddressFieldError[] = [];

  const label = input.label.trim();
  if (label.length === 0) errors.push({ field: 'label', message: 'Give this address a name, like "Home".' });

  const recipientName = input.recipientName.trim();
  if (recipientName.length === 0)
    errors.push({ field: 'recipientName', message: 'Who receives the box?' });

  const phone = normalisePhone(input.recipientPhone);
  if (!phone.ok)
    errors.push({ field: 'recipientPhone', message: 'Enter a valid Kenyan phone number.' });

  if (opts.requireZone && input.zoneId.trim().length === 0)
    errors.push({ field: 'zoneId', message: 'Choose a delivery area.' });

  const estate = input.estate.trim();
  if (estate.length === 0) errors.push({ field: 'estate', message: 'Enter the estate or area.' });

  const building = input.building.trim();
  if (building.length === 0)
    errors.push({ field: 'building', message: 'Enter the building, house or apartment.' });

  // ⚠ Landmark REQUIRED — it is what the rider actually navigates by.
  const landmark = input.landmark.trim();
  if (landmark.length === 0)
    errors.push({ field: 'landmark', message: 'Add a nearby landmark. The rider needs it.' });

  if (errors.length > 0) return Err(errors);

  return Ok({
    label,
    recipientName,
    recipientPhone: (phone as { value: E164Phone }).value,
    zoneId: input.zoneId.trim(),
    estate,
    building,
    landmark,
    instructions: input.instructions.trim(),
  });
};

/* ================================================================== *
 * Address book invariants — AT MOST ONE default, and the mutations
 * ================================================================== */

/**
 * ⚠ THESE ARE PURE FUNCTIONS OVER THE WHOLE LIST.
 *
 *   The temptation is to store "isDefault" per row and hope. But two rows can
 *   drift to both-default (two tabs, a race, a bad migration) and then the
 *   checkout picks arbitrarily. Instead, every mutation returns a NEW list with
 *   the invariant re-established, and the adapter persists the whole list. The
 *   invariant is enforced, not hoped for.
 */

/** The default address, or the first, or null. Never throws, never ambiguous. */
export const defaultAddress = (book: readonly SavedAddress[]): SavedAddress | null => {
  if (book.length === 0) return null;
  return book.find((a) => a.isDefault) ?? book[0];
};

/** Adding: the FIRST address is automatically default; later ones are not. */
export const withAddedAddress = (
  book: readonly SavedAddress[],
  address: SavedAddress
): readonly SavedAddress[] => {
  const isFirst = book.length === 0;
  return [...book, { ...address, isDefault: isFirst ? true : address.isDefault && false }];
};

/** Setting a default: exactly the chosen one becomes default, all others drop it. */
export const withDefaultAddress = (
  book: readonly SavedAddress[],
  id: AddressId
): readonly SavedAddress[] =>
  book.map((a) => ({ ...a, isDefault: a.id === id }));

/**
 * ⚠ REMOVING THE DEFAULT PROMOTES ANOTHER.
 *   If you delete the default and leave the book non-empty, SOMETHING must
 *   become default or the invariant breaks. The first remaining entry is
 *   promoted. Deleting the last entry leaves an empty book (no default, which
 *   is correct — there is nothing to default to).
 */
export const withRemovedAddress = (
  book: readonly SavedAddress[],
  id: AddressId
): readonly SavedAddress[] => {
  const removed = book.find((a) => a.id === id);
  const rest = book.filter((a) => a.id !== id);
  if (rest.length === 0) return rest;
  if (removed?.isDefault && !rest.some((a) => a.isDefault)) {
    return rest.map((a, i) => ({ ...a, isDefault: i === 0 }));
  }
  return rest;
};

/** Editing preserves the default flag and the id; only the fields change. */
export const withUpdatedAddress = (
  book: readonly SavedAddress[],
  id: AddressId,
  fields: ValidAddress
): readonly SavedAddress[] =>
  book.map((a) => (a.id === id ? { ...a, ...fields } : a));

export const addressErrorMessage = (e: AddressFieldError): string => e.message;
