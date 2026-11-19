import { AddressRowSkeleton, Bone, BoneTint, ChipRowSkeleton, Shimmer } from '@/shared/skeleton';

/**
 * Mirror skeleton for `/addresses`: the same two-column card grid (4 cards on the canvas) plus
 * the "Yeni ünvan əlavə et" tile and the zone promo block, at the same 150px height and 20px gap,
 * so the grid does not move when the list lands.
 *
 * The page title, subtitle and the "Yeni ünvan" button are static chrome and stay real.
 */
export function AddressesSkeleton({ label, cards = 4 }: { label: string; cards?: number }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-5">
      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
        {Array.from({ length: cards }, (_, i) => (
          <AddressRowSkeleton key={i} />
        ))}
      </div>
      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
        <BoneTint tone="surface2" r="xl" h={150} />
        <BoneTint tone="surface2" r="xl" h={150} />
      </div>
    </Shimmer>
  );
}

/** Mirror skeleton for the zone panel: chips + map box + the three info cards. */
export function DeliveryZoneSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-8">
      <ChipRowSkeleton count={6} />
      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <BoneTint tone="surface2" r="bento" h={560} className="min-w-0 flex-1" />
        <div className="flex w-full flex-col gap-4 lg:w-[400px]">
          <BoneTint tone="surface2" r="xl" h={180} />
          <BoneTint tone="surface2" r="xl" h={200} />
          <BoneTint tone="surface2" r="xl" h={220} />
        </div>
      </div>
    </Shimmer>
  );
}

/** Mirror skeleton for the picker screen: the map box and the form panel side by side. */
export function AddressPickSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-6 lg:flex-row">
      <BoneTint tone="surface2" r="bento" h={640} className="min-w-0 flex-1" />
      <div className="flex w-full flex-col gap-[18px] rounded-bento bg-surface p-7 lg:w-[400px]">
        <Bone w={180} h={26} r="sm" />
        <ChipRowSkeleton count={3} h={40} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex w-full flex-col gap-2">
            <Bone w={80} h={13} r="xs" />
            <Bone w="100%" h={52} r="md" />
          </div>
        ))}
        <Bone w="100%" h={56} r="pill" />
      </div>
    </Shimmer>
  );
}
