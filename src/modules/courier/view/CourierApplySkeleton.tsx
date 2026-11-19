'use client';

/**
 * Mirror skeleton for `/courier/apply` (`jiVSM` → `kuryer-muraciet-yuklenir.html`):
 * three form cards of bones in the left column; the dark perks panel stays **real** (static
 * chrome, nothing in it is data).
 */
import { Bone, Shimmer } from '@/shared/skeleton';

export function CourierApplySkeleton({ label }: { label?: string }) {
  return (
    <Shimmer label={label} className="flex min-w-0 flex-1 flex-col gap-6">
      <CardBones fields={4} title={150} />
      <CardBones fields={3} title={180} tiles />
      <CardBones fields={3} title={200} submit />
    </Shimmer>
  );
}

function CardBones({
  fields,
  title,
  tiles = false,
  submit = false,
}: {
  fields: number;
  title: number;
  tiles?: boolean;
  submit?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
      <Bone w={title} h={20} r="sm" />
      {tiles ? (
        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} w="100%" h={84} r="lg" />
          ))}
        </div>
      ) : null}
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Bone w={[120, 90, 140, 100][i % 4]} h={13} r="xs" />
            <Bone w="100%" h={56} r="md" />
          </div>
        ))}
      </div>
      {submit ? (
        <>
          <Bone w={320} h={20} r="xs" />
          <Bone w={200} h={56} r="pill" />
        </>
      ) : null}
    </div>
  );
}
