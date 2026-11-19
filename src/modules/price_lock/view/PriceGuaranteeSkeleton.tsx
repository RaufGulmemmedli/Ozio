/**
 * PL1's drawn loading state (`pl1-price-guarantee-skeleton.html`, node `HVEUd`).
 *
 * The real page title, subtitle and Demo rejim strip stay; the hero becomes a 200-high bento bone,
 * the section heading a 200×24 bone, and the staples table keeps all **eight** rows, each a 40
 * thumb bone + a flexible name bone + two 100×16 price bones + a 150×28 tag bone, inside the real
 * `surface` card so nothing shifts when the data lands.
 */
import { Bone, Shimmer } from '@/shared/skeleton';
import { Card } from '@/shared/ui';

export function PriceGuaranteeHeaderActionSkeleton() {
  return <Bone w={140} h={48} r="pill" />;
}

export function PriceGuaranteeSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex flex-col gap-5">
      <Bone w="100%" h={200} r="bento" />
      <Bone w={200} h={24} r="xs" />
      <Card tone="surface" radius="xl" className="flex flex-col gap-0 p-7">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
          <div
            key={row}
            className="flex min-h-[60px] flex-wrap items-center gap-4 border-b border-line py-2 last:border-b-0"
          >
            <Bone w={40} h={40} r="sm" />
            <Bone h={16} r="xs" className="min-w-[120px] flex-1" />
            <Bone w={100} h={16} r="xs" />
            <Bone w={100} h={16} r="xs" />
            <Bone w={150} h={28} r="sm" />
          </div>
        ))}
      </Card>
    </Shimmer>
  );
}
