/**
 * MSW handlers for the school module. **Everything here is mocked** — swagger has no
 * `/school/*` operation at all (`api/mock-modules.md` §16 lists the PROPOSED REST shape these
 * handlers imitate).
 *
 *   GET    /api/mock/school/grades?locale=                 balance + grades + rewards
 *   POST   /api/mock/school/grades/photo                   fake OCR: +2 grades, +32 points
 *   POST   /api/mock/school/rewards/{id}/redeem            spends points, issues a coupon
 *   GET    /api/mock/school/class-lists?locale=            offset/limit page of class lists
 *   POST   /api/mock/school/class-lists                    create from title + school + lines
 *   DELETE /api/mock/school/class-lists/{id}               remove a list the user created
 *   POST   /api/mock/school/class-lists/{id}/add-to-cart   returns the count; adds nothing
 *   GET    /api/mock/school/student-card?locale=           state, number, night-discount window
 *   PUT    /api/mock/school/student-card                   link a number (>= 6 chars)
 *   DELETE /api/mock/school/student-card                   unlink
 *
 * Three rules this file exists to keep:
 *
 * 1. **All arithmetic lives here.** Points per grade, the new balance after a redeem, every line
 *    total, a list's total / item count / savings — the handler computes them and the response
 *    carries them. No component multiplies or adds (hard rule 7).
 * 2. **All clocks live here.** The night-discount window's `active`, `starts_at` and `ends_at` are
 *    derived from the handler's own "now" in Asia/Baku, and the card's `pending -> linked`
 *    transition is a stored deadline rather than a client-side timer. A view only counts down to
 *    an instant the mock gave it and refetches when it elapses.
 * 3. **Nothing is bought.** `add-to-cart` answers with what *would* go in the cart and sets
 *    `simulated: true`; it never touches the real cart or the real host.
 *
 * Demo state is persisted by `createMockDb` to `localStorage` under `ozio.mock.school`, so a
 * reload keeps the uploaded grades, the created lists and the linked card.
 *
 * `?preview=loading|empty|error` is handled by `useScreenQuery` in the hooks, not here.
 */
import { http } from 'msw';

import {
  delay,
  flagged,
  mockError,
  mockId,
  mockJson,
  mockPage,
  mockPath,
  mockValidationError,
  registerMockHandlers,
} from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';
import { asList, asObj, str } from '@/core/network';

import { SCHOOL_MOCK_MODULE } from '../school.flags';
import {
  CLASS_LIST_SEED,
  createdLineSeller,
  createdLineUnitPrice,
  GRADE_BALANCE_SEED,
  GRADE_SEED,
  NIGHT_CATEGORIES,
  NIGHT_DISCOUNT,
  POINTS_FOR_SCORE,
  REWARD_SEED,
  SCHOOL_DELAY_MS,
  SCHOOL_UPLOAD_DELAY_MS,
  SELLER_NAMES,
  STUDENT_CARD_NUMBER,
  STUDENT_CARD_VERIFY_MS,
  STUDENT_NUMBER_MIN_LENGTH,
  SUBJECT_NAMES,
  UPLOAD_SAMPLE_GRADES,
  type ClassListItemSeed,
  type SellerKey,
  type SubjectKey,
  type Translations,
} from './school.fixtures';

/* ------------------------------------------------------------------ demo state */

interface StoredGrade {
  id: string;
  subject: SubjectKey;
  score: number;
  date: string;
  points: number;
}

interface StoredListItem {
  id: string;
  name: Translations;
  qty: number;
  seller: SellerKey;
  unitPrice: number;
  category: string;
}

interface StoredList {
  id: string;
  title: Translations;
  school: Translations;
  sharedBy: Translations;
  savings: number;
  items: StoredListItem[];
}

interface StoredCard {
  state: 'none' | 'pending' | 'linked';
  number: string;
  /** Epoch ms after which a `pending` card reports `linked`. `0` when nothing is pending. */
  verifiedAt: number;
}

interface SchoolDb {
  grades: StoredGrade[];
  balance: number;
  /** Ids of the rewards already exchanged, so the demo cannot redeem one twice for free. */
  redeemed: string[];
  lists: StoredList[];
  card: StoredCard;
  seq: number;
}

const seedLists = (): StoredList[] =>
  CLASS_LIST_SEED.map((list) => ({
    id: list.id,
    title: list.title,
    school: list.school,
    sharedBy: list.sharedBy,
    savings: list.savings,
    items: list.items.map((item: ClassListItemSeed, index) => ({
      id: `${list.id}-i${index + 1}`,
      name: item.name,
      qty: item.qty,
      seller: item.seller,
      unitPrice: item.unitPrice,
      category: item.category,
    })),
  }));

const db = createMockDb<SchoolDb>(SCHOOL_MOCK_MODULE, () => ({
  grades: GRADE_SEED.map((g) => ({ ...g })),
  balance: GRADE_BALANCE_SEED,
  redeemed: [],
  lists: seedLists(),
  card: { state: 'none', number: '', verifiedAt: 0 },
  seq: 11,
}));

/* ------------------------------------------------------------------ arithmetic */

const round2 = (v: number): number => Math.round(v * 100) / 100;

const translationRows = (t: Translations) => t.map((row) => ({ ...row }));

const lineTotal = (item: StoredListItem): number => round2(item.unitPrice * item.qty);

const listTotal = (list: StoredList): number =>
  round2(list.items.reduce((sum, item) => sum + lineTotal(item), 0));

const listItemCount = (list: StoredList): number =>
  list.items.reduce((sum, item) => sum + item.qty, 0);

/** The wire shape for one class list — every total already computed. */
const listResponse = (list: StoredList) => ({
  id: list.id,
  title_translations: translationRows(list.title),
  school_translations: translationRows(list.school),
  shared_by_translations: translationRows(list.sharedBy),
  total: listTotal(list),
  item_count: listItemCount(list),
  savings: round2(list.savings),
  share_link: `https://ozio10.az/s/${list.id}`,
  items: list.items.map((item) => ({
    id: item.id,
    name_translations: translationRows(item.name),
    qty: item.qty,
    cheapest_seller_translations: translationRows(SELLER_NAMES[item.seller]),
    unit_price: item.unitPrice,
    line_total: lineTotal(item),
    category: item.category,
  })),
});

const gradeResponse = (grade: StoredGrade) => ({
  id: grade.id,
  subject: grade.subject,
  subject_translations: translationRows(SUBJECT_NAMES[grade.subject]),
  score: grade.score,
  date: grade.date,
  points: grade.points,
});

const gradesResponse = (state: SchoolDb) => ({
  balance: state.balance,
  grades: state.grades.map(gradeResponse),
  rewards: REWARD_SEED.filter((reward) => !state.redeemed.includes(reward.id)).map((reward) => ({
    id: reward.id,
    category: reward.category,
    percent: reward.percent,
    cost: reward.cost,
    title_translations: translationRows(reward.title),
    // The *handler* decides affordability, so the "Xal çatmır" tag is server state.
    affordable: state.balance >= reward.cost,
  })),
});

/* ------------------------------------------------------- the night-discount clock */

/**
 * The 22:00–06:00 window in **Asia/Baku**, resolved against the handler's own clock.
 *
 * `Intl` gives the Baku wall-clock parts regardless of where the browser is, so the demo behaves
 * the same in Baku and in a CI container. The returned instants are true UTC.
 */
const BAKU_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Baku',
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function bakuNow(now: Date): { hour: number; minute: number; second: number } {
  const parts = BAKU_PARTS.formatToParts(now);
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  return { hour: pick('hour') % 24, minute: pick('minute'), second: pick('second') };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function nightDiscountResponse(now: Date, linked: boolean) {
  const { hour, minute, second } = bakuNow(now);
  const { percent, startHour, endHour } = NIGHT_DISCOUNT;
  const active = hour >= startHour || hour < endHour;

  /**
   * The next instant at which the Baku wall clock reads `targetHour:00`, as true UTC. Only the
   * *distance* from now matters, so no zone offset has to be re-applied: Baku has no DST, and a
   * wall-clock delta is a real-time delta.
   */
  const nextAt = (targetHour: number): string => {
    const secondsIntoDay = hour * 3600 + minute * 60 + second;
    let delta = targetHour * 3600 - secondsIntoDay;
    if (delta <= 0) delta += 24 * 3600;
    return new Date(now.getTime() + delta * 1000).toISOString();
  };

  return {
    percent,
    // Without a card there is nothing to activate, so the banner reads "link the card first".
    active: linked && active,
    window_start: `${pad2(startHour)}:00`,
    window_end: `${pad2(endHour)}:00`,
    starts_at: active ? null : nextAt(startHour),
    ends_at: active ? nextAt(endHour) : null,
    categories: NIGHT_CATEGORIES.map((c) => ({
      id: c.id,
      name_translations: translationRows(c.name),
    })),
  };
}

const VERIFIED_NOTE: Translations = [
  { locale: 'az', name: 'Tələbə bileti nömrəsi ilə yoxlanılıb' },
  { locale: 'ru', name: 'Проверено по номеру студенческого билета' },
  { locale: 'en', name: 'Verified against the student ID number' },
];

/** Resolves a stored `pending` card whose verification deadline has passed. */
function currentCard(now: Date): StoredCard {
  const card = db.get().card;
  if (card.state === 'pending' && card.verifiedAt > 0 && now.getTime() >= card.verifiedAt) {
    return db.set((prev) => ({
      ...prev,
      card: { state: 'linked', number: prev.card.number, verifiedAt: 0 },
    })).card;
  }
  return card;
}

function cardResponse(now: Date) {
  const card = currentCard(now);
  const linked = card.state === 'linked';
  return {
    state: card.state,
    number: card.number,
    verified_note_translations: linked ? translationRows(VERIFIED_NOTE) : [],
    night_discount: nightDiscountResponse(now, linked),
  };
}

/* ------------------------------------------------------------------ handlers */

export const schoolHandlers = [
  /** The grades screen's whole payload: balance, grade rows, rewards with `affordable`. */
  http.get(mockPath(SCHOOL_MOCK_MODULE, 'grades'), async () => {
    await delay(SCHOOL_DELAY_MS);
    return mockJson(gradesResponse(db.get()));
  }),

  /**
   * The fake OCR. The web screen hands over a real `File` from `<input type="file">`; the handler
   * ignores the bytes (there is no recognition service) and prepends the two documented grades.
   */
  http.post(mockPath(SCHOOL_MOCK_MODULE, 'grades/photo'), async () => {
    await delay(SCHOOL_UPLOAD_DELAY_MS);
    const today = new Date().toISOString().slice(0, 10);

    const next = db.set((prev) => {
      let seq = prev.seq;
      const added: StoredGrade[] = UPLOAD_SAMPLE_GRADES.map((sample) => {
        seq += 1;
        return {
          id: `g${seq}`,
          subject: sample.subject,
          score: sample.score,
          date: today,
          points: POINTS_FOR_SCORE[sample.score] ?? sample.points,
        };
      });
      const delta = added.reduce((sum, g) => sum + g.points, 0);
      return { ...prev, seq, grades: [...added, ...prev.grades], balance: prev.balance + delta };
    });

    return mockJson(gradesResponse(next));
  }),

  /**
   * Spending points. Rejected with a 422 when the balance is short, so the dialog shows a field
   * error instead of the client deciding the reward is out of reach.
   */
  http.post(mockPath(SCHOOL_MOCK_MODULE, 'rewards/:id/redeem'), async ({ params }) => {
    const id = str(params.id);
    const reward = REWARD_SEED.find((r) => r.id === id);
    if (!reward) return mockError(404, 'Reward not found');

    const state = db.get();
    if (state.redeemed.includes(id)) {
      return mockValidationError([
        { path: 'reward_id', message: 'This reward has already been exchanged' },
      ]);
    }
    if (state.balance < reward.cost) {
      return mockValidationError([
        {
          path: 'reward_id',
          message: `Not enough points: ${reward.cost} needed, ${state.balance} available`,
        },
      ]);
    }

    await delay(SCHOOL_DELAY_MS);
    const next = db.set((prev) => ({
      ...prev,
      balance: prev.balance - reward.cost,
      redeemed: [...prev.redeemed, id],
    }));

    return mockJson({
      balance: next.balance,
      coupon_code: reward.couponCode,
      coupon_title_translations: translationRows(reward.title),
    });
  }),

  /** The class lists, paged the way every real list endpoint is (`offset` + `limit`). */
  http.get(mockPath(SCHOOL_MOCK_MODULE, 'class-lists'), async ({ request }) => {
    await delay(SCHOOL_DELAY_MS);
    const rows = db.get().lists.map(listResponse);
    return mockJson(mockPage(rows, request.url));
  }),

  /**
   * Creating a list. Per `mock-modules.md` §16 each line gets qty 1, an alternating seller and
   * the unit price `1.5 + index` — the handler's arithmetic, so the preview the user sees after
   * creating is server data.
   */
  http.post(mockPath(SCHOOL_MOCK_MODULE, 'class-lists'), async ({ request }) => {
    const body = asObj(await request.json().catch(() => null));
    const title = str(body.title).trim();
    const school = str(body.school).trim();
    const lines = asList(body.lines)
      .map((line) => str(line).trim())
      .filter((line) => line.length > 0);

    const issues = [
      ...(title ? [] : [{ path: 'title', message: 'A class name is required' }]),
      ...(lines.length > 0 ? [] : [{ path: 'lines', message: 'At least one product is required' }]),
    ];
    if (issues.length > 0) return mockValidationError(issues);

    await delay(SCHOOL_DELAY_MS);

    // A user-typed line has no translation; the same text is sent for all three locales so the
    // row shape stays identical to a seeded one.
    const sameInEveryLocale = (text: string): Translations => [
      { locale: 'az', name: text },
      { locale: 'ru', name: text },
      { locale: 'en', name: text },
    ];

    const id = mockId('l');
    const created: StoredList = {
      id,
      title: sameInEveryLocale(title),
      school: sameInEveryLocale(school),
      sharedBy: [],
      savings: 0,
      items: lines.map((line, index) => ({
        id: `${id}-i${index + 1}`,
        name: sameInEveryLocale(line),
        qty: 1,
        seller: createdLineSeller(index),
        unitPrice: createdLineUnitPrice(index),
        category: 'stationery',
      })),
    };

    db.set((prev) => ({ ...prev, lists: [created, ...prev.lists] }));
    return mockJson(listResponse(created));
  }),

  /** Removing a list. Returns 404 for an id that is not in the demo db. */
  http.delete(mockPath(SCHOOL_MOCK_MODULE, 'class-lists/:id'), async ({ params }) => {
    const id = str(params.id);
    if (!db.get().lists.some((list) => list.id === id)) {
      return mockError(404, 'Class list not found');
    }
    await delay(400);
    db.set((prev) => ({ ...prev, lists: prev.lists.filter((list) => list.id !== id) }));
    return mockJson({ deleted: true, id });
  }),

  /**
   * "Hamısını səbətə at". **Nothing is added to a cart** — there is no catalogue behind these
   * supplies, so the handler answers with what would go in it and marks the answer simulated.
   */
  http.post(mockPath(SCHOOL_MOCK_MODULE, 'class-lists/:id/add-to-cart'), async ({ params }) => {
    const id = str(params.id);
    const list = db.get().lists.find((row) => row.id === id);
    if (!list) return mockError(404, 'Class list not found');

    await delay(SCHOOL_DELAY_MS);
    return mockJson({ item_count: listItemCount(list), total: listTotal(list), simulated: true });
  }),

  /** The card plus the night-discount window, both as of the handler's own clock. */
  http.get(mockPath(SCHOOL_MOCK_MODULE, 'student-card'), async () => {
    await delay(SCHOOL_DELAY_MS);
    return mockJson(cardResponse(new Date()));
  }),

  /**
   * Linking a card. A number shorter than six characters is a 422 the form displays — the client
   * must not be the thing that decides a number is too short.
   *
   * The response is deliberately `pending`: the UI shows the "Yoxlanılır" panel and refetches
   * once `STUDENT_CARD_VERIFY_MS` has passed, at which point `GET` reports `linked`.
   */
  http.put(mockPath(SCHOOL_MOCK_MODULE, 'student-card'), async ({ request }) => {
    const body = asObj(await request.json().catch(() => null));
    const number = str(body.number).trim().toUpperCase();

    if (number.length < STUDENT_NUMBER_MIN_LENGTH) {
      return mockValidationError([
        {
          path: 'number',
          message: `The number must be at least ${STUDENT_NUMBER_MIN_LENGTH} characters`,
        },
      ]);
    }

    await delay(350);
    const now = Date.now();
    db.set((prev) => ({
      ...prev,
      card: { state: 'pending', number, verifiedAt: now + STUDENT_CARD_VERIFY_MS },
    }));
    return mockJson(cardResponse(new Date(now)));
  }),

  /** Unlinking. Back to `none`, which also closes the night-discount banner. */
  http.delete(mockPath(SCHOOL_MOCK_MODULE, 'student-card'), async () => {
    await delay(400);
    db.set((prev) => ({ ...prev, card: { state: 'none', number: '', verifiedAt: 0 } }));
    return mockJson(cardResponse(new Date()));
  }),
];

/**
 * A demo hook, documented in the report: the handler accepts any number of six characters or
 * more, but `TB-204518` is the one the export draws, so the form's placeholder suggests it.
 */
export const SAMPLE_STUDENT_NUMBER = STUDENT_CARD_NUMBER;

registerMockHandlers(SCHOOL_MOCK_MODULE, flagged(schoolHandlers, SCHOOL_MOCK_MODULE));
