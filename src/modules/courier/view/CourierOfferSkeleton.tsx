'use client';

/**
 * Mirror skeleton for `/courier/orders/[id]` (`HbRqN` → `kuryer-teklif-detali-yuklenir.html`) and
 * reused by `/courier/delivery/[id]`: map, places (2 rows), items, the dark earning hero with
 * translucent bones, the breakdown card and the two button bones.
 */
import { Bone, MapSkeleton, Shimmer } from '@/shared/skeleton';

export function CourierOfferSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer
      label={label}
      className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <MapSkeleton h={300} r="bento" />

        {/* Places */}
        <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
          {[0, 1].map((i) => (
            <div key={i} className="flex w-full flex-row items-center gap-4">
              <Bone w={44} h={44} r="md" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Bone w={70} h={11} r="xs" />
                <Bone w={[140, 110][i]} h={15} r="xs" />
                <Bone w={[180, 260][i]} h={13} r="xs" />
              </div>
              <Bone w={62} h={28} r="pill" />
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="flex w-full flex-col gap-3.5 rounded-xl bg-surface p-6">
          <Bone w={210} h={20} r="sm" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex w-full flex-row items-center gap-4">
              <Bone w={[120, 100, 90][i]} h={14} r="xs" />
              <span className="flex-1" />
              <Bone w={56} h={13} r="xs" />
              <Bone w={34} h={14} r="xs" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[400px]">
        <div className="flex w-full flex-col gap-4 rounded-bento bg-block p-8">
          <Bone w={110} h={14} r="xs" tone="white" className="opacity-[0.14]" />
          <Bone w={160} h={48} r={12} tone="white" className="opacity-[0.14]" />
          <div className="flex flex-row gap-2">
            <Bone w={76} h={30} r="pill" tone="white" className="opacity-[0.14]" />
            <Bone w={84} h={30} r="pill" tone="white" className="opacity-[0.14]" />
            <Bone w={60} h={30} r="pill" tone="white" className="opacity-[0.14]" />
          </div>
        </div>

        <div className="flex w-full flex-col gap-3.5 rounded-xl bg-surface p-6">
          <Bone w={110} h={20} r="sm" />
          {[150, 130, 50].map((w, i) => (
            <div key={i} className="flex w-full flex-row items-center justify-between">
              <Bone w={w} h={14} r="xs" />
              <Bone w={56} h={14} r="xs" />
            </div>
          ))}
          <div className="h-px w-full bg-line" />
          <div className="flex w-full flex-row items-center justify-between">
            <Bone w={70} h={18} r="xs" />
            <Bone w={80} h={22} r="sm" />
          </div>
        </div>

        <Bone w="100%" h={60} r="pill" />
        <Bone w="100%" h={56} r="pill" />
      </div>
    </Shimmer>
  );
}
