'use client';

/**
 * Mirror skeleton for `/courier/earnings` (`teaWA` → `kuryer-qazanc-yuklenir.html`): the dark
 * balance hero (real fill, translucent bones), the three period tiles, the chart card with seven
 * bar bones and the three stat tiles. The page header and the "Çıxarış sorğusu" button stay real.
 */
import { Bone, Shimmer } from '@/shared/skeleton';

const BAR_HEIGHTS = [72, 112, 94, 128, 88, 110, 140];

export function CourierEarningsSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-bento bg-block p-8 md:p-10">
          <Bone w={90} h={13} r="xs" tone="white" className="opacity-[0.14]" />
          <Bone w={240} h={56} r={12} tone="white" className="opacity-[0.14]" />
          <Bone w={200} h={16} r="xs" tone="white" className="opacity-[0.14]" />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[420px]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex w-full flex-row items-center justify-between gap-4 rounded-xl bg-surface p-6"
            >
              <div className="flex min-w-0 flex-col gap-2">
                <Bone w={[70, 100, 80][i]} h={14} r="xs" />
                <Bone w={110} h={13} r="xs" />
              </div>
              <Bone w={100} h={28} r="sm" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
        <div className="flex w-full flex-row items-center justify-between">
          <Bone w={120} h={20} r="sm" />
          <Bone w={80} h={16} r="xs" />
        </div>
        <div className="flex w-full flex-row items-end gap-2 md:gap-4">
          {BAR_HEIGHTS.map((h, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <Bone w={46} h={12} r="xs" />
              <Bone w="100%" h={h} r="md" />
              <Bone w={28} h={13} r="xs" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex min-w-0 flex-col gap-2 rounded-xl bg-surface p-6">
            <Bone w={[80, 100, 140][i]} h={13} r="xs" />
            <Bone w={[48, 60, 56][i]} h={28} r="sm" />
          </div>
        ))}
      </div>
    </Shimmer>
  );
}
