/**
 * `/senior/neighbor/new` — "Yeni sorğu".
 *
 * The form is drawn as a 600-wide dialog over the board (`senior-neighbor-new-dialog.html`), not
 * as a screen of its own, so this route is the direct-hit fallback: it renders the board with the
 * dialog already open. Closing it leaves the reader on the board, where the in-app path would.
 */
import { SeniorNeighborView, assertSeniorEnabled } from '@/modules/senior';

export const dynamic = 'force-dynamic';

export default function SeniorNeighborNewPage() {
  assertSeniorEnabled();
  return <SeniorNeighborView creating />;
}
