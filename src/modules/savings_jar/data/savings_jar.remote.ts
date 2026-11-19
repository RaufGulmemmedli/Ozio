/**
 * Remote source for the savings jar — paths only.
 *
 * Everything goes to `/api/mock/savings_jar/…` via `remote.mock(...)`, so no request can ever
 * reach the real host. The paths mirror the PROPOSED REST in `mock-modules.md` §17
 * (`GET /`, `PUT /settings`, `POST /claim`), which is what makes the swap to a backend a one-line
 * change here plus deleting the handler file.
 */
import { remote, type RemoteResult } from '@/core/network';

import { SAVINGS_JAR_MOCK_MODULE } from '../savings_jar.flags';

const mock = remote.mock(SAVINGS_JAR_MOCK_MODULE);

export interface JarSettingsBody {
  enabled: boolean;
  step_cents: number;
  monthly_cap: number;
}

/** `?state=` is the deterministic demo switch (`?preview=claim` → the month-ended payload). */
const stateQuery = (state?: string) => (state ? { state } : undefined);

export const savingsJarRemote = {
  jar: (signal?: AbortSignal, state?: string): RemoteResult<unknown> =>
    mock.get('jar', stateQuery(state), { signal }),

  saveSettings: (body: JarSettingsBody): RemoteResult<unknown> => mock.put('settings', body),

  /** Returns the bonus that was credited plus the reset jar. */
  claim: (): RemoteResult<unknown> => mock.post('claim'),
} as const;
