/**
 * Thin Nest API client (OpenAPI /v1).
 * Product reads do not require a publishable key.
 */

import { AppError, appError } from '../../lib/errors';
import { clientEnv } from '../../lib/config/env';
import { resolveNestApiUrl } from '../../lib/config/runtime-env';

export type NestJson = Record<string, unknown>;

const baseUrl = (): string => {
  if (typeof window === 'undefined') {
    const serverUrl = resolveNestApiUrl();
    if (serverUrl) return serverUrl;
  }
  const url = clientEnv().NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new AppError(
      'SERVER',
      'The commerce API URL is not configured.',
      new Error('NEXT_PUBLIC_API_URL / NEST_API_URL / TABASAMU_PUBLIC_API_URL missing')
    );
  }
  return url.replace(/\/$/, '');
};

const toV1Path = (path: string): string => {
  if (path.startsWith('/v1/') || path === '/v1') return path;
  return path.startsWith('/') ? `/v1${path}` : `/v1/${path}`;
};

export interface NestRequestInit {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function nestFetch<T = NestJson>(
  path: string,
  init: NestRequestInit = {}
): Promise<T> {
  const fullUrl = `${baseUrl()}${toV1Path(path)}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...init.headers,
  };
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch (e) {
    throw appError('NETWORK', e);
  }

  if (res.status === 204) return {} as T;

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
        : `API request failed (${res.status})`;

    if (res.status === 401 || res.status === 403) throw new AppError('UNAUTHORISED', message, data);
    if (res.status === 404) throw new AppError('NOT_FOUND', message, data);
    if (res.status === 400 || res.status === 422) throw new AppError('VALIDATION', message, data);
    if (res.status === 429) throw new AppError('RATE_LIMITED', message, data);
    throw new AppError('SERVER', message, data);
  }

  return data as T;
}
