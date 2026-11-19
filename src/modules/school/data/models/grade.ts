/**
 * Grades → points domain models.
 *
 * `parseX` never throws (hard rule 6): a malformed row degrades to safe defaults so one bad field
 * can never blank a screen.
 *
 * Nothing here computes money or points. `points`, `balance`, `cost` and `affordable` all arrive
 * from the mock, which is the stand-in for `GET /customer/api/v1/school/grades`.
 */
import { asList, asObj, bool, dateIso, int, num, pickTranslation, str } from '@/core/network';

export const SCHOOL_SUBJECTS = ['math', 'az', 'en', 'science', 'history'] as const;
export type SchoolSubject = (typeof SCHOOL_SUBJECTS)[number];

export const REWARD_CATEGORIES = ['books', 'sports', 'accessories'] as const;
export type RewardCategory = (typeof REWARD_CATEGORIES)[number];

export interface Grade {
  id: string;
  subject: SchoolSubject;
  /** The localized subject name, e.g. "Riyaziyyat". */
  subjectName: string;
  /** 1…5. */
  score: number;
  /** ISO date (no time); the UI renders it with `useFormat().date(…, 'dayMonth')`. */
  date: string | null;
  /** Points this grade earned — server arithmetic, never recomputed. */
  points: number;
}

export interface SchoolReward {
  id: string;
  category: RewardCategory;
  percent: number;
  cost: number;
  /** Localized, e.g. "5% kitab endirimi". */
  title: string;
  /** Decided by the mock against the current balance — the button never computes it. */
  affordable: boolean;
}

export interface GradesData {
  balance: number;
  grades: Grade[];
  rewards: SchoolReward[];
}

export const EMPTY_GRADES_DATA: GradesData = { balance: 0, grades: [], rewards: [] };

const asSubject = (v: unknown): SchoolSubject => {
  const s = str(v).toLowerCase();
  return (SCHOOL_SUBJECTS as readonly string[]).includes(s) ? (s as SchoolSubject) : 'math';
};

const asRewardCategory = (v: unknown): RewardCategory => {
  const s = str(v).toLowerCase();
  return (REWARD_CATEGORIES as readonly string[]).includes(s) ? (s as RewardCategory) : 'books';
};

export function parseGrade(raw: unknown, locale = 'az'): Grade {
  const row = asObj(raw);
  const subject = asSubject(row.subject);
  return {
    id: str(row.id) || subject,
    subject,
    subjectName: pickTranslation(row.subject_translations, locale) || subject,
    score: Math.min(5, Math.max(1, int(row.score, 1))),
    date: dateIso(row.date),
    points: int(row.points),
  };
}

export function parseReward(raw: unknown, locale = 'az'): SchoolReward {
  const row = asObj(raw);
  const category = asRewardCategory(row.category);
  return {
    id: str(row.id) || category,
    category,
    percent: int(row.percent),
    cost: int(row.cost),
    title: pickTranslation(row.title_translations, locale),
    affordable: bool(row.affordable),
  };
}

export function parseGradesData(raw: unknown, locale = 'az'): GradesData {
  const row = asObj(raw);
  return {
    balance: int(row.balance),
    grades: asList(row.grades).map((g) => parseGrade(g, locale)),
    rewards: asList(row.rewards).map((r) => parseReward(r, locale)),
  };
}

/** What `POST rewards/{id}/redeem` answers with: the new balance and the coupon it created. */
export interface RedeemResult {
  balance: number;
  couponCode: string;
  couponTitle: string;
}

export function parseRedeemResult(raw: unknown, locale = 'az'): RedeemResult {
  const row = asObj(raw);
  return {
    balance: int(row.balance),
    couponCode: str(row.coupon_code),
    couponTitle: pickTranslation(row.coupon_title_translations, locale),
  };
}

/**
 * The score badge tint. A presentation decision, not data — the design draws 5 and 4 on the
 * success tint and anything lower on the brand tint.
 */
export const scoreTone = (score: number): 'success' | 'sky' | 'brand' => {
  if (score >= 5) return 'success';
  if (score === 4) return 'sky';
  return 'brand';
};

/** Points earned per grade, used only by the mock's own arithmetic (never by a view). */
export const isBonusScore = (score: number): boolean => score >= 4;

/** `num()` is re-exported nowhere; this keeps the import above honest for tree-shaking. */
export const asPoints = (v: unknown): number => Math.max(0, Math.round(num(v)));
