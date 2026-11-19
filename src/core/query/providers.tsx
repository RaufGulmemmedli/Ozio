'use client';

/**
 * The single client provider tree, mounted once by the root layout:
 *
 *   QueryClientProvider → ThemeProvider → MockProvider
 *     → session hydrate (first render) + prefs rehydrate + session-expired bridge
 *     → <RouteTracker/> → children
 *
 * `initialStatus` / `initialUser` come from the server layout (it already read the session cookie),
 * so the app never paints a guest shell for a signed-in user.
 *
 * ```tsx
 * // src/app/[locale]/layout.tsx
 * const session = await readServerSession();
 * return (
 *   <Providers initialStatus={session.status} initialUser={session.user}>
 *     {children}
 *   </Providers>
 * );
 * ```
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { ThemeProvider } from '@/core/theme';
import { addSignOutListener, type AuthStatus } from '@/core/session';
import { MockProvider } from '@/core/mocks/mock-provider';
import { getQueryClient } from './query-client';
import { RouteTracker } from './route-tracker';
import { applyInitialSession, installSessionExpiredBridge, rehydratePrefs } from './session-bridge';

export interface ProvidersProps {
  children: ReactNode;
  /** `'unknown' | 'guest' | 'authenticated'`, as resolved on the server. */
  initialStatus?: AuthStatus;
  /** The user row the server resolved, or `null` for a guest. */
  initialUser?: unknown;
  /** The double-submit CSRF token, when the server layout already has it. */
  initialCsrf?: string | null;
}

export function Providers({
  children,
  initialStatus,
  initialUser,
  initialCsrf,
}: ProvidersProps) {
  const [queryClient] = useState(getQueryClient);

  // Runs once, during this component's first render — before any child reads `useSession()`.
  useState(() => {
    applyInitialSession({ status: initialStatus, user: initialUser, csrf: initialCsrf ?? null });
    return true;
  });

  useEffect(() => {
    void rehydratePrefs();
    const disposeBridge = installSessionExpiredBridge();
    // Every user-bound key lives under a module key, so signing out drops the cache wholesale.
    const disposeSignOut = addSignOutListener(() => queryClient.clear());
    return () => {
      disposeBridge();
      disposeSignOut();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MockProvider>
          <RouteTracker />
          {children}
        </MockProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
