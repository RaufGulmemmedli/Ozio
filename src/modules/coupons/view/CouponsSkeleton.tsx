/**
 * Loading mirror for `/coupons`: the static chrome (page title, subtitle, the
 * "Kod daxil et" button) stays real in `<CouponsView>`; only the tab row, the search
 * field and the six coupon cards are bones — same single/two-column grid and 20px gap
 * as the loaded view, so nothing shifts.
 */
import { Bone, ChipRowSkeleton, CouponTicketSkeleton, Shimmer } from '@/shared/skeleton';

export function CouponsSkeleton({ count = 6, label }: { count?: number; label?: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-8" label={label}>
      <div className="flex w-full flex-col gap-[10px] lg:flex-row lg:items-center">
        <ChipRowSkeleton count={4} h={40} className="lg:flex-1" />
        <div className="flex flex-row gap-[10px]">
          <Bone w={300} h={48} r="pill" />
          <Bone w={48} h={48} r="pill" />
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <CouponTicketSkeleton key={i} />
        ))}
      </div>
    </Shimmer>
  );
}
