/**
 * DOMAIN — PHONE NORMALISATION
 *
 * ⚠ This is load-bearing for M-PESA. Daraja requires `2547XXXXXXXX` /
 *   `2541XXXXXXXX`. A wrongly-normalised number sends an STK push to the
 *   wrong handset, or to nobody.
 *
 * It lives HERE, in the domain layer — never in a component. [NN-06, F-54]
 *
 * Phone is the PRIMARY human identifier in this market, not email. It is the
 * support key, and the rider will call it. [R-21]
 */

import { type Result, Ok, Err } from '../shared';

/** `2547XXXXXXXX` — 12 digits, no `+`. The shape Daraja expects. */
export type E164Phone = string & { readonly __e164: unique symbol };

export type PhoneError =
  | { kind: 'empty' }
  | { kind: 'not_kenyan'; detail: string }
  | { kind: 'wrong_length'; detail: string }
  | { kind: 'invalid_prefix'; detail: string };

export const phoneErrorMessage = (e: PhoneError): string => {
  switch (e.kind) {
    case 'empty':
      return 'Enter your phone number.';
    case 'not_kenyan':
      return 'Enter a Kenyan number.';
    case 'wrong_length':
      return 'That number looks too short or too long.';
    case 'invalid_prefix':
      return 'That does not look like a Kenyan mobile number.';
  }
};

/**
 * Safaricom / Airtel / Telkom mobile prefixes are 07xx and 01xx.
 * We accept both — M-PESA is Safaricom, but a delivery contact number
 * may be any network, and we must not reject a valid handset.
 */
const VALID_SUBSCRIBER_PREFIX = /^[17]/;

/**
 * Accepts every shape a Kenyan customer will actually type:
 *   0712 345 678   ·   +254 712 345 678   ·   254712345678
 *   712345678      ·   0712-345-678       ·   (0712) 345678
 * Returns `2547XXXXXXXX`.
 */
export const normalisePhone = (input: string): Result<E164Phone, PhoneError> => {
  const raw = (input ?? '').trim();
  if (raw.length === 0) return Err({ kind: 'empty' });

  // Strip everything that is not a digit or a leading plus.
  let digits = raw.replace(/[^\d+]/g, '');

  // A `+` is only meaningful at the front.
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.includes('+')) {
    return Err({ kind: 'not_kenyan', detail: 'unexpected + inside the number' });
  }

  // `00` is the international access prefix. Strip it and treat what follows
  // as a country code.
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  /**
   * ⚠ REJECT FOREIGN COUNTRY CODES EXPLICITLY, BEFORE ANY LENGTH PARSING.
   *
   *   This is THE dangerous case. `+447911123456` (UK) must be rejected as
   *   NOT KENYAN. If it merely fell through to the length check it would be
   *   rejected for the wrong reason today — and a foreign number that happened
   *   to have nine trailing digits could be silently coerced into a valid-
   *   looking Kenyan MSISDN tomorrow.
   *
   *   The consequence of that bug is an M-PESA STK push sent to a stranger's
   *   handset. So the check is explicit, and it is first.
   *
   *   The input was already `+`-stripped above, so an international number
   *   arrives here as bare digits beginning with its country code. Anything
   *   that is not Kenya (254) and is too long to be a domestic Kenyan number
   *   (max 10 digits, e.g. 0712345678) is foreign.
   */
  const KENYA_CC = '254';

  // A leading `0` is the DOMESTIC trunk prefix (0712…). Such a number is being
  // dialled as Kenyan, so a length problem is a TYPO, not a foreign number —
  // it must fall through to the length check below and report `wrong_length`.
  //
  // Anything else that is over-long and does NOT start with 254 is carrying a
  // foreign country code.
  const isDomesticForm = digits.startsWith('0');

  if (!isDomesticForm && !digits.startsWith(KENYA_CC) && digits.length > 10) {
    return Err({
      kind: 'not_kenyan',
      detail: `country code +${digits.slice(0, 3)} is not Kenya (+254)`,
    });
  }

  let subscriber: string;

  if (digits.startsWith(KENYA_CC)) {
    subscriber = digits.slice(3); // 254712345678 → 712345678
  } else if (digits.startsWith('0')) {
    subscriber = digits.slice(1); // 0712345678   → 712345678
  } else {
    subscriber = digits; // 712345678    → 712345678
  }

  if (subscriber.length !== 9) {
    return Err({ kind: 'wrong_length', detail: `${subscriber.length} subscriber digits, need 9` });
  }
  if (!VALID_SUBSCRIBER_PREFIX.test(subscriber)) {
    return Err({ kind: 'invalid_prefix', detail: `starts with ${subscriber[0]}` });
  }

  return Ok(`254${subscriber}` as E164Phone);
};

export const isValidPhone = (input: string): boolean => normalisePhone(input).ok;

/** Human display: `0712 345 678`. Kenyans read their own number in local form. */
export const formatPhoneLocal = (phone: E164Phone): string => {
  const s = phone.slice(3); // drop 254
  return `0${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}`;
};

/** International display: `+254 712 345 678`. */
export const formatPhoneInternational = (phone: E164Phone): string => {
  const s = phone.slice(3);
  return `+254 ${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}`;
};
