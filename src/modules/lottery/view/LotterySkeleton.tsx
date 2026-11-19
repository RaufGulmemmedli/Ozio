/**
 * Loading mirror for `/lottery`: the Draw Row — a flex-1 hero tint (the export's 594-high
 * `block` panel at radius 48) beside the 400-wide right column with the "Biletlərim" card
 * and the ticket panel. The page title stays real in `<LotteryView>`.
 */
import { Bone, BoneCard, BoneTint, ListRowSkeleton, Shimmer } from '@/shared/skeleton';

export function LotterySkeleton({ label }: { label?: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-6" label={label}>
      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <BoneTint
          tone="surface2"
          r="2xl"
          w="100%"
          h={520}
          pad={48}
          gap={28}
          className="min-w-0 flex-1 items-start justify-center"
        >
          <Bone w={200} h={32} r="pill" tone="surface" />
          <Bone w={320} h={72} r={16} tone="surface" />
          <div className="flex flex-row gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Bone key={i} w={104} h={104} r="card" tone="surface" />
            ))}
          </div>
          <Bone w={280} h={16} r="sm" tone="surface" />
        </BoneTint>

        <div className="flex w-full flex-col gap-4 lg:w-[400px] lg:shrink-0">
          <BoneCard r="bento" pad={28} gap={16} w="100%">
            <div className="flex w-full flex-row items-center justify-between">
              <Bone w={120} h={22} r="sm" />
              <Bone w={70} h={30} r="pill" />
            </div>
            {Array.from({ length: 3 }, (_, i) => (
              <ListRowSkeleton key={i} h={64} index={i} />
            ))}
          </BoneCard>
          <BoneCard r="bento" pad={28} gap={18} w="100%">
            <Bone w={120} h={22} r="sm" />
            <Bone w="100%" h={16} r="sm" />
            <Bone w="100%" h={52} r="pill" />
          </BoneCard>
        </div>
      </div>

      <BoneCard r="bento" pad={32} gap={12} w="100%">
        <Bone w={200} h={24} r="sm" />
        <Bone w="100%" h={68} r="lg" />
        <Bone w="100%" h={68} r="lg" />
      </BoneCard>
    </Shimmer>
  );
}
