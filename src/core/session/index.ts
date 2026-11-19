/**
 * Public surface of `@/core/session`.
 *
 * The contract names `useSession()` and `requireAuth()`; everything else here is for the root
 * provider (`setInitialSession`, `rehydratePrefs`, `installSessionExpiredBridge`) or for the
 * route handlers (`parseUserSummary`).
 */
export {
  useSessionStore,
  sessionState,
  signOutListeners,
  addSignOutListener,
  setInitialSession,
  hydrateSession,
  parseSessionResponse,
  parseUserSummary,
} from './session-store';
export type { AuthStatus, SessionState, UserSummary, InitialSession } from './session-store';
export { installSessionExpiredBridge } from './session-expired-bridge';
export {
  useSession,
  useIsAuthenticated,
  useIsGuest,
  useSessionLoading,
  useUser,
  useAuthStatus,
  useGuestPrompt,
  requireAuth,
  useRequireAuth,
} from './use-session';
export type { GuestPromptReason, GuestPromptState } from './use-session';
export { usePrefs, prefsState, rehydratePrefs, PREFS_STORAGE_KEY } from './prefs-store';
export type { PrefsState, LocalePref, ThemePref } from './prefs-store';
