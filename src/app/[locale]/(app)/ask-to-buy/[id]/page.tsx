/**
 * `/ask-to-buy/[id]` — one request (mock module, flag `askToBuy`).
 *
 * Which side is rendered — parent (Təsdiq et / İmtina et) or child (read-only outcome) — comes
 * from the mock role, flipped by the switch in the header or pinned with `?preview=parent|child`.
 */
import { AskRequestView, assertAskToBuyEnabled } from '@/modules/ask_to_buy';

export const dynamic = 'force-dynamic';

export default async function AskToBuyRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertAskToBuyEnabled();
  const { id } = await params;
  return <AskRequestView id={id} />;
}
