'use client';

/**
 * Mirror skeleton for `/parcel/[id]` (`sOAy8` → `baglama-izleme-yuklenir.html`):
 * map block, the four timeline rows, the courier card, the codes card and the price card.
 * The page header (crumb + H1) is static chrome once the id is in the URL, so it stays real.
 */
import { Bone, MapSkeleton, Shimmer } from '@/shared/skeleton';

export function ParcelTrackSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer
      label={label}
      className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <MapSkeleton h={320} r="bento" />

        <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
          <Bone w={210} h={20} r="sm" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex w-full flex-row items-center gap-4">
              <Bone w={40} h={40} r="full" />
              <Bone w={[160, 180, 200, 120][i]} h={14} r="xs" />
              <span className="flex-1" />
              <Bone w={44} h={13} r="xs" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[400px]">
        {/* Courier card */}
        <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
          <Bone w={80} h={14} r="xs" />
          <div className="flex w-full flex-row items-center gap-3.5">
            <Bone w={48} h={48} r="full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Bone w={120} h={15} r="xs" />
              <Bone w={150} h={13} r="xs" />
            </div>
            <Bone w={44} h={44} r="full" />
          </div>
        </div>

        {/* Təhvil kodları */}
        <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
          <Bone w={140} h={20} r="sm" />
          <div className="flex w-full flex-row gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col gap-2">
                <Bone w={110} h={13} r="xs" />
                <Bone w={120} h={36} r="sm" />
              </div>
            ))}
          </div>
          <Bone w="80%" h={12} r="xs" />
        </div>

        {/* Price summary */}
        <div className="flex w-full flex-col gap-3.5 rounded-xl bg-surface p-6">
          <Bone w={90} h={20} r="sm" />
          {[120, 150, 128].map((w, i) => (
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
      </div>
    </Shimmer>
  );
}
