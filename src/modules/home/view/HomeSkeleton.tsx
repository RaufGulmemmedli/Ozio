'use client';

/**
 * `/home` mirror skeleton — `html/app-states/app-esas-loading.html` (`SduyB`) is the drawn truth.
 *
 * Same containers, gaps and grid columns as the loaded page, so nothing shifts when the data
 * lands: header bones 243×36 + 420×16 and the 153×52 CTA bone · hero 480 card bone + tracker
 * bones (head, 4 step circles of 44, courier row) · 4 stat tiles of 96 · 6 store tiles of
 * 172×143 · 4 product cards of 332.
 *
 * The presets take their size as inline style, so the responsive sizing lives on the wrapper and
 * each preset is told to fill it. Tinted fills (`BoneTint` inside `OzioCardSkeleton`) stay outside
 * the sweep; on the loaded page the section titles are real text and are never shimmered — while
 * loading the header is a bone because the greeting itself is data (the customer's name).
 */
import type { ReactNode } from 'react';

import {
  Bone,
  OrderTrackerSkeleton,
  OzioCardSkeleton,
  ProductCardSkeleton,
  SectionHeaderSkeleton,
  Shimmer,
  StatTileSkeleton,
  StoreTileSkeleton,
} from '@/shared/skeleton';

const HERO_CARD_BOX = 'h-[260px] w-full lg:h-[300px] lg:w-[480px] lg:shrink-0';
const HERO_SIDE_BOX = 'w-full lg:h-[300px] lg:flex-1';

function HeaderBones() {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-5">
      <div className="flex flex-col gap-2.5">
        <Bone w="min(243px, 60vw)" h={36} r={12} />
        <Bone w="min(420px, 80vw)" h={16} r="sm" />
      </div>
      <Bone w={153} h={52} r="pill" className="hidden lg:block" />
    </div>
  );
}

function HeroBones() {
  return (
    <div className="flex w-full flex-col gap-5 lg:flex-row lg:gap-6">
      <div className={HERO_CARD_BOX}>
        <OzioCardSkeleton w="100%" h="100%" />
      </div>
      <div className={HERO_SIDE_BOX}>
        <OrderTrackerSkeleton w="100%" h="100%" />
      </div>
    </div>
  );
}

function StatBones({ count = 4 }: { count?: number }) {
  return (
    <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
      {Array.from({ length: count }, (_, i) => (
        <StatTileSkeleton key={i} />
      ))}
    </div>
  );
}

function StoreBones({ count = 6 }: { count?: number }) {
  return (
    <div className="flex w-full flex-row gap-3 overflow-hidden lg:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-32 shrink-0 lg:w-[172px]">
          <StoreTileSkeleton w="100%" h="auto" />
        </div>
      ))}
    </div>
  );
}

function ProductBones({ count = 4, cols = 4 }: { count?: number; cols?: 3 | 4 }) {
  return (
    <div
      className={
        cols === 4
          ? 'grid w-full grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4'
          : 'grid w-full grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5'
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

/** The whole page, for the route-level fallback and `?preview=loading`. */
export function HomeSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-8">
      <HeaderBones />
      <HeroBones />
      <StatBones />
      <div className="flex w-full flex-col gap-5">
        <SectionHeaderSkeleton />
        <StoreBones />
      </div>
      <div className="flex w-full flex-col gap-5">
        <SectionHeaderSkeleton />
        <ProductBones />
      </div>
    </Shimmer>
  );
}

/* --------------------------------------------------------- per-section roots */

function Root({ children, className }: { children: ReactNode; className?: string }) {
  return <Shimmer className={className}>{children}</Shimmer>;
}

export const HeroSkeleton = () => (
  <Root className="w-full">
    <HeroBones />
  </Root>
);

/** The hero's right-hand half only (tracker / slider), while the card is already loaded. */
export const TrackerSkeleton = () => (
  <Root className={HERO_SIDE_BOX}>
    <OrderTrackerSkeleton w="100%" h="100%" />
  </Root>
);

/** The hero's left-hand card only. */
export const OzioCardOnlySkeleton = () => (
  <Root className={HERO_CARD_BOX}>
    <OzioCardSkeleton w="100%" h="100%" />
  </Root>
);

export const StatsSkeleton = ({ count = 4 }: { count?: number }) => (
  <Root className="w-full">
    <StatBones count={count} />
  </Root>
);

export const StoreRailSkeleton = ({ count = 6 }: { count?: number }) => (
  <Root className="w-full">
    <StoreBones count={count} />
  </Root>
);

export const ProductsSkeleton = ({ count = 4, cols = 4 }: { count?: number; cols?: 3 | 4 }) => (
  <Root className="w-full">
    <ProductBones count={count} cols={cols} />
  </Root>
);

/** Greeting bones (the name is data, so the header shimmers while the profile loads). */
export const GreetingSkeleton = () => (
  <Root className="w-full">
    <HeaderBones />
  </Root>
);
