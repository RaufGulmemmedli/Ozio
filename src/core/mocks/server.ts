/**
 * The Node-side MSW server: BFF route handlers in dev, scripts and Playwright runs.
 *
 * **Never import this module from a component.** `msw/node` has no browser export condition, so a
 * static import from anything that ends up in the client bundle breaks the build. Import it from
 * `instrumentation.ts`, a script, or a test setup file only.
 */
import { setupServer, type SetupServer } from 'msw/node';
import { handlers, loadMockModules } from './index';

let server: SetupServer | undefined;

export const getMockServer = (): SetupServer | undefined => server;

/** Loads every mock module, then starts interception. Idempotent. */
export async function startMockServer(): Promise<SetupServer> {
  if (server) return server;
  await loadMockModules();
  server = setupServer(...handlers);
  server.listen({ onUnhandledFrame: 'bypass' });
  return server;
}

export function stopMockServer(): void {
  server?.close();
  server = undefined;
}
