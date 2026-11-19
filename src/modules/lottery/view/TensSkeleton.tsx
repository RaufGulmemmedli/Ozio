/**
 * Loading mirror for `/market/tens`: the `block` hero tint with the white stamp-card panel
 * (two rows of five 72px circle bones) and the per-card tiles below — same radii, same
 * gaps, same grid columns as the loaded view.
 */
import { Bone, BoneCard, BoneTint, Shimmer } from '@/shared/skeleton';

export function TensSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-6" label={label}>
      <BoneTint tone="surface2" r="2xl" w="100%" pad={40} gap={24} className="items-start">
        <Bone w={220} h={32} r="pill" tone="surface" />
        <Bone w="70%" h={40} r={12} tone="surface" />

        <div className="flex w-full flex-col gap-5 rounded-modal bg-surface p-7">
          <div className="flex w-full flex-row items-center justify-between">
            <Bone w={120} h={18} r="sm" />
            <Bone w={70} h={30} r="pill" />
          </div>
          {Array.from({ length: 2 }, (_, row) => (
            <div key={row} className="flex w-full flex-row justify-between gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Bone key={i} w={72} h={72} r="pill" />
              ))}
            </div>
          ))}
        </div>
      </BoneTint>

      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <BoneCard key={i} r="xl" pad={24} gap={16} w="100%">
            <div className="flex w-full flex-row items-center justify-between">
              <Bone w={160} h={15} r="sm" />
              <Bone w={48} h={15} r="sm" />
            </div>
            <div className="flex w-full flex-row justify-between gap-1">
              {Array.from({ length: 10 }, (_, j) => (
                <Bone key={j} w={24} h={24} r="pill" />
              ))}
            </div>
            <Bone w="100%" h={44} r="pill" />
          </BoneCard>
        ))}
      </div>
    </Shimmer>
  );
}
