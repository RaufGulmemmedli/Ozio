import type { Metadata } from 'next';

import { TensView } from '@/modules/lottery';

export const metadata: Metadata = { title: 'Ozio 10-lar' };

/** Guest-visible; the stamp card itself is behind `<GuestGate>` inside the view. */
export default function TensPage() {
  return <TensView />;
}
