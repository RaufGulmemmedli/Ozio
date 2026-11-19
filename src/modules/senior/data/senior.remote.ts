/**
 * Remote source for the senior module — paths + params only, no mapping.
 *
 * `api(..., { version: 'mock', module: 'senior' })` resolves to `/api/mock/senior/<path>`; the
 * real host is never contacted. The paths mirror the PROPOSED REST shape in
 * `api/mock-modules.md` §13, so a backend swap is a change of `version` and `path` here.
 */
import { api, type ApiEnvelope, type Result } from '@/core/network';

import { SENIOR_MOCK_MODULE } from '../senior.flags';
import type { HelpKind, HelpStatus } from './models/help-request';

type Call<T> = Promise<Result<ApiEnvelope<T>>>;

const mock = { version: 'mock', module: SENIOR_MOCK_MODULE } as const;

export const seniorRemote = {
  /** `GET pension-plan`. */
  plan: (locale: string, signal?: AbortSignal): Call<unknown> =>
    api('GET', 'pension-plan', { ...mock, query: { locale }, signal }),

  /** `PUT pension-plan` — the "Hər ay təkrarla" switch. */
  setAutoRepeat: (value: boolean, locale: string, signal?: AbortSignal): Call<unknown> =>
    api('PUT', 'pension-plan', { ...mock, query: { locale }, body: { auto_repeat: value }, signal }),

  /** `POST pension-plan/order` — demo only, nothing is ordered or charged. */
  order: (locale: string, signal?: AbortSignal): Call<unknown> =>
    api('POST', 'pension-plan/order', { ...mock, query: { locale }, signal }),

  /** `GET help-requests` → both sides of the neighbour board. */
  board: (locale: string, signal?: AbortSignal): Call<unknown> =>
    api('GET', 'help-requests', { ...mock, query: { locale }, signal }),

  /** `POST help-requests` — "Yeni sorğu". */
  create: (kind: HelpKind, note: string, locale: string, signal?: AbortSignal): Call<unknown> =>
    api('POST', 'help-requests', { ...mock, query: { locale }, body: { kind, note }, signal }),

  /** `PATCH help-requests/{id}` — "Köməyə get" / "Tamamlandı". */
  setStatus: (
    id: string,
    status: HelpStatus,
    locale: string,
    signal?: AbortSignal,
  ): Call<unknown> =>
    api('PATCH', `help-requests/${encodeURIComponent(id)}`, {
      ...mock,
      query: { locale },
      body: { status },
      signal,
    }),
} as const;
