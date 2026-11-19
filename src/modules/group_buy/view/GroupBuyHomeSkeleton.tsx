/**
 * GB1's drawn loading state (`gb1-group-buy-home-skeleton.html`, node `BGDs7`).
 *
 * Mirrors the loaded layout exactly: the real page title, subtitle and the Demo rejim strip stay
 * (static chrome is never shimmered), the header action becomes a 160×52 bone, the two tab chips
 * become 140×40 / 160×40 bones, and each of the four deal cards keeps its own `surface` card with
 * the same padding and gaps — 96 thumb, 180×20 title, 120×14 pack, 150×26 tag, 140×30 price,
 * full-width 10 progress and a full-width 44 button bone. The rail is a 300 and a 220 block.
 *
 * One `<Shimmer>` at the root; the card fills stay outside it.
 */
import { Bone, Shimmer } from '@/shared/skeleton';
import { Card } from '@/shared/ui';

function DealCardSkeleton() {
  return (
    <Card tone="surface" radius="xl" className="flex flex-col items-start gap-4 p-5">
      <Bone w={96} h={96} r="card" />
      <Bone w={180} h={20} r="xs" />
      <Bone w={120} h={14} r="xs" />
      <Bone w={150} h={26} r="sm" />
      <Bone w={140} h={30} r="xs" />
      <Bone w="100%" h={10} r="pill" />
      <Bone w="100%" h={44} r="pill" />
    </Card>
  );
}

export function GroupBuyHomeSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex flex-col gap-5 xl:flex-row xl:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-row gap-3">
          <Bone w={140} h={40} r="pill" />
          <Bone w={160} h={40} r="pill" />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <DealCardSkeleton />
          <DealCardSkeleton />
          <DealCardSkeleton />
          <DealCardSkeleton />
        </div>
      </div>
      <div className="flex w-full flex-col gap-5 xl:w-[360px] xl:shrink-0">
        <Bone w="100%" h={300} r="bento" />
        <Bone w="100%" h={220} r="xl" />
      </div>
    </Shimmer>
  );
}

/** The header action bone, rendered in `<PageHeader actions>` while the list loads. */
export function GroupBuyHeaderActionSkeleton() {
  return <Bone w={160} h={52} r="pill" />;
}
