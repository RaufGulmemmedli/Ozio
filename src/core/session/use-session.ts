/**
 * Session hooks + the guest-prompt coupling (03-auth-session.md "Guest mode").
 *
 * `requireAuth(action)` runs `action` when there is an account, otherwise it opens
 * `<GuestPrompt>` ("Daxil ol və ya qeydiyyatdan keç", primary button -> `/login?next=<current>`).
 * The prompt itself is rendered by `@/shared/states`; the coupling is this tiny store, so
 * `core/` never imports from `shared/`.
 */
import { useSessionStore, type AuthStatus, type SessionState, type UserSummary } from './session-store';
import { create } from 'zustand';

/** The whole session store (`useSession()`), or a slice (`useSession(s => s.status)`). */
export const useSession = useSessionStore;

export function useIsAuthenticated(): boolean {
  return useSessionStore((s) => s.status === 'authenticated');
}

export function useIsGuest(): boolean {
  return useSessionStore((s) => s.status === 'guest');
}

/** `true` while the session is still being resolved — render the page skeleton, not a spinner. */
export function useSessionLoading(): boolean {
  return useSessionStore((s) => s.status === 'unknown');
}

export function useUser(): UserSummary | null {
  return useSessionStore((s) => s.user);
}

export function useAuthStatus(): AuthStatus {
  return useSessionStore((s) => s.status);
}

export type { AuthStatus, SessionState, UserSummary };

// ---------------------------------------------------------------------------------------------
// guest prompt
// ---------------------------------------------------------------------------------------------

/** Why the prompt opened — lets `<GuestPrompt>` pick its copy (cart, favorite, checkout, card…). */
export type GuestPromptReason =
  | 'cart'
  | 'favorite'
  | 'checkout'
  | 'card'
  | 'coupon'
  | 'lottery'
  | 'order'
  | 'address'
  | 'profile'
  | 'generic';

export interface GuestPromptState {
  open: boolean;
  reason: GuestPromptReason;
  show(reason?: GuestPromptReason): void;
  hide(): void;
}

export const useGuestPrompt = create<GuestPromptState>((set) => ({
  open: false,
  reason: 'generic',
  show: (reason = 'generic') => set({ open: true, reason }),
  hide: () => set({ open: false }),
}));

/**
 * Run `action` when the visitor has an account; otherwise open the guest prompt.
 * Returns `true` when the action ran, so callers can skip their optimistic update.
 * Not a hook — call it from event handlers.
 */
export function requireAuth(action: () => void, reason: GuestPromptReason = 'generic'): boolean {
  if (useSessionStore.getState().status === 'authenticated') {
    action();
    return true;
  }
  useGuestPrompt.getState().show(reason);
  return false;
}

/** Hook form of `requireAuth`, for components that want a stable callback. */
export function useRequireAuth(): (action: () => void, reason?: GuestPromptReason) => boolean {
  return requireAuth;
}
