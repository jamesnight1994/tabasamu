/**
 * Thin Medusa Store API client (v2).
 *
 * Uses the publishable API key (safe for the browser). Prefer
 * NEXT_PUBLIC_API_URL in the browser and MEDUSA_BACKEND_URL on the server
 * (Docker service name).
 */

import { AppError, appError } from '../../lib/errors';
import { clientEnv } from '../../lib/config/env';

export type MedusaJson = Record<string, unknown>;

const baseUrl = (): string => {
  if (typeof window === 'undefined') {
    const serverUrl = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    if (serverUrl) return serverUrl.replace(/\/$/, '');
  }
  const url = clientEnv().NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new AppError(
      'SERVER',
      'The commerce API URL is not configured.',
      new Error('NEXT_PUBLIC_API_URL / MEDUSA_BACKEND_URL missing')
    );
  }
  return url.replace(/\/$/, '');
};

const publishableKey = (): string => {
  const fromPublic = clientEnv().NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (fromPublic) return fromPublic;
  if (typeof window === 'undefined' && process.env.MEDUSA_PUBLISHABLE_KEY) {
    return process.env.MEDUSA_PUBLISHABLE_KEY;
  }
  throw new AppError(
    'SERVER',
    'The commerce publishable key is not configured.',
    new Error('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY missing')
  );
};

export interface MedusaRequestInit {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** JWT from Medusa customer auth (Bearer). */
  token?: string | null;
}

export async function medusaFetch<T = MedusaJson>(
  path: string,
  init: MedusaRequestInit = {}
): Promise<T> {
  const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-publishable-api-key': publishableKey(),
    ...init.headers,
  };
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (init.token) {
    headers.Authorization = `Bearer ${init.token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'include',
    });
  } catch (e) {
    throw appError('NETWORK', e);
  }

  if (res.status === 204) {
    return {} as T;
  }

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `Medusa request failed (${res.status})`;

    if (res.status === 401 || res.status === 403) throw new AppError('UNAUTHORISED', message, data);
    if (res.status === 404) throw new AppError('NOT_FOUND', message, data);
    if (res.status === 400 || res.status === 422) throw new AppError('VALIDATION', message, data);
    if (res.status === 429) throw new AppError('RATE_LIMITED', message, data);
    throw new AppError('SERVER', message, data);
  }

  return data as T;
}
