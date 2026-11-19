/**
 * MSW handlers for "Üzv limitləri" (`/api/mock/family_limits/…`) — **never the real host**.
 *
 * `src/core/mocks/modules.ts` already lists `family_limits` and imports this file lazily, so
 * nothing in `src/core/mocks/` needs editing. Replies carry the real API envelope; moving to a
 * backend means changing the URL in `family_limits.remote.ts` and deleting this file. The PROPOSED
 * REST shape mirrored here is `api/mock-modules.md` §12 (`GET/PUT /v1/family/limits[/{id}]`).
 *
 * State lives in `localStorage` under `ozio.mock.family_limits`, so a saved limit survives a
 * reload. Every money value the UI shows — `spent`, `remaining`, `progress`, the summary strip —
 * is computed **here**, not in a component.
 */
import { http } from 'msw';

import {
  delay,
  flagged,
  mockError,
  mockJson,
  mockPath,
  mockValidationError,
  registerMockHandlers,
} from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';

import {
  CATEGORY_LABEL,
  SEED_MEMBERS,
  pick,
  type Locale,
  type SeedMember,
} from './family_limits.fixtures';
import { LIMIT_CATEGORIES, LIMIT_STEP_AZN, type LimitCategory } from './models/limit-member';
import { FAMILY_LIMITS_FLAG, FAMILY_LIMITS_MOCK_MODULE } from '../family_limits.flags';

/** `mock-contracts.ts` → `MOCK_LATENCY_MS`: list 600, one 400, save 500. */
const LATENCY = { list: 600, one: 400, save: 500 } as const;

interface LimitsDb {
  members: SeedMember[];
}

const db = createMockDb<LimitsDb>(FAMILY_LIMITS_MOCK_MODULE, () => ({
  members: SEED_MEMBERS.map((m) => ({ ...m, categories: [...m.categories], purchases: [...m.purchases] })),
}));

const LOCALES: readonly Locale[] = ['az', 'ru', 'en'];

function localeOf(url: string): Locale {
  const raw = (new URL(url).searchParams.get('locale') ?? 'az').toLowerCase();
  return (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'az';
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

const exhausted = (m: SeedMember): boolean => m.enabled && m.limit > 0 && m.spent >= m.limit;

function wireMember(m: SeedMember, locale: Locale) {
  const dayMs = 86_400_000;
  return {
    id: m.id,
    name: pick(m.name, locale),
    role: pick(m.role, locale),
    age: m.age ?? null,
    enabled: m.enabled,
    period: m.period,
    limit: m.limit,
    spent: round2(m.spent),
    remaining: round2(Math.max(0, m.limit - m.spent)),
    progress: m.limit <= 0 ? 0 : Math.min(1, Math.max(0, m.spent / m.limit)),
    exhausted: exhausted(m),
    categories: m.categories,
    purchases: m.purchases.map((p) => ({
      id: p.id,
      title: pick(p.title, locale),
      category: p.category,
      category_label: pick(CATEGORY_LABEL[p.category], locale),
      amount: round2(p.amount),
      date: new Date(Date.now() - p.daysAgo * dayMs).toISOString(),
    })),
  };
}

function wireSummary(members: readonly SeedMember[]) {
  return {
    spend: round2(members.reduce((sum, m) => sum + m.spent, 0)),
    active_limits: members.filter((m) => m.enabled && m.limit > 0).length,
    exhausted: members.filter(exhausted).length,
  };
}

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await request.json();
    return parsed !== null && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const familyLimitsHandlers = [
  /** `GET members` — the cards plus the `block` summary strip. */
  http.get(mockPath(FAMILY_LIMITS_MOCK_MODULE, 'members'), async ({ request }) => {
    await delay(LATENCY.list);
    const locale = localeOf(request.url);
    const members = db.get().members;
    return mockJson({
      total: members.length,
      offset: 0,
      limit: members.length,
      items: members.map((m) => wireMember(m, locale)),
      summary: wireSummary(members),
    });
  }),

  /** `GET members/{id}`. */
  http.get(mockPath(FAMILY_LIMITS_MOCK_MODULE, 'members/:id'), async ({ params, request }) => {
    await delay(LATENCY.one);
    const member = db.get().members.find((m) => m.id === String(params.id));
    if (!member) return mockError(404, 'member not found');
    return mockJson(wireMember(member, localeOf(request.url)));
  }),

  /**
   * `PUT members/{id}` — the editor drawer's save. Only `enabled`, `period`, `limit` and
   * `categories` are writable, exactly as the contract states; `spent` and `purchases` belong to
   * the (imaginary) ledger and are never touched by this call.
   */
  http.put(mockPath(FAMILY_LIMITS_MOCK_MODULE, 'members/:id'), async ({ params, request }) => {
    await delay(LATENCY.save);
    const id = String(params.id);
    const current = db.get().members.find((m) => m.id === id);
    if (!current) return mockError(404, 'member not found');

    const payload = await body(request);
    const limitRaw = Number(payload.limit);
    const period = payload.period === 'weekly' ? 'weekly' : payload.period === 'monthly' ? 'monthly' : null;

    if (period === null) {
      return mockValidationError([{ path: 'period', message: 'period must be weekly or monthly' }]);
    }
    if (!Number.isFinite(limitRaw) || limitRaw < 0) {
      return mockValidationError([{ path: 'limit', message: 'limit must be 0 or more' }]);
    }
    if (limitRaw % LIMIT_STEP_AZN !== 0) {
      return mockValidationError([
        { path: 'limit', message: `limit must be a multiple of ${LIMIT_STEP_AZN}` },
      ]);
    }

    const requested = Array.isArray(payload.categories) ? payload.categories : [];
    const categories = LIMIT_CATEGORIES.filter((c) =>
      requested.some((entry) => String(entry).toLowerCase() === c),
    ) as LimitCategory[];

    const updated: SeedMember = {
      ...current,
      enabled: payload.enabled === true,
      period,
      limit: limitRaw,
      categories,
    };

    db.set((state) => ({ members: state.members.map((m) => (m.id === id ? updated : m)) }));
    return mockJson(wireMember(updated, localeOf(request.url)));
  }),
];

registerMockHandlers(FAMILY_LIMITS_MOCK_MODULE, flagged(familyLimitsHandlers, FAMILY_LIMITS_FLAG));
