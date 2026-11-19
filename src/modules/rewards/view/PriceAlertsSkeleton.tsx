'use client';

/** Mirror skeleton for N6 (`price-alerts-loading.html`): 2 watch cards + a 4-row feed card. */
import { Bone, Shimmer } from '@/shared/skeleton';

export function PriceAlertsSkeleton({ label }: { label: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-6 lg:flex-row" label={label}>
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-row items-center justify-between gap-3">
          <Bone w={220} h={20} r="sm" />
          <Bone w={150} h={44} r="pill" />
        </div>

        {[0, 1].map((card) => (
          <div key={card} className="flex w-full flex-col gap-[14px] rounded-xl bg-surface p-6">
            <div className="flex flex-row items-center gap-4">
              <Bone w={72} h={72} r="lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Bone w="55%" h={18} r="sm" />
                <Bone w="30%" h={14} r="xs" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <Bone w={90} h={24} r="sm" />
                <Bone w={60} h={13} r="xs" />
              </div>
            </div>
            <Bone w="100%" h={52} r="md" />
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-1.5 rounded-xl bg-surface p-6 lg:w-[400px] lg:shrink-0">
        <div className="flex flex-row items-center justify-between pb-2">
          <Bone w={120} h={20} r="sm" />
          <Bone w={60} h={14} r="xs" />
        </div>
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex h-[76px] flex-row items-center gap-3">
            <Bone w={44} h={44} r="pill" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Bone w="80%" h={14} r="xs" />
              <Bone w="60%" h={13} r="xs" />
            </div>
            <Bone w={40} h={12} r="xs" />
          </div>
        ))}
      </div>
    </Shimmer>
  );
}
