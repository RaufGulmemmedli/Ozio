/**
 * `/ask-to-buy/send` — the child's "Valideynə göndər" form (mock module, flag `askToBuy`).
 *
 * Declared before `/ask-to-buy/[id]` in `ask_to_buy.routes.ts`, and a literal path segment always
 * beats a dynamic one in the App Router, so `send` can never be read as an id.
 */
import { AskSendView, assertAskToBuyEnabled } from '@/modules/ask_to_buy';

export const dynamic = 'force-dynamic';

export default function AskToBuySendPage() {
  assertAskToBuyEnabled();
  return <AskSendView />;
}
