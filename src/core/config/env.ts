/**
 * Environment (architecture/10-env-and-tooling.md), validated with zod.
 *
 * `publicEnv` — `NEXT_PUBLIC_*`, validated at module load (safe: inlined at build time, so a bad
 *               value is a build-time problem, not a runtime one).
 * `serverEnv` — server-only values, validated LAZILY on first property read, so importing this
 *               module from a client bundle (or during `next build` page collection) can never
 *               blow up on a missing server secret.
 *
 * Every optional var has a local-dev default, so a missing `.env.local` never fails the build.
 * `process.env.X` is always written out literally — Next only inlines literal member access.
 */
import { z } from 'zod';

const flag = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : v === '1' || v === 'true'));

const nonEmpty = (def: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : v));

const optionalString = () =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : v));

// ---------------------------------------------------------------------------------------------
// server
// ---------------------------------------------------------------------------------------------

const serverSchema = z.object({
  /** Upstream API used by the BFF + server fetches. Never exposed to the browser. */
  API_BASE_URL: nonEmpty('https://api.ozio10.az'),
  /** Cookie scope (`.ozio.az` in prod, empty on localhost). */
  COOKIE_DOMAIN: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? '' : v)),
  /** `Secure` on session cookies. `0` only on localhost. */
  SESSION_COOKIE_SECURE: flag(process.env.NODE_ENV === 'production'),
  /** Double-submit CSRF token signing key. */
  CSRF_SECRET: nonEmpty('ozio-dev-csrf-secret-change-me-32bytes'),
  /** BFF request logging (method/path/status, tokens + phones redacted). */
  DEBUG_API_LOG: flag(process.env.NODE_ENV !== 'production'),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let serverCache: ServerEnv | null = null;

/** Validate (once) and return the server env. Throws only when a value is present but invalid. */
export function getServerEnv(): ServerEnv {
  if (serverCache) return serverCache;
  const parsed = serverSchema.safeParse({
    API_BASE_URL: process.env.API_BASE_URL,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    SESSION_COOKIE_SECURE: process.env.SESSION_COOKIE_SECURE,
    CSRF_SECRET: process.env.CSRF_SECRET,
    DEBUG_API_LOG: process.env.DEBUG_API_LOG,
  });
  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${formatIssues(parsed.error)}`);
  }
  serverCache = parsed.data;
  return serverCache;
}

/**
 * Lazily validated server env with plain property access: `serverEnv.API_BASE_URL`.
 * Nothing is read (and nothing can throw) until a property is actually touched.
 */
export const serverEnv: ServerEnv = new Proxy({} as ServerEnv, {
  get: (_target, key: string) => getServerEnv()[key as keyof ServerEnv],
  has: (_target, key: string) => key in getServerEnv(),
  ownKeys: () => Reflect.ownKeys(getServerEnv()),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
});

// ---------------------------------------------------------------------------------------------
// public
// ---------------------------------------------------------------------------------------------

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: nonEmpty('http://localhost:3000'),
  NEXT_PUBLIC_DEFAULT_LOCALE: z
    .string()
    .optional()
    .transform((v) => (v === 'ru' || v === 'en' ? v : 'az'))
    .pipe(z.enum(['az', 'ru', 'en'])),
  /** `?preview=` screen states and the middleware guard bypass. `0` in production. */
  NEXT_PUBLIC_ENABLE_PREVIEW: flag(process.env.NODE_ENV !== 'production'),
  /** MSW mode — see 08-feature-flags-mocks.md. */
  NEXT_PUBLIC_MSW: z
    .string()
    .optional()
    .transform((v) => (v === 'all' || v === 'off' ? v : 'mock-modules'))
    .pipe(z.enum(['mock-modules', 'all', 'off'])),
  /** `next/image` remotePatterns hosts. */
  NEXT_PUBLIC_IMAGE_HOSTS: z
    .string()
    .optional()
    .transform((v) =>
      (v && v.length > 0 ? v : 'api.ozio10.az,cdn.ozio10.az')
        .split(',')
        .map((h) => h.trim())
        .filter((h) => h.length > 0),
    ),
  NEXT_PUBLIC_APP_VERSION: nonEmpty('dev'),
  NEXT_PUBLIC_ANALYTICS_ID: optionalString(),
  NEXT_PUBLIC_ANALYTICS_HOST: optionalString(),
  NEXT_PUBLIC_SENTRY_DSN: optionalString(),
});

export type PublicEnv = z.infer<typeof publicSchema>;

const publicParsed = publicSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_ENABLE_PREVIEW: process.env.NEXT_PUBLIC_ENABLE_PREVIEW,
  NEXT_PUBLIC_MSW: process.env.NEXT_PUBLIC_MSW,
  NEXT_PUBLIC_IMAGE_HOSTS: process.env.NEXT_PUBLIC_IMAGE_HOSTS,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  NEXT_PUBLIC_ANALYTICS_HOST: process.env.NEXT_PUBLIC_ANALYTICS_HOST,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

if (!publicParsed.success) {
  // Defaults cover every optional var, so this only fires on a genuinely malformed value.
  console.warn(`[env] invalid NEXT_PUBLIC_* values, falling back to defaults: ${formatIssues(publicParsed.error)}`);
}

export const publicEnv: PublicEnv = publicParsed.success
  ? publicParsed.data
  : publicSchema.parse({});

// ---------------------------------------------------------------------------------------------
// derived helpers
// ---------------------------------------------------------------------------------------------

/** `?preview=` states and the middleware guard bypass are allowed. */
export const previewEnabled = publicEnv.NEXT_PUBLIC_ENABLE_PREVIEW;
/** MSW mode: which handler set is started. */
export const mswMode = publicEnv.NEXT_PUBLIC_MSW;
export const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
export const appVersion = publicEnv.NEXT_PUBLIC_APP_VERSION;
export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';

function formatIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
}
