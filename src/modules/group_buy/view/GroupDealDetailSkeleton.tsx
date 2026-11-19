/**
 * GB2's drawn loading state (`gb2-group-deal-detail-skeleton.html`, node `QmyiY`).
 *
 * The header becomes bones (90×14 breadcrumb, 360×36 title, 300×16 subtitle, 140×48 action), the
 * Demo rejim strip stays real, and the two columns keep their widths: the hero's 180 thumb + the
 * 52-high price bone, three 64-high tier rows, the 12-high progress and six 44 avatars, then the
 * 400px join card with its 48 stepper, 72 address block, two 16 rows and two 52 buttons.
 */
import { Bone, Shimmer } from '@/shared/skeleton';
import { Card } from '@/shared/ui';

export function GroupDealHeaderSkeleton() {
  return (
    <Shimmer className="flex flex-col gap-3">
      <Bone w={90} h={14} r="xs" />
      <Bone w={360} h={36} r="sm" className="max-w-full" />
      <Bone w={300} h={16} r="xs" className="max-w-full" />
    </Shimmer>
  );
}

export function GroupDealDetailSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex flex-col gap-5 xl:flex-row xl:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <Card tone="soft" radius="xl" className="flex flex-col gap-7 p-7 sm:flex-row sm:items-center">
          <Bone w={180} h={180} r="modal" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Bone w={160} h={28} r="sm" />
            <Bone w={140} h={14} r="xs" />
            <Bone w={220} h={52} r="sm" className="max-w-full" />
            <Bone w={320} h={16} r="xs" className="max-w-full" />
          </div>
        </Card>

        <Card tone="surface" radius="xl" className="flex flex-col gap-4 p-6">
          <Bone w={180} h={22} r="xs" />
          <Bone w="100%" h={64} r="lg" />
          <Bone w="100%" h={64} r="lg" />
          <Bone w="100%" h={64} r="lg" />
        </Card>

        <Card tone="surface" radius="xl" className="flex flex-col gap-4 p-6">
          <Bone w={160} h={22} r="xs" />
          <Bone w="100%" h={12} r="pill" />
          <div className="flex flex-row gap-[10px]">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Bone key={i} w={44} h={44} r="pill" />
            ))}
          </div>
        </Card>
      </div>

      <Card
        tone="surface"
        radius="bento"
        className="flex w-full flex-col gap-[18px] p-7 xl:w-[400px] xl:shrink-0"
      >
        <Bone w={180} h={24} r="xs" />
        <Bone w="100%" h={48} r="pill" />
        <Bone w="100%" h={72} r="lg" />
        <Bone w="100%" h={16} r="xs" />
        <Bone w="100%" h={16} r="xs" />
        <Bone w="100%" h={52} r="pill" />
        <Bone w="100%" h={52} r="pill" />
      </Card>
    </Shimmer>
  );
}
