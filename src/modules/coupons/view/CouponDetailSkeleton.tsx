/**
 * Loading mirror for `/coupons/[id]`: the two-column Detail Row — a flex-1 ticket with
 * its `brand` hero, the perforation strip and the 4-up facts grid, beside the 400-wide
 * cashier panel. The tinted fills stay outside the shimmer (skeletons.md): only the
 * bones on top sweep.
 */
import { Bone, BoneTint, Shimmer } from '@/shared/skeleton';

export function CouponDetailSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-8 lg:flex-row" label={label}>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-bento border border-line bg-surface">
        <BoneTint tone="surface2" r={0} w="100%" h={248} pad={40} gap={16} className="items-start justify-center">
          <Bone w={160} h={28} r="pill" tone="surface" />
          <Bone w={220} h={72} r={16} tone="surface" />
          <Bone w={320} h={20} r="sm" tone="surface" />
        </BoneTint>
        <div className="h-6 w-full bg-surface" />
        <div className="grid w-full grid-cols-2 gap-5 p-10 pt-6 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <Bone w={88} h={13} r="xs" />
              <Bone w={120} h={17} r="sm" />
            </div>
          ))}
        </div>
      </div>

      <BoneTint
        tone="surface2"
        r="bento"
        w="100%"
        h={520}
        pad={32}
        gap={20}
        className="items-center justify-start lg:w-[400px] lg:shrink-0"
      >
        <Bone w={180} h={24} r="sm" tone="surface" />
        <Bone w={240} h={14} r="xs" tone="surface" />
        <Bone w={244} h={244} r="xl" tone="surface" />
        <Bone w="100%" h={56} r="pill" tone="surface" />
        <Bone w="100%" h={52} r="pill" tone="surface" />
      </BoneTint>
    </Shimmer>
  );
}
