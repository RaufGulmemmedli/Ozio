'use client';

/**
 * Mirror skeleton for `/courier` (`o9Mo0` → `kuryer-panel-yuklenir.html`):
 * the four summary tiles, three offer-card skeletons and the shift + links cards.
 * The page header and the header buttons (Qazanc, Tarixçə) are static chrome and stay real.
 */
import { Bone, Shimmer } from '@/shared/skeleton';

export function CourierPanelSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-8">
      {/* Summary tiles — the first tile's dark fill is real, its bones are translucent. */}
      <div className="grid w-full grid-cols-2 gap-5 lg:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-block p-6">
          <Bone w={96} h={13} r="xs" tone="white" className="opacity-[0.14]" />
          <Bone w={120} h={28} r="sm" tone="white" className="opacity-[0.14]" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex min-w-0 flex-col gap-2 rounded-xl bg-surface p-6">
            <Bone w={[86, 70, 100][i]} h={13} r="xs" />
            <Bone w={[40, 52, 64][i]} h={28} r="sm" />
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex w-full flex-row items-center justify-between">
            <Bone w={220} h={24} r="sm" />
            <Bone w={96} h={28} r="pill" />
          </div>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex w-full flex-row items-center gap-5 rounded-xl bg-surface p-6"
            >
              <Bone w={56} h={56} r={18} />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <Bone w={[160, 120, 180][i]} h={15} r="xs" />
                <Bone w={[300, 260, 280][i]} h={13} r="xs" />
                <div className="flex flex-row gap-2">
                  <Bone w={70} h={28} r="pill" />
                  <Bone w={78} h={28} r="pill" />
                  <Bone w={60} h={28} r="pill" />
                </div>
              </div>
              <Bone w={86} h={26} r="sm" />
              <Bone w={78} h={44} r="pill" />
            </div>
          ))}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-5 lg:w-[360px]">
          <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
            <div className="flex w-full flex-row items-center justify-between">
              <Bone w={70} h={20} r="sm" />
              <Bone w={52} h={30} r="pill" />
            </div>
            <Bone w={200} h={14} r="xs" />
            <div className="h-px w-full bg-line" />
            {[0, 1].map((i) => (
              <div key={i} className="flex w-full flex-row items-center justify-between">
                <Bone w={[130, 70][i]} h={14} r="xs" />
                <Bone w={70} h={14} r="xs" />
              </div>
            ))}
          </div>

          <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex w-full flex-row items-center gap-3">
                <Bone w={40} h={40} r="md" />
                <Bone w={[80, 90, 70][i]} h={14} r="xs" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shimmer>
  );
}
