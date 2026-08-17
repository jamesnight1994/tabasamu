/**
 * ERROR TAXONOMY
 *
 * Errors carry a STABLE CODE and a USER-FACING MESSAGE written in-voice:
 * no exclamation marks, no jokes, non-judgemental. [Brand Book §07]
 *
 * A raw exception message is never rendered to a customer — it leaks
 * implementation detail and it is written in the voice of a stack trace.
 */

export type ErrorCode =
  | 'NETWORK'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'OUT_OF_STOCK'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_UNKNOWN'
  | 'UNAUTHORISED'
  | 'RATE_LIMITED'
  | 'SERVER'
  | 'UNKNOWN';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly cause?: unknown;

  constructor(code: ErrorCode, userMessage: string, cause?: unknown) {
    super(`${code}: ${userMessage}`);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.cause = cause;
  }
}

/** In-voice copy. Calm, plain, and honest about what we do and do not know. */
const MESSAGES: Record<ErrorCode, string> = {
  NETWORK: 'We could not reach the network. Check your connection and try again.',
  NOT_FOUND: 'We could not find that.',
  VALIDATION: 'Some details need another look.',
  OUT_OF_STOCK: 'That has sold out since you added it.',
  PAYMENT_FAILED: 'The payment did not go through. Nothing has been charged.',
  // ⚠ Deliberately different from PAYMENT_FAILED. We do NOT claim to know.
  PAYMENT_UNKNOWN:
    'We have not heard back from M-PESA yet. Do not pay again — we will confirm by SMS.',
  UNAUTHORISED: 'Please sign in to continue.',
  RATE_LIMITED: 'That was a lot at once. Wait a moment and try again.',
  SERVER: 'Something went wrong on our side. We are looking into it.',
  UNKNOWN: 'Something went wrong.',
};

export const appError = (code: ErrorCode, cause?: unknown): AppError =>
  new AppError(code, MESSAGES[code], cause);

export const toAppError = (e: unknown): AppError => {
  if (e instanceof AppError) return e;
  if (e instanceof TypeError && /fetch|network/i.test(e.message)) return appError('NETWORK', e);
  return appError('UNKNOWN', e);
};

export const userMessage = (e: unknown): string => toAppError(e).userMessage;
