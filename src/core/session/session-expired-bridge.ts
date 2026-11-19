/**
 * Network -> session bridge (03-auth-session.md "Refresh").
 *
 * The BFF answers `401` with `x-ozio-session: expired` once refreshing failed. `core/network`
 * detects that header and calls the handler registered here, which flips `markExpired()` so
 * `<SessionExpiredDialog>` ("Sessiyanın vaxtı bitdi" -> "Daxil ol") can take over.
 *
 * Install it once from the root client provider; the returned function uninstalls it again
 * (StrictMode double-effect and HMR safe).
 */
import { setSessionExpiredHandler } from '@/core/network';
import { useSessionStore } from './session-store';

function onExpired(): void {
  const { status, markExpired } = useSessionStore.getState();
  // A guest getting a 401 is just an answer, not an expiry (03-auth-session.md step 5).
  if (status === 'authenticated') markExpired();
}

let installed = false;

export function installSessionExpiredBridge(): () => void {
  setSessionExpiredHandler(onExpired);
  installed = true;
  return () => {
    if (!installed) return;
    installed = false;
    setSessionExpiredHandler(null);
  };
}

/** `true` when the bridge is currently wired up (diagnostics / tests). */
export const isSessionExpiredBridgeInstalled = (): boolean => installed;
