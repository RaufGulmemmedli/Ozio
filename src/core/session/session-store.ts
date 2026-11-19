/**
 * Session store (architecture/03-auth-session.md "Session store").
 *
 * Tokens live in httpOnly cookies set by `app/api/auth/*`; this store only ever holds the
 * *status* plus a small user summary, which it reads from the same-origin `/api/auth/session`
 * route. No token ever reaches JS.
 *
 * `status === 'unknown'` means "render the page skeleton" — never a blank screen or a spinner.
 */
import { create } from 'zustand';

export type AuthStatus = 'unknown' | 'guest' | 'authenticated';

/**
 * The little bit of the profile the shell needs everywhere (header, card tile, greeting).
 * Mirrors the shape produced by `GET /api/auth/session` (F2) — only fields that
 * `GET v1/profile/me` really returns: no email, no avatar, no loyalty tier.
 */
export interface UserSummary {
  id: number | null;
  /** Full name as one string — the API has no first/last split. */
  name: string | null;
  /** E.164, `+994XXXXXXXXX`. Never logged. */
  phone: string | null;
  /** `is_registered` from `v1/profile/me`: false => the registration step is still pending. */
  isRegistered: boolean;
  gender: string | null;
  /** Date part only (`YYYY-MM-DD`). */
  birthDate: string | null;
  refCode: string | null;
  /** Spendable bonus balance in AZN, as sent by the server. Never computed on the client. */
  bonus: number | null;
  /** Lifetime bonus earned, from the first bonus card. */
  bonusTotal: number | null;
  /** Primary bonus card number, digits only (for the card screen / barcode). */
  cardNumber: string | null;
  activeOrderCount: number;
}

export interface SessionState {
  status: AuthStatus;
  user: UserSummary | null;
  /** Set when the BFF answers `401 + x-ozio-session: expired` => `<SessionExpiredDialog>`. */
  expired: boolean;
  /** Double-submit CSRF token mirror (`ozio_csrf`), sent as `x-ozio-csrf` on mutations. */
  csrf: string | null;
  hydrate(): Promise<void>;
  setAuthenticated(u: UserSummary): void;
  signOut(): Promise<void>;
  markExpired(): void;
  /** Seed from the server layout (cookie read) to avoid an `unknown` flash. */
  setInitialSession(initial: InitialSession): void;
}

/** What the server layout already knows about the session (status + raw user row). */
export interface InitialSession {
  status?: AuthStatus | string | undefined;
  user?: unknown;
  csrf?: string | null;
}

/** `Session.addSignOutListener` — queryClient.clear(), zustand resets, per-user storage keys. */
export const signOutListeners: Array<() => void> = [];

/** Register a sign-out listener; returns the unsubscribe function. */
export function addSignOutListener(fn: () => void): () => void {
  signOutListeners.push(fn);
  return () => {
    const i = signOutListeners.indexOf(fn);
    if (i >= 0) signOutListeners.splice(i, 1);
  };
}

function runSignOutListeners(): void {
  for (const fn of [...signOutListeners]) {
    try {
      fn();
    } catch {
      // a broken listener must never block sign-out
    }
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'unknown',
  user: null,
  expired: false,
  csrf: null,

  async hydrate() {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      const body: unknown = await res.json();
      const snapshot = parseSessionResponse(body);
      set({
        status: snapshot.status,
        user: snapshot.user,
        csrf: snapshot.csrf,
        // A fresh answer from the session route settles the question either way.
        expired: false,
      });
    } catch {
      // Offline or a broken session route: treat the visitor as a guest, never as authenticated.
      set({ status: 'guest', user: null });
    }
  },

  setAuthenticated: (user) => set({ status: 'authenticated', user, expired: false }),

  async signOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Clearing the client session matters more than the round trip succeeding.
    }
    runSignOutListeners();
    set({ status: 'guest', user: null, expired: false, csrf: null });
  },

  markExpired: () => set({ expired: true }),

  setInitialSession: (initial) =>
    set((prev) => {
      // Only seeds the first, still-unknown state: a live answer always wins over the SSR guess.
      if (prev.status !== 'unknown') return prev;
      const status: AuthStatus =
        initial.status === 'authenticated'
          ? 'authenticated'
          : initial.status === 'guest'
            ? 'guest'
            : 'unknown';
      if (status === 'unknown') return prev;
      return {
        status,
        user: status === 'authenticated' ? parseUserSummary(initial.user) : null,
        csrf: initial.csrf ?? prev.csrf,
      };
    }),
}));

/** Non-hook read, for route handlers / imperative helpers. */
export const sessionState = () => useSessionStore.getState();

/**
 * Seed the store from what the server layout already resolved (cookie read), so a signed-in user
 * never sees a guest shell flash. Called once by the root client provider.
 */
export function setInitialSession(initial: InitialSession): void {
  useSessionStore.getState().setInitialSession(initial);
}

/** Alias kept for the provider glue, which looks for this name first. */
export const hydrateSession = setInitialSession;

interface SessionSnapshot {
  status: AuthStatus;
  user: UserSummary | null;
  csrf: string | null;
}

/** Tolerant parser for `/api/auth/session` — never throws, never guesses `authenticated`. */
export function parseSessionResponse(body: unknown): SessionSnapshot {
  const obj = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const raw = typeof obj.status === 'string' ? obj.status : '';
  const status: AuthStatus = raw === 'authenticated' ? 'authenticated' : 'guest';
  return {
    status,
    user: status === 'authenticated' ? parseUserSummary(obj.user) : null,
    csrf: typeof obj.csrf === 'string' && obj.csrf.length > 0 ? obj.csrf : null,
  };
}

/**
 * Tolerant `UserSummary` reader. Accepts the `/api/auth/session` shape (camelCase, the normal
 * case) and raw `v1/profile/me` keys (snake_case), so an SSR seed can pass either.
 */
export function parseUserSummary(input: unknown): UserSummary | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  const cards = Array.isArray(o.bonus_cards) ? (o.bonus_cards as Record<string, unknown>[]) : [];
  const card = cards[0] ?? {};
  const birth = strOrNull(o.birthDate ?? o.birth_date);
  const activeOrders = o.active_orders;
  return {
    id: numOrNull(o.id),
    name: strOrNull(o.name),
    phone: strOrNull(o.phone),
    // Only an explicit `false` means "registration pending".
    isRegistered: !(o.isRegistered === false || o.is_registered === false),
    gender: strOrNull(o.gender),
    birthDate: birth ? birth.slice(0, 10) : null,
    refCode: strOrNull(o.refCode ?? o.ref_code),
    bonus: numOrNull(o.bonus ?? card.bonus),
    bonusTotal: numOrNull(o.bonusTotal ?? card.total),
    cardNumber: strOrNull(o.cardNumber ?? card.card_number),
    activeOrderCount:
      numOrNull(o.activeOrderCount) ?? (Array.isArray(activeOrders) ? activeOrders.length : 0),
  };
}

function strOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function numOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}
