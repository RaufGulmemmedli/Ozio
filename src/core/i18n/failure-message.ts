import { useTranslations } from 'next-intl';

import type { Failure, FailureKind } from '@/core/network';

/** Every `FailureKind` has a key in `messages/parts/errors.json`. */
const KIND_KEYS: Record<FailureKind, string> = {
  network: 'network',
  timeout: 'timeout',
  unauthorized: 'unauthorized',
  notFound: 'notFound',
  server: 'server',
  parse: 'parse',
  unknown: 'unknown',
  rateLimited: 'rateLimited',
};

/**
 * The API returns usable Azerbaijani/Russian text on 400 and 422 (validation and
 * business rules) — that beats any generic string we could show. Everything else
 * (5xx, transport, parse) gets the localized `errors.<kind>` copy, because the
 * server text there is either English stack noise or absent.
 */
export function preferServerMessage(failure: Failure): boolean {
  return (
    failure.hasServerMessage &&
    (failure.statusCode === 400 || failure.statusCode === 422) &&
    failure.message.trim().length > 0
  );
}

/** `errors.<kind>` — for `getTranslations()` in server components. */
export function failureMessageKey(failure: Failure): string {
  return `errors.${KIND_KEYS[failure.kind] ?? 'unknown'}`;
}

/** `const failureMessage = useFailureMessage(); failureMessage(failure)` */
export function useFailureMessage(): (failure: Failure) => string {
  const t = useTranslations('errors');

  return (failure: Failure) => {
    if (preferServerMessage(failure)) return failure.message.trim();
    return t(KIND_KEYS[failure.kind] ?? 'unknown');
  };
}
