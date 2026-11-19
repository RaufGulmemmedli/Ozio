'use client';

/**
 * Mirror skeleton for N1 (`wheel-loading.html`).
 *
 * The dark `Wheel Block` keeps its fill (a tinted block stays outside the sweep); the 8 slices
 * become translucent blanks and only the bones on top shimmer. Sizes, gaps and column widths are
 * the loaded ones, so nothing shifts when the data arrives.
 */
import { Bone, Shimmer } from '@/shared/skeleton';

const CARD = 'w-full rounded-xl bg-surface p-6';

export function WheelSkeleton({ label }: { label: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-6 lg:flex-row" label={label}>
      {/* Wheel Block — tinted fill kept, blank slices under the bones */}
      <div className="relative flex min-h-[520px] flex-1 flex-col items-center gap-6 overflow-hidden rounded-bento bg-block p-8 lg:min-h-[700px]">
        <div className="flex w-full flex-col gap-2">
          <Bone w={160} h={22} r="sm" tone="white" className="opacity-[0.12]" />
          <Bone w={220} h={14} r="xs" tone="white" className="opacity-[0.12]" />
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-[560px]">
          <div className="absolute inset-0 rounded-pill bg-white/10" />
          <div className="absolute inset-[1.8%] rounded-pill bg-white/5" />
          <div
            className="absolute rounded-pill bg-white/10"
            style={{ inset: `${((560 - 124) / 2 / 560) * 100}%` }}
          />
        </div>
      </div>

      {/* Side column */}
      <div className="flex w-full flex-col gap-4 lg:w-[400px] lg:shrink-0">
        <div className={CARD}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Bone w={90} h={18} r="sm" />
              <Bone w={110} h={28} r="pill" />
            </div>
            <div className="flex items-start justify-between">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <Bone w={36} h={36} r="pill" />
                  <Bone w={22} h={12} r="xs" />
                </div>
              ))}
            </div>
            <Bone w="100%" h={12} r="xs" />
          </div>
        </div>

        <div className={CARD}>
          <div className="flex flex-col gap-4">
            <Bone w={140} h={18} r="sm" />
            <Bone w="100%" h={14} r="xs" />
            <Bone w="100%" h={56} r="pill" />
          </div>
        </div>

        <div className={CARD}>
          <div className="flex flex-col gap-4">
            <Bone w={120} h={16} r="sm" />
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                <Bone key={row} w="100%" h={14} r="xs" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shimmer>
  );
}
