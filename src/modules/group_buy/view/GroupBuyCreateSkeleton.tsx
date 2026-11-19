/**
 * GB3's drawn loading state (`gb3-group-buy-create-skeleton.html`, node `d75lwS`).
 *
 * Header bones (90×14, 260×36, 340×16), the real Demo rejim strip, then the form card with a
 * 120×18 step label, six 84-high pick bones in the same 3×2 grid, a 1px rule and three 70-high
 * rows for steps 2–5 — beside the 360-high preview-card bone and its 52 button.
 */
import { Bone, Shimmer } from '@/shared/skeleton';
import { Card } from '@/shared/ui';

export function GroupBuyCreateHeaderSkeleton() {
  return (
    <Shimmer className="flex flex-col gap-3">
      <Bone w={90} h={14} r="xs" />
      <Bone w={260} h={36} r="sm" className="max-w-full" />
      <Bone w={340} h={16} r="xs" className="max-w-full" />
    </Shimmer>
  );
}

export function GroupBuyCreateSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex flex-col gap-5 xl:flex-row xl:gap-8">
      <Card tone="surface" radius="xl" className="flex min-w-0 flex-1 flex-col gap-6 p-8">
        <Bone w={120} h={18} r="xs" />
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Bone key={i} w="100%" h={84} r="card" />
          ))}
        </div>
        <Bone w="100%" h={1} r={0} tone="line" />
        <Bone w="100%" h={70} r="lg" />
        <Bone w="100%" h={70} r="lg" />
        <Bone w="100%" h={70} r="lg" />
      </Card>

      <div className="flex w-full flex-col gap-5 xl:w-[400px] xl:shrink-0">
        <Bone w="100%" h={360} r="bento" />
        <Bone w="100%" h={52} r="pill" />
      </div>
    </Shimmer>
  );
}
