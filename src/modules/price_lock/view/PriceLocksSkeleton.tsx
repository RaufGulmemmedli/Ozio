/**
 * PL2's drawn loading state (`pl2-price-locks-skeleton.html`, node `l96KC9`).
 *
 * The real title, subtitle and Demo rejim strip stay; the two tab chips become 110×40 bones and
 * each lock card keeps its own `surface` card with the same 24 padding and 16 gaps — 56 thumb,
 * 180×18 name, 110×12 sub, 200×40 price block and a full-width 44 button bone.
 */
import { Bone, Shimmer } from '@/shared/skeleton';
import { Card } from '@/shared/ui';

export function PriceLocksHeaderActionSkeleton() {
  return <Bone w={170} h={48} r="pill" />;
}

function LockCardSkeleton() {
  return (
    <Card tone="surface" radius="xl" className="flex flex-col items-start gap-4 p-6">
      <Bone w={56} h={56} r={16} />
      <Bone w={180} h={18} r="xs" />
      <Bone w={110} h={12} r="xs" />
      <Bone w={200} h={40} r="xs" />
      <Bone w="100%" h={44} r="pill" />
    </Card>
  );
}

export function PriceLocksSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex flex-col gap-5">
      <div className="flex flex-row gap-3">
        <Bone w={110} h={40} r="pill" />
        <Bone w={110} h={40} r="pill" />
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <LockCardSkeleton />
        <LockCardSkeleton />
      </div>
    </Shimmer>
  );
}
