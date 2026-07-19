/**
 * LOGGING ABSTRACTION
 *
 * Components and adapters log THROUGH this, never to `console` directly.
 * Swapping to Sentry / Axiom / Datadog is then one file, not a hunt.
 *
 * ⚠ REDACTION IS NOT OPTIONAL. Phone numbers, M-PESA references and payment
 *   payloads pass through this code path constantly. A log line is a data
 *   leak waiting to happen — the Kenya Data Protection Act 2019 applies (D-43).
 */

import { clientEnv } from '../config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99,
};

export type LogContext = Record<string, unknown>;

export interface LogSink {
  write(level: Exclude<LogLevel, 'silent'>, message: string, context?: LogContext): void;
}

/** Keys whose VALUES are redacted wherever they appear. */
const SENSITIVE_KEYS = [
  'phone',
  'msisdn',
  'password',
  'pin',
  'token',
  'secret',
  'key',
  'authorization',
  'consumerkey',
  'consumersecret',
  'passkey',
  'transactionref',
  'mpesareference',
  'checkoutrequestid',
  'email',
];

const redactValue = (v: string): string =>
  v.length <= 4 ? '[redacted]' : `${v.slice(0, 2)}…${v.slice(-2)}`;

export const redact = (ctx: LogContext | undefined): LogContext | undefined => {
  if (!ctx) return undefined;
  const out: LogContext = {};
  for (const [k, v] of Object.entries(ctx)) {
    const sensitive = SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s));
    if (sensitive && typeof v === 'string') {
      out[k] = redactValue(v);
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = redact(v as LogContext);
    } else if (sensitive) {
      out[k] = '[redacted]';
    } else {
      out[k] = v;
    }
  }
  return out;
};

const consoleSink: LogSink = {
  write(level, message, context) {
    const line = { level, message, ...redact(context), at: new Date().toISOString() };
    const fn =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(JSON.stringify(line));
  },
};

let sink: LogSink = consoleSink;

/** Swap the destination (Sentry, Axiom, …) at the composition root. */
export const setLogSink = (s: LogSink): void => {
  sink = s;
};

const enabled = (level: Exclude<LogLevel, 'silent'>): boolean => {
  const configured = clientEnv().NEXT_PUBLIC_LOG_LEVEL;
  return ORDER[level] >= ORDER[configured];
};

export const logger = {
  debug: (m: string, c?: LogContext) => enabled('debug') && sink.write('debug', m, c),
  info: (m: string, c?: LogContext) => enabled('info') && sink.write('info', m, c),
  warn: (m: string, c?: LogContext) => enabled('warn') && sink.write('warn', m, c),
  error: (m: string, c?: LogContext) => enabled('error') && sink.write('error', m, c),
};
