/**
 * Remote source for the school module.
 *
 * Every call goes through `remote.mock('school')`, which builds `/api/mock/school/<path>` in
 * `core/network/api-client.ts` → `buildUrl`. That makes it **structurally impossible** for this
 * module to reach `api.ozio10.az`: there is no code path from here to the real host.
 *
 * The method list mirrors the PROPOSED REST shape in `api/mock-modules.md` §16 one for one:
 *
 * | here | the future endpoint |
 * | --- | --- |
 * | `grades()` | `GET /customer/api/v1/school/grades` |
 * | `uploadGradePhoto()` | `POST /customer/api/v1/school/grades/photo` (multipart) |
 * | `redeem()` | `POST /customer/api/v1/school/rewards/{id}/redeem` |
 * | `classLists()` / `createClassList()` | `GET｜POST /customer/api/v1/school/class-lists` |
 * | `deleteClassList()` | `DELETE /customer/api/v1/school/class-lists/{id}` |
 * | `addListToCart()` | `POST /customer/api/v1/school/class-lists/{id}/add-to-cart` |
 * | `studentCard()` / `linkCard()` / `unlinkCard()` | `GET｜PUT｜DELETE /customer/api/v1/school/student-card` |
 *
 * So when a backend appears, this file changes from `remote.mock('school')` to `remote` (v1) and
 * `data/school.mock.ts` is deleted. Nothing above the repository moves.
 */
import { remote, type RemoteCallOptions, type RemoteResult } from '@/core/network';

import { SCHOOL_MOCK_MODULE } from '../school.flags';

const mock = remote.mock(SCHOOL_MOCK_MODULE);

export interface CreateClassListBody {
  title: string;
  school: string;
  /** One product per line, exactly as typed in the dialog's textarea. */
  lines: string[];
}

export const schoolRemote = {
  /** `GET school/grades?locale=` — balance, grade rows and rewards. */
  grades: (locale: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.get<unknown>('grades', { locale }, opts),

  /**
   * `POST school/grades/photo` — multipart, the shape a real OCR endpoint would take.
   *
   * The file never leaves the browser: MSW answers this request inside the page's own service
   * worker and the handler ignores the bytes entirely.
   */
  uploadGradePhoto: (file: File, opts?: RemoteCallOptions): RemoteResult<unknown> => {
    const form = new FormData();
    form.append('photo', file, file.name);
    return mock.post<unknown>('grades/photo', form, opts);
  },

  /** `POST school/rewards/{id}/redeem` — spends points, 422 when the balance is short. */
  redeem: (rewardId: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.post<unknown>(`rewards/${encodeURIComponent(rewardId)}/redeem`, undefined, opts),

  /** `GET school/class-lists?offset=&limit=&locale=`. */
  classLists: (
    args: { offset: number; limit: number; locale: string },
    opts?: RemoteCallOptions,
  ): RemoteResult<unknown> => mock.get<unknown>('class-lists', { ...args }, opts),

  /** `POST school/class-lists`. */
  createClassList: (
    body: CreateClassListBody,
    locale: string,
    opts?: RemoteCallOptions,
  ): RemoteResult<unknown> =>
    mock.post<unknown>('class-lists', body, { ...opts, query: { locale } }),

  /** `DELETE school/class-lists/{id}`. */
  deleteClassList: (id: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.del<unknown>(`class-lists/${encodeURIComponent(id)}`, undefined, opts),

  /** `POST school/class-lists/{id}/add-to-cart` — answers with the count; adds nothing. */
  addListToCart: (id: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.post<unknown>(`class-lists/${encodeURIComponent(id)}/add-to-cart`, undefined, opts),

  /** `GET school/student-card?locale=`. */
  studentCard: (locale: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.get<unknown>('student-card', { locale }, opts),

  /** `PUT school/student-card` — 422 when the number is shorter than six characters. */
  linkCard: (number: string, locale: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.put<unknown>('student-card', { number }, { ...opts, query: { locale } }),

  /** `DELETE school/student-card`. */
  unlinkCard: (locale: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.del<unknown>('student-card', undefined, { ...opts, query: { locale } }),
};
