/**
 * The school repository — the only thing the hooks import.
 *
 * `remote -> parse -> Result<DomainModel>`; parsers never throw, so every failure arrives as a
 * `Failure` and `unwrap()` in the hook is the single place that turns one into a thrown error for
 * TanStack Query.
 *
 * The signatures are the ones a real-API module would expose, which is the point: replacing the
 * mock means editing `school.remote.ts` and deleting `school.mock.ts`, and this file does not
 * change at all.
 */
import { mapResult, parsePage, type Page, type Result } from '@/core/network';

import {
  parseAddListToCartResult,
  parseClassList,
  type AddListToCartResult,
  type ClassList,
} from './models/class-list';
import {
  EMPTY_GRADES_DATA,
  parseGradesData,
  parseRedeemResult,
  type GradesData,
  type RedeemResult,
} from './models/grade';
import {
  EMPTY_STUDENT_CARD,
  parseStudentCard,
  type StudentCard,
} from './models/student-card';
import { schoolRemote, type CreateClassListBody } from './school.remote';

export const schoolRepository = {
  /** Balance + grades + rewards. */
  grades: async (locale: string, signal?: AbortSignal): Promise<Result<GradesData>> =>
    mapResult(await schoolRemote.grades(locale, { signal }), (env) =>
      env.data === null ? EMPTY_GRADES_DATA : parseGradesData(env.data, locale),
    ),

  /** The fake OCR: hands back the whole updated `GradesData`, not a diff. */
  uploadGradePhoto: async (
    file: File,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<GradesData>> =>
    mapResult(await schoolRemote.uploadGradePhoto(file, { signal }), (env) =>
      env.data === null ? EMPTY_GRADES_DATA : parseGradesData(env.data, locale),
    ),

  /** Spends points for a reward. A short balance comes back as a 422 `Failure`. */
  redeem: async (
    rewardId: string,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<RedeemResult>> =>
    mapResult(await schoolRemote.redeem(rewardId, { signal }), (env) =>
      parseRedeemResult(env.data, locale),
    ),

  /** One `offset`/`limit` page of class lists. */
  classLists: async (
    args: { offset: number; limit: number; locale: string },
    signal?: AbortSignal,
  ): Promise<Result<Page<ClassList>>> =>
    mapResult(await schoolRemote.classLists(args, { signal }), (env) =>
      parsePage<ClassList>(env.data, (row) => parseClassList(row, args.locale), {
        offset: args.offset,
        limit: args.limit,
      }),
    ),

  createClassList: async (
    body: CreateClassListBody,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<ClassList>> =>
    mapResult(await schoolRemote.createClassList(body, locale, { signal }), (env) =>
      parseClassList(env.data, locale),
    ),

  deleteClassList: async (id: string, signal?: AbortSignal): Promise<Result<string>> =>
    mapResult(await schoolRemote.deleteClassList(id, { signal }), () => id),

  /** Returns what *would* be added to the cart. Nothing is ordered. */
  addListToCart: async (
    id: string,
    signal?: AbortSignal,
  ): Promise<Result<AddListToCartResult>> =>
    mapResult(await schoolRemote.addListToCart(id, { signal }), (env) =>
      parseAddListToCartResult(env.data),
    ),

  /** Card state + number + the night-discount window, all as of the server's clock. */
  studentCard: async (locale: string, signal?: AbortSignal): Promise<Result<StudentCard>> =>
    mapResult(await schoolRemote.studentCard(locale, { signal }), (env) =>
      env.data === null ? EMPTY_STUDENT_CARD : parseStudentCard(env.data, locale),
    ),

  /** Answers `pending`; a later `studentCard()` read reports `linked`. */
  linkCard: async (
    number: string,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<StudentCard>> =>
    mapResult(await schoolRemote.linkCard(number, locale, { signal }), (env) =>
      parseStudentCard(env.data, locale),
    ),

  unlinkCard: async (locale: string, signal?: AbortSignal): Promise<Result<StudentCard>> =>
    mapResult(await schoolRemote.unlinkCard(locale, { signal }), (env) =>
      parseStudentCard(env.data, locale),
    ),
};

export type { CreateClassListBody };
