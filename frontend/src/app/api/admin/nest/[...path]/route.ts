import { NextRequest, NextResponse } from 'next/server';
import { isNonProductionAppEnv } from '../../../../../lib/config/runtime-env';
import { resolveNestApiUrl } from '../../../../../lib/config/runtime-env';

export const dynamic = 'force-dynamic';

function appEnv(): string {
  return (
    process.env.TABASAMU_APP_ENV ||
    process.env.NEXT_PUBLIC_APP_ENV ||
    'production'
  );
}

function isBffAllowed(): boolean {
  return isNonProductionAppEnv(appEnv());
}

function nestAdminBase(): string {
  const nest = resolveNestApiUrl();
  // Nest admin routes live under /v1/admin/*
  if (nest.endsWith('/v1')) return nest;
  return `${nest}/v1`;
}

async function proxy(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  if (!isBffAllowed()) {
    return NextResponse.json(
      { message: 'Admin Nest proxy is disabled in this environment.' },
      { status: 403 }
    );
  }

  const apiKey = process.env.ADMIN_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { message: 'ADMIN_API_KEY is not configured on the frontend server.' },
      { status: 503 }
    );
  }

  const subPath = pathSegments.map(encodeURIComponent).join('/');
  const search = request.nextUrl.search;
  const target = `${nestAdminBase()}/${subPath}${search}`;

  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('X-Admin-Api-Key', apiKey);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.text();
    if (body) init.body = body;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (e) {
    return NextResponse.json(
      {
        message: 'Failed to reach Nest admin API.',
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 }
    );
  }

  const text = await upstream.text();
  const outHeaders = new Headers();
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) outHeaders.set('content-type', upstreamType);

  return new NextResponse(text, {
    status: upstream.status,
    headers: outHeaders,
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path ?? []);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path ?? []);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path ?? []);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path ?? []);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path ?? []);
}
