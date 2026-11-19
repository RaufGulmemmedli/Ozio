/**
 * Query keys for the school module.
 *
 * Every read is served by MSW under `/api/mock/school/…`, so all keys live under `['school', …]`
 * and `invalidateQueries({ queryKey: schoolKeys.all })` drops the whole demo and nothing else.
 *
 * Reads whose text is localized by the mock (subject names, seller names, reward titles) are
 * wrapped in `scoped(key, locale)` by the hook, so switching language never shows stale copy.
 */
import { moduleKeys } from '@/core/query';

export const schoolKeys = {
  ...moduleKeys('school'),

  /** `GET /api/mock/school/grades?locale=` — grades + points balance + rewards. */
  grades: () => ['school', 'grades'] as const,
  /** `GET /api/mock/school/class-lists?locale=` — the shared class shopping lists. */
  classLists: () => ['school', 'class-lists'] as const,
  /** `GET /api/mock/school/student-card?locale=` — card state, number, night-discount window. */
  studentCard: () => ['school', 'student-card'] as const,
} as const;
