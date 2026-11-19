'use client';

/**
 * Localizes an `AuthFailure`.
 *
 * The rule from `api/README.md` / `docs/BFF.md` §5: **show the server's own `message`** for
 * `validation` and `wrongCode` (the API answers usable text there), and localize a fallback by
 * kind for everything else (5xx, transport and parse messages are English stack noise).
 */
import { useTranslations } from 'next-intl';

import type { AuthFailure, AuthFailureKind } from '../data/auth.remote';

/** `AuthFailureKind` → a key in `messages/parts/errors.json`. */
const ERROR_KEY: Record<AuthFailureKind, string> = {
  network: 'network',
  timeout: 'timeout',
  unauthorized: 'unauthorized',
  notFound: 'notFound',
  server: 'server',
  parse: 'parse',
  unknown: 'unknown',
  rateLimited: 'rateLimited',
  validation: 'unknown',
  wrongCode: 'unknown',
  forbidden: 'unauthorized',
};

const SHOW_SERVER_MESSAGE: ReadonlySet<AuthFailureKind> = new Set<AuthFailureKind>([
  'validation',
  'wrongCode',
]);

export function useAuthMessage(): (failure: AuthFailure) => string {
  const errors = useTranslations('errors');
  const auth = useTranslations('auth');

  return (failure: AuthFailure) => {
    if (SHOW_SERVER_MESSAGE.has(failure.kind) && failure.hasServerMessage) {
      return failure.message;
    }
    // Our own copy for the two states that have a dedicated screen treatment.
    if (failure.kind === 'wrongCode') return auth('otp.error.wrongCode');
    if (failure.kind === 'rateLimited') return auth('otp.error.rateLimited');
    if (failure.kind === 'validation') return auth('error.validation');
    return errors(ERROR_KEY[failure.kind]);
  };
}
