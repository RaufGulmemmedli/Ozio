/**
 * `/ask-to-buy` — the "Al deyim" inbox (mock module, flag `askToBuy`).
 *
 * Guard `auth` + the flag: the middleware redirects to `/home` when the flag is off and
 * `assertAskToBuyEnabled()` is the defence-in-depth `notFound()` (08-feature-flags-mocks.md).
 * Mock-module pages are client-only and never SEO-indexed, hence `force-dynamic`.
 */
import { AskInboxView, assertAskToBuyEnabled } from '@/modules/ask_to_buy';

export const dynamic = 'force-dynamic';

export default function AskToBuyInboxPage() {
  assertAskToBuyEnabled();
  return <AskInboxView />;
}
