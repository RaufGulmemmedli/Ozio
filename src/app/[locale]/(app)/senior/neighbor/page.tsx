/**
 * `/senior/neighbor` — "Qonşu nəvə", both tabs (mock module, flag `senior`).
 */
import { SeniorNeighborView, assertSeniorEnabled } from '@/modules/senior';

export const dynamic = 'force-dynamic';

export default function SeniorNeighborPage() {
  assertSeniorEnabled();
  return <SeniorNeighborView />;
}
