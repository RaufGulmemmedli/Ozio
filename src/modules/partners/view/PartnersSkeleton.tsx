import { Bone, BoneCard, BoneTint, ChipRowSkeleton, PartnerCardSkeleton, Shimmer } from '@/shared/skeleton';

export interface PartnersSkeletonProps {
  /** Visually-hidden "Yüklənir…" label, already localized by the view. */
  label: string;
  cards?: number;
}

/**
 * Mirror skeleton for `/market/partners`: the chip row, the two featured tiles (220 high, the
 * fills stay outside the shimmer) and the card grid in the same 4-column rhythm as the loaded
 * view, so nothing shifts when the data lands.
 *
 * The page title, subtitle and the view toggle are **static chrome** — they stay real and are
 * rendered by the view above this block.
 */
export function PartnersSkeleton({ label, cards = 8 }: PartnersSkeletonProps) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-8">
      <ChipRowSkeleton count={8} />

      <div className="flex w-full flex-col gap-5 lg:flex-row">
        <BoneTint tone="surface2" r="bento" h={220} className="w-full lg:flex-1" />
        <BoneTint tone="surface2" r="bento" h={220} className="w-full lg:w-[380px]" />
      </div>

      <div className="flex w-full flex-row items-center justify-between">
        <Bone w={200} h={22} r="sm" />
        <Bone w={160} h={14} r="xs" />
      </div>

      <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: cards }, (_, i) => (
          <PartnerCardSkeleton key={i} />
        ))}
      </div>
    </Shimmer>
  );
}

/** Mirror skeleton for the partner detail screen (cover 280 + two-column body). */
export function PartnerDetailSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-8">
      <BoneTint tone="surface2" r="bento" h={280} />
      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-9">
          <div className="flex w-full flex-col gap-4">
            <Bone w={260} h={24} r="sm" />
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex flex-col gap-[14px]">
                  <Bone w={56} h={56} r={18} />
                  <Bone w="70%" h={17} r="sm" />
                  <Bone w="100%" h={14} r="xs" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex w-full flex-col gap-4">
            <Bone w={200} h={24} r="sm" />
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
              <BoneTint tone="surface2" r="xl" h={180} />
              <BoneTint tone="surface2" r="xl" h={180} />
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 lg:w-[340px]">
          {Array.from({ length: 3 }, (_, i) => (
            <BoneCard key={i} r="xl" pad={24} gap={14}>
              <Bone w={140} h={18} r="sm" />
              <Bone w="100%" h={14} r="xs" />
              <Bone w="80%" h={14} r="xs" />
            </BoneCard>
          ))}
        </div>
      </div>
    </Shimmer>
  );
}
