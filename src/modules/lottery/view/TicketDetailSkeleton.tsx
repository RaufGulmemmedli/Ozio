/**
 * Loading mirror for `/lottery/tickets/[id]`: the 499-high ticket tint beside the
 * 400-wide timeline card — same two-column split, same gaps.
 */
import { Bone, BoneCard, Shimmer, TicketSkeleton } from '@/shared/skeleton';

export function TicketDetailSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-8 lg:flex-row" label={label}>
      <TicketSkeleton className="min-w-0 flex-1" />

      <div className="flex w-full flex-col gap-4 lg:w-[400px] lg:shrink-0">
        <BoneCard r="bento" pad={32} gap={22} w="100%">
          <Bone w={180} h={22} r="sm" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex w-full flex-row items-center gap-4">
              <Bone w={36} h={36} r="pill" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Bone w={160} h={16} r="sm" />
                <Bone w={90} h={13} r="xs" />
              </div>
            </div>
          ))}
        </BoneCard>
        <BoneCard r="bento" pad={28} gap={12} w="100%">
          <Bone w={140} h={19} r="sm" />
          <Bone w="100%" h={15} r="sm" />
          <Bone w="100%" h={52} r="pill" />
          <Bone w="100%" h={52} r="pill" />
        </BoneCard>
      </div>
    </Shimmer>
  );
}
