/**
 * `/senior/pension` — "Pensiya günü" (mock module, flag `senior`).
 *
 * Nothing is ordered and nothing is charged: ordering the basket moves mock state and mints a
 * demo order number.
 */
import { SeniorPensionView, assertSeniorEnabled } from '@/modules/senior';

export const dynamic = 'force-dynamic';

export default function SeniorPensionPage() {
  assertSeniorEnabled();
  return <SeniorPensionView />;
}
