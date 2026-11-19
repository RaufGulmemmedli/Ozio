/** `/viral/receipt-scan` — V7 "Kassa çeki skaneri". Guard `auth` + flag `viral`. */
import { assertViralEnabled, ReceiptScanView } from '@/modules/viral';

export const dynamic = 'force-dynamic';

export default function ViralReceiptScanPage() {
  assertViralEnabled();
  return <ReceiptScanView />;
}
