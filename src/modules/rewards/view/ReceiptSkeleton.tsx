'use client';

/**
 * Mirror skeleton for N5. There is no `receipt-loading` export in this package, so the bones
 * mirror the loaded sheet: header block, 2 meta rows, 5 line rows, the totals block.
 */
import { Bone, Shimmer } from '@/shared/skeleton';

export function ReceiptSkeleton({ label }: { label: string }) {
  return (
    <Shimmer className="w-full max-w-[760px]" label={label}>
      <div className="flex w-full flex-col gap-6 rounded-xl bg-surface p-6 md:p-8">
        <div className="flex flex-col gap-2">
          <Bone w={200} h={24} r="sm" />
          <Bone w={140} h={14} r="xs" />
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex flex-row items-center justify-between gap-4">
              <Bone w={120} h={13} r="xs" />
              <Bone w={180} h={14} r="xs" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex flex-row items-center justify-between gap-4">
              <Bone w="45%" h={15} r="xs" />
              <Bone w={70} h={15} r="xs" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex flex-row items-center justify-between gap-4">
              <Bone w={130} h={14} r="xs" />
              <Bone w={80} h={14} r="xs" />
            </div>
          ))}
          <div className="flex flex-row items-center justify-between gap-4 pt-2">
            <Bone w={140} h={20} r="sm" />
            <Bone w={110} h={24} r="sm" />
          </div>
        </div>
      </div>
    </Shimmer>
  );
}
