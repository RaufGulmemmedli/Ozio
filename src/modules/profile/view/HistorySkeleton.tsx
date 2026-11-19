/**
 * Mirror skeleton for L8. The tab bar is static chrome (it does not depend on data) and stays
 * real; only the rows below it shimmer, in the same card with the same row height as the loaded
 * list so the switch between states shifts nothing.
 */
import { OrderRowSkeleton, Shimmer, TransactionRowSkeleton } from '@/shared/skeleton';

export function HistorySkeleton({
  label,
  variant,
  rows = 6,
}: {
  label: string;
  /** `rows` mirrors the bonus / ticket / coupon list, `cards` the order list. */
  variant: 'rows' | 'cards';
  rows?: number;
}) {
  if (variant === 'cards') {
    return (
      <Shimmer label={label} className="flex w-full flex-col gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <OrderRowSkeleton key={index} index={index} />
        ))}
      </Shimmer>
    );
  }

  return (
    <Shimmer label={label} className="flex w-full flex-col rounded-xl bg-surface py-2">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="px-5 py-3 md:px-7">
          <TransactionRowSkeleton index={index} />
        </div>
      ))}
    </Shimmer>
  );
}
