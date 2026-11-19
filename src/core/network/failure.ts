/**
 * Failure — the single error type the whole app sees (port of lib/core/network/failure.dart).
 *
 * UI never sees a raw exception: every 4xx/5xx, offline, timeout and parse problem is classified
 * into one of `FailureKind`. The server's own text is kept when it sent one (`hasServerMessage`),
 * otherwise `message` holds a client fallback that the UI is expected to localise.
 *
 * API facts this mirrors (api/README.md):
 *  - 401 **and 403** -> unauthorized; 404 -> notFound; 429 -> rateLimited (plain-text body); >=500 -> server.
 *  - 422 is the only error carrying `data`: `data: [{ path, message }]`, `path` may be an array (join with '.').
 *  - A 200 with `success: false` is a failure (message in `message`).
 */

export type FailureKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'notFound'
  | 'server'
  | 'parse'
  | 'unknown'
  | 'rateLimited';

export interface FieldError {
  /** Dot-joined field path, e.g. `delivery.address_id`. */
  path: string;
  message: string;
}

/** Client fallbacks (az). The UI should localise by `kind`; these keep a Failure readable in logs. */
export const FAILURE_FALLBACK: Record<FailureKind, string> = {
  network: 'İnternet bağlantısı yoxdur',
  timeout: 'Bağlantı vaxtı bitdi',
  unauthorized: 'Giriş tələb olunur',
  notFound: 'Tapılmadı',
  server: 'Server xətası',
  parse: 'Cavabı oxumaq mümkün olmadı',
  unknown: 'Naməlum xəta',
  rateLimited: 'Çox sayda sorğu',
};

/** Shape of the envelope `Failure.fromEnvelope` reads (structural, so `ApiEnvelope` is not imported). */
export interface FailureEnvelopeLike {
  success: boolean;
  message?: string;
  statusCode?: number;
  data?: unknown;
}

const asRecord = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const trimmed = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s ? s : undefined;
};

/** The gateway answers 429 and unknown routes with plain text / Express HTML, not JSON. */
const isHtml = (s: string): boolean => s.trimStart().startsWith('<');

/** Server message from a JSON body (`message` / `error` / `msg`) or from a short plain-text body. */
function extractMessage(body: unknown): string | undefined {
  if (typeof body === 'string') {
    const s = trimmed(body);
    return s && !isHtml(s) && s.length <= 200 ? s : undefined;
  }
  const m = asRecord(body);
  return trimmed(m.message) ?? trimmed(m.error) ?? trimmed(m.msg);
}

/** 422 validation issues: `data: [{ path, message }]`; `path` may be a string or an array. */
function extractFieldErrors(body: unknown): FieldError[] {
  const m = asRecord(body);
  const rows = m.data ?? m.errors;
  if (!Array.isArray(rows)) return [];
  const out: FieldError[] = [];
  for (const row of rows) {
    const r = asRecord(row);
    const message = trimmed(r.message);
    if (!message) continue;
    const rawPath = r.path ?? r.field ?? r.key;
    const path = Array.isArray(rawPath)
      ? rawPath.map((p) => String(p)).join('.')
      : rawPath === undefined || rawPath === null
        ? ''
        : String(rawPath);
    out.push({ path, message });
  }
  return out;
}

function kindForStatus(code: number): FailureKind {
  if (code === 401 || code === 403) return 'unauthorized';
  if (code === 404) return 'notFound';
  if (code === 429) return 'rateLimited';
  if (code >= 500) return 'server';
  return 'server';
}

export class Failure extends Error {
  readonly kind: FailureKind;
  readonly statusCode?: number;
  /** 422 only. Feed into react-hook-form `setError(path, message)`. */
  readonly fieldErrors: FieldError[];
  /** True when `message` is the server's own text (show it for 400/422, localise otherwise). */
  readonly hasServerMessage: boolean;

  constructor(
    kind: FailureKind,
    message?: string,
    statusCode?: number,
    fieldErrors: FieldError[] = [],
    hasServerMessage = false,
  ) {
    super(message && message.trim() ? message.trim() : FAILURE_FALLBACK[kind]);
    this.name = 'Failure';
    this.kind = kind;
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
    this.hasServerMessage = hasServerMessage;
  }

  /** HTTP status + (possibly non-JSON) body -> Failure. */
  static fromStatus(code: number, body: unknown): Failure {
    const serverMessage = extractMessage(body);
    return new Failure(
      kindForStatus(code),
      serverMessage,
      code,
      extractFieldErrors(body),
      serverMessage !== undefined,
    );
  }

  /** A 200 whose envelope says `success: false` (or carries a 4xx/5xx `statusCode`). */
  static fromEnvelope(env: FailureEnvelopeLike): Failure {
    const serverMessage = trimmed(env.message);
    const code = typeof env.statusCode === 'number' ? env.statusCode : undefined;
    return new Failure(
      code === undefined ? 'server' : kindForStatus(code),
      serverMessage,
      code,
      extractFieldErrors(env),
      serverMessage !== undefined,
    );
  }

  /**
   * Thrown value -> Failure. `TypeError` from fetch means offline -> `network`.
   * An **AbortError is rethrown, never converted**: cancellation belongs to TanStack Query,
   * not to the error channel.
   */
  static fromError(e: unknown): Failure {
    if (e instanceof Failure) return e;
    const name = typeof e === 'object' && e !== null ? String((e as { name?: unknown }).name ?? '') : '';
    if (name === 'AbortError') throw e;
    if (name === 'TimeoutError') return new Failure('timeout');
    if (e instanceof TypeError) return new Failure('network');
    if (e instanceof SyntaxError) return new Failure('parse');
    if (e instanceof Error) return new Failure('unknown', e.message);
    return new Failure('unknown');
  }

  /** Keeps `Failure` readable in BFF / server logs (Error fields are not enumerable). */
  toJSON(): {
    kind: FailureKind;
    message: string;
    statusCode?: number;
    fieldErrors: FieldError[];
    hasServerMessage: boolean;
  } {
    return {
      kind: this.kind,
      message: this.message,
      statusCode: this.statusCode,
      fieldErrors: this.fieldErrors,
      hasServerMessage: this.hasServerMessage,
    };
  }
}

/** 400 / 422 (or anything carrying field errors): show the server's own text, map 422 onto the form. */
export const isValidation = (f: Failure): boolean =>
  f.statusCode === 400 || f.statusCode === 422 || f.fieldErrors.length > 0;

/** Handled globally (session-expired dialog) — screens never render this. */
export const isAuthFailure = (f: Failure): boolean => f.kind === 'unauthorized';
