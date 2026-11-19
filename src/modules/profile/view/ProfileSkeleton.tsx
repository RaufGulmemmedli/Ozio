/**
 * Mirror skeleton for P1: the identity block, the three stat tiles, the logout row and seven menu
 * rows — same widths, gaps and grid as the loaded view, so nothing shifts. The page title and
 * subtitle are static chrome and are NOT shimmered (BUILD-CONTRACT rule 3).
 */
import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

export function ProfileSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-6 lg:flex-row lg:gap-6">
      <div className="flex w-full flex-col gap-5 lg:w-[420px] lg:shrink-0">
        {/* identity card — the loaded card is a tinted block, so only the bones on top sweep */}
        <div className="flex w-full flex-col gap-5 rounded-xl bg-block p-8">
          <div className="flex items-center gap-5">
            <Bone w={88} h={88} r="pill" tone="surface2" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Bone w={180} h={24} r="sm" tone="surface2" />
              <Bone w={140} h={15} r="xs" tone="surface2" />
            </div>
          </div>
          <Bone w={200} h={28} r="pill" tone="surface2" />
          <Bone w="100%" h={52} r="pill" tone="surface2" />
        </div>

        <div className="flex w-full gap-3">
          {[0, 1, 2].map((i) => (
            <BoneCard key={i} bordered={false} r="lg" pad={20} gap={6} w="100%" h={78}>
              <Bone w={60} h={22} r="sm" />
              <Bone w={46} h={13} r="xs" />
            </BoneCard>
          ))}
        </div>

        <Bone w="100%" h={56} r="pill" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col rounded-xl bg-surface py-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex min-h-[72px] items-center gap-4 px-5 py-4 md:min-h-20 md:px-7 md:py-0"
          >
            <Bone w={44} h={44} r="pill" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Bone w={i % 2 === 0 ? 148 : 112} h={16} r="sm" />
              <Bone w={i % 2 === 0 ? 206 : 164} h={13} r="xs" />
            </div>
            <Bone w={20} h={20} r="xs" />
          </div>
        ))}
      </div>
    </Shimmer>
  );
}
