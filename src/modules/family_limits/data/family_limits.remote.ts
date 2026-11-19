/**
 * Remote source for family_limits — paths + params only, no mapping.
 *
 * `api(..., { version: 'mock', module: 'family_limits' })` resolves to
 * `/api/mock/family_limits/<path>`; the real host is never contacted. The paths mirror the
 * PROPOSED REST shape in `api/mock-modules.md` §12, so a backend swap is a change of `version`
 * and `path` here and nothing else.
 */
import { api, type ApiEnvelope, type Result } from '@/core/network';

import { FAMILY_LIMITS_MOCK_MODULE } from '../family_limits.flags';
import type { LimitDraft } from './models/limit-member';

type Call<T> = Promise<Result<ApiEnvelope<T>>>;

const mock = { version: 'mock', module: FAMILY_LIMITS_MOCK_MODULE } as const;

export const familyLimitsRemote = {
  /** `GET members` → the cards + the summary strip. */
  members: (locale: string, signal?: AbortSignal): Call<unknown> =>
    api('GET', 'members', { ...mock, query: { locale }, signal }),

  /** `GET members/{id}`. */
  member: (id: string, locale: string, signal?: AbortSignal): Call<unknown> =>
    api('GET', `members/${encodeURIComponent(id)}`, { ...mock, query: { locale }, signal }),

  /** `PUT members/{id}` — only the four editable fields are sent. */
  save: (id: string, draft: LimitDraft, locale: string, signal?: AbortSignal): Call<unknown> =>
    api('PUT', `members/${encodeURIComponent(id)}`, {
      ...mock,
      query: { locale },
      body: {
        enabled: draft.enabled,
        period: draft.period,
        limit: draft.limit,
        categories: draft.categories,
      },
      signal,
    }),
} as const;
