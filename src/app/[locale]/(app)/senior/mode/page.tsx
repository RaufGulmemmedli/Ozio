/**
 * `/senior/mode` — "Sadə rejim" preferences (mock module, flag `senior`).
 *
 * The preferences themselves are device-side and real; the pension and neighbour screens they
 * lead to are demo content, which the banner on each screen states.
 */
import { SeniorModeView, assertSeniorEnabled } from '@/modules/senior';

export const dynamic = 'force-dynamic';

export default function SeniorModePage() {
  assertSeniorEnabled();
  return <SeniorModeView />;
}
