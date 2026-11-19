'use client';

/**
 * Mirror skeleton for the jar (`savings-jar-loading.html`).
 *
 * The two bento tiles lose their tint and become neutral `surface` blocks with 3 bones each, as the
 * export draws them; the members and history cards keep their row heights.
 */
import { Bone, Shimmer } from '@/shared/skeleton';

export function SavingsJarSkeleton({ label }: { label: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-8" label={label}>
      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="flex min-h-[220px] flex-1 flex-col justify-between gap-6 rounded-bento bg-surface p-8 lg:min-h-[260px]">
          <div className="flex flex-col gap-2">
            <Bone w={160} h={18} r="sm" />
            <Bone w={260} h={60} r="md" />
          </div>
          <div className="flex flex-col gap-2">
            <Bone w="100%" h={12} r="pill" />
            <div className="flex flex-row items-center justify-between">
              <Bone w={140} h={14} r="xs" />
              <Bone w={80} h={14} r="xs" />
            </div>
          </div>
        </div>

        <div className="flex min-h-[220px] w-full flex-col justify-between gap-6 rounded-bento bg-surface p-8 lg:min-h-[260px] lg:w-[400px] lg:shrink-0">
          <Bone w={140} h={18} r="sm" />
          <div className="flex flex-col gap-2">
            <Bone w={180} h={48} r="md" />
            <Bone w={200} h={14} r="xs" />
          </div>
          <Bone w={150} h={34} r="pill" />
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="flex w-full flex-col gap-1.5 rounded-xl bg-surface p-6 lg:w-[400px] lg:shrink-0">
          <Bone w={110} h={20} r="sm" className="mb-2" />
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex h-[68px] flex-row items-center gap-[14px] border-t border-line first:border-t-0"
            >
              <Bone w={44} h={44} r="pill" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Bone w={110} h={16} r="sm" />
                <Bone w={56} h={12} r="xs" />
              </div>
              <Bone w={70} h={16} r="sm" />
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl bg-surface p-6">
          <Bone w={240} h={20} r="sm" className="mb-2" />
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="flex h-[68px] flex-row items-center gap-[14px] border-t border-line first:border-t-0"
            >
              <Bone w={44} h={44} r="md" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Bone w={130} h={15} r="sm" />
                <Bone w={110} h={13} r="xs" />
              </div>
              <Bone w={70} h={16} r="sm" />
            </div>
          ))}
        </div>
      </div>
    </Shimmer>
  );
}
