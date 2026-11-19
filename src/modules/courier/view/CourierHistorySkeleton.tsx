'use client';

/**
 * Mirror skeleton for `/courier/history`: the same card shell, the same 84-high rows and the same
 * columns as the loaded list, so nothing shifts. The page header stays real.
 */
import { Bone, Shimmer } from '@/shared/skeleton';

export function CourierHistorySkeleton({
  rows = 6,
  label,
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <Shimmer label={label} className="w-full rounded-xl bg-surface px-6 py-2">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex w-full flex-row items-center gap-4 border-b border-line py-4 last:border-b-0 md:min-h-[84px]"
        >
          <Bone w={48} h={48} r="md" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Bone w={[170, 120, 110, 170, 120, 110][i % 6]} h={14} r="xs" />
            <Bone w={[220, 160, 150, 240, 200, 230][i % 6]} h={13} r="xs" />
          </div>
          <Bone w={62} h={28} r="pill" />
          <Bone w={62} h={16} r="xs" />
          <Bone w={62} h={16} r="xs" />
          <Bone w={108} h={13} r="xs" />
        </div>
      ))}
    </Shimmer>
  );
}
