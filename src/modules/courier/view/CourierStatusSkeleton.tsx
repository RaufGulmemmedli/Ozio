'use client';

/**
 * Mirror skeleton for `/courier/apply/status`: the hero block (its fill stays real, only the bones
 * on top sweep) plus the four timeline rows and the summary card — the same shape as
 * `status_skeleton.dart`.
 */
import { Bone, Shimmer } from '@/shared/skeleton';

export function CourierStatusSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer
      label={label}
      className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex w-full flex-col gap-4 rounded-bento bg-block p-8">
          <Bone w={56} h={56} r="full" tone="white" className="opacity-[0.14]" />
          <Bone w={280} h={30} r="sm" tone="white" className="opacity-[0.14]" />
          <Bone w="90%" h={16} r="xs" tone="white" className="opacity-[0.14]" />
          <Bone w="70%" h={16} r="xs" tone="white" className="opacity-[0.14]" />
        </div>

        <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
          <Bone w={120} h={20} r="sm" />
          {[160, 180, 120, 90].map((w, i) => (
            <div key={i} className="flex w-full flex-row items-center gap-4">
              <Bone w={40} h={40} r="full" />
              <Bone w={w} h={14} r="xs" />
              <span className="flex-1" />
              <Bone w={84} h={13} r="xs" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-3.5 rounded-xl bg-surface p-6 lg:w-[400px]">
        <Bone w={190} h={20} r="sm" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex w-full flex-row items-center justify-between">
            <Bone w={[60, 80, 70, 96, 64, 110, 90][i]} h={14} r="xs" />
            <Bone w={120} h={14} r="xs" />
          </div>
        ))}
      </div>
    </Shimmer>
  );
}
