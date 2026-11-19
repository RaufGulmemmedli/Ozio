'use client';

/**
 * `/offers` mirror skeleton — the regions of `app-places/app-kampaniyalar.html` (`GWzY0`):
 * header (title + subtitle bones, month switch), filter chips, the 340-high highlights row
 * (hero + two side tiles), the 132-high coupon row and the product-offer grid.
 *
 * The hero and the side tiles are tinted blocks, so their fill stays outside the sweep
 * (`BoneTint` via `BannerSkeleton`) — only the bones on top move.
 */
import {
  Bone,
  BannerSkeleton,
  ChipRowSkeleton,
  ProductCardSkeleton,
  SectionHeaderSkeleton,
  Shimmer,
} from '@/shared/skeleton';

export function OffersSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-row items-end justify-between gap-5">
        <div className="flex flex-col gap-2.5">
          <Bone w="min(280px, 60vw)" h={36} r={12} />
          <Bone w="min(420px, 80vw)" h={16} r="sm" />
        </div>
        <Bone w={240} h={48} r="pill" className="hidden lg:block" />
      </div>

      <ChipRowSkeleton count={5} />
      <HighlightsBones />
      <div className="flex w-full flex-col gap-4">
        <SectionHeaderSkeleton titleW={180} />
        <CouponBones />
      </div>
      <div className="flex w-full flex-col gap-4">
        <SectionHeaderSkeleton titleW={200} />
        <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
          {Array.from({ length: 6 }, (_, i) => (
            <ProductCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </Shimmer>
  );
}

function HighlightsBones() {
  return (
    <div className="flex w-full flex-col gap-5 lg:h-[340px] lg:flex-row">
      <BannerSkeleton r="bento" h="100%" className="min-h-[220px] flex-1" />
      <div className="flex w-full flex-col gap-5 lg:w-[340px] lg:shrink-0">
        <BannerSkeleton r="modal" h={150} />
        <BannerSkeleton r="modal" h={150} />
      </div>
    </div>
  );
}

function CouponBones() {
  return (
    <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex h-[132px] w-full flex-row overflow-hidden rounded-xl bg-surface">
          <div className="w-[120px] shrink-0 bg-surface2 lg:w-[150px]" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 p-5">
            <Bone w="80%" h={15} r="sm" />
            <Bone w={110} h={36} r="pill" />
            <Bone w={120} h={12} r="xs" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const HighlightsRowSkeleton = () => (
  <Shimmer className="w-full">
    <HighlightsBones />
  </Shimmer>
);

export const CouponRowSkeleton = () => (
  <Shimmer className="w-full">
    <CouponBones />
  </Shimmer>
);

export const OfferGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <Shimmer className="grid w-full grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
    {Array.from({ length: count }, (_, i) => (
      <ProductCardSkeleton key={i} index={i} />
    ))}
  </Shimmer>
);
