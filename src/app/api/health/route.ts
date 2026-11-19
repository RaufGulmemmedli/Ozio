/**
 * `GET /api/health` — liveness for the web app plus a reachability probe of the API.
 *
 * The probe is a single `HEAD` on a cheap verified endpoint with a 3 s timeout. *Any*
 * HTTP answer counts as `up` (even 400/404: the gateway replied); only a transport
 * failure or the timeout counts as `down`. `HEAD` is used so the probe cannot collide
 * with a real GET on the same path (api/README.md: the same path called concurrently
 * answers 429).
 */
import { NextResponse } from 'next/server';
import { upstreamUrl } from '@/core/lib/server-cookies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PROBE_TIMEOUT_MS = 3_000;

async function probeUpstream(): Promise<'up' | 'down'> {
  try {
    await fetch(upstreamUrl('v1', 'location/cities', '?country_id=1'), {
      method: 'HEAD',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return 'up';
  } catch {
    return 'down';
  }
}

export async function GET() {
  const upstream = await probeUpstream();
  return NextResponse.json(
    { ok: true, version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev', upstream },
    { headers: { 'cache-control': 'no-store' } },
  );
}
