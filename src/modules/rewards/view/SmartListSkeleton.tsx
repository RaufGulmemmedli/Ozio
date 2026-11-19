'use client';

/** Mirror skeleton for N4 (`smart-list-loading.html`): add field, 2 group headers, 6 rows. */
import { Bone, Shimmer } from '@/shared/skeleton';

export function SmartListSkeleton({ label }: { label: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-6 lg:flex-row" label={label}>
      <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl bg-surface p-6 md:p-7">
        {/* the add field keeps its real shape; only the label inside is a bone */}
        <div className="flex h-14 w-full flex-row items-center gap-3 rounded-pill bg-surface2 px-5">
          <Bone w={220} h={15} r="xs" tone="line" />
        </div>

        {[0, 1].map((group) => (
          <div key={group} className="flex w-full flex-col">
            <div className="pb-1 pt-3.5">
              <Bone w={180} h={13} r="xs" />
            </div>
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="flex h-[68px] flex-row items-center gap-4 border-t border-line first:border-t-0"
              >
                <Bone w={26} h={26} r="pill" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Bone w="55%" h={16} r="sm" />
                  <Bone w="35%" h={13} r="xs" />
                </div>
                <Bone w={64} h={16} r="sm" />
                <Bone w={84} h={36} r="pill" />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-5 lg:w-[360px] lg:shrink-0">
        <div className="flex w-full flex-col gap-2.5 rounded-bento bg-surface p-7">
          <Bone w={200} h={14} r="xs" />
          <Bone w={170} h={44} r="md" />
          <Bone w={160} h={14} r="xs" />
          <Bone w="100%" h={56} r="pill" />
        </div>

        <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
          <Bone w={140} h={16} r="sm" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex flex-row items-center justify-between gap-2.5">
              <Bone w={120} h={15} r="xs" />
              <Bone w={110} h={13} r="xs" />
            </div>
          ))}
        </div>

        <Bone w="100%" h={56} r="pill" />
      </div>
    </Shimmer>
  );
}
