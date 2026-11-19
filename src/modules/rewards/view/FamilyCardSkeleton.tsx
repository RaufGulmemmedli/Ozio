'use client';

/** Mirror skeleton for N3 (`family-card-loading.html`): same two columns, same row heights. */
import { Bone, Shimmer } from '@/shared/skeleton';

export function FamilyCardSkeleton({ label }: { label: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-6 lg:flex-row" label={label}>
      <div className="flex w-full flex-col gap-5 lg:w-[456px] lg:shrink-0">
        {/* Barcode card — tinted fill kept, bones on top */}
        <div className="flex w-full flex-col gap-[18px] rounded-bento bg-block p-7">
          <Bone w={140} h={22} r="sm" tone="white" className="opacity-[0.12]" />
          <div className="flex w-full flex-col items-center gap-2.5 rounded-lg bg-surface p-5">
            <Bone w="100%" h={96} r="xs" />
            <Bone w={180} h={16} r="xs" />
          </div>
          <Bone w="90%" h={14} r="xs" tone="white" className="opacity-[0.12]" />
        </div>

        <div className="flex w-full flex-col gap-2 rounded-bento bg-surface p-7">
          <Bone w={200} h={14} r="xs" />
          <Bone w={180} h={44} r="md" />
          <Bone w={140} h={14} r="xs" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex w-full flex-col gap-1.5 rounded-xl bg-surface p-6">
          <div className="flex flex-row items-center justify-between pb-2.5">
            <Bone w={160} h={20} r="sm" />
            <Bone w={160} h={44} r="pill" />
          </div>
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="flex h-[76px] flex-row items-center gap-4 border-t border-line first:border-t-0">
              <Bone w={48} h={48} r="pill" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Bone w={120} h={16} r="sm" />
                <Bone w={70} h={13} r="xs" />
              </div>
              <Bone w={80} h={16} r="sm" />
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col rounded-xl bg-surface p-6">
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex h-[76px] flex-row items-center justify-between gap-4 border-t border-line first:border-t-0">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Bone w={180} h={16} r="sm" />
                <Bone w="70%" h={13} r="xs" />
              </div>
              <Bone w={52} h={30} r="pill" />
            </div>
          ))}
        </div>
      </div>
    </Shimmer>
  );
}
