/**
 * Skeleton presets — the shapes every screen in the design needs, built from
 * the primitives in this folder so a skeleton cannot drift from its layout.
 *
 * Sizes are the measured ones from `design-system/skeletons.md` and the
 * `html/app-states/*-loading.html` frames. Widths default to `'100%'` wherever
 * the design's fixed width comes from the grid/column the card sits in (a
 * product card is "263 at 4 cols, 269 at 3, 167 mobile" — the card fills its
 * cell); the measured value is given in each doc comment.
 *
 * None of these render their own `<Shimmer>` — wrap a screen skeleton in one
 * `<Shimmer label={t('loading')}>`. The only exception is `<PageSkeleton>`,
 * the route-level fallback, which is self-contained.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

import { Bone, type BoneRadius } from './bone';
import { BoneCard, BoneTint, type BoneTintTone } from './bone-card';
import { BoneRow } from './bone-list';
import { BoneText } from './bone-text';
import { Shimmer } from './shimmer';

type Sizeable = { w?: number | string; h?: number | string; className?: string };

/* ------------------------------------------------------------------ catalog */

const PRODUCT_NAME_WIDTHS = ['72%', '86%', '64%', '80%'];

/**
 * Product card (`S1/Bone Card`). Measured **263×332** at 4 columns.
 * Radius 24, padding 12, gap 12 — the *loaded* card's metrics, so there is no
 * shift when the data lands.
 */
export function ProductCardSkeleton({ className, index = 0 }: { className?: string; index?: number }) {
  const name = PRODUCT_NAME_WIDTHS[Math.abs(index) % PRODUCT_NAME_WIDTHS.length];
  return (
    <BoneCard bordered={false} r="card" pad={12} gap={12} className={className}>
      <Bone w="100%" h={200} r={16} />
      <Bone w={name} h={16} r="sm" />
      <Bone w="60%" h={13} r="xs" />
      <div className="flex w-full flex-row items-center justify-between">
        <Bone w={70} h={20} r="sm" />
        <Bone w={40} h={40} r="full" />
      </div>
    </BoneCard>
  );
}

const GRID_COLS: Record<2 | 3 | 4 | 5, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
};

/**
 * The catalog grid at gap 20: desktop `cols`, tablet 2–3, mobile 2 — the same
 * breakpoints as the loaded grid.
 */
export function ProductGridSkeleton({
  cols = 4,
  count,
  className,
}: {
  cols?: 2 | 3 | 4 | 5;
  count?: number;
  className?: string;
}) {
  const items = count ?? cols * 2;
  return (
    <div className={cn('grid w-full gap-5', GRID_COLS[cols], className)}>
      {Array.from({ length: Math.max(items, 0) }, (_, i) => (
        <ProductCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

/** Store tile from the home rail. **172×143**, padding 18, gap 14. */
export function StoreTileSkeleton({ w = 172, h = 143, className }: Sizeable) {
  return (
    <BoneCard bordered={false} r="card" pad={18} gap={14} w={w} h={h} className={className}>
      <Bone w={56} h={56} r={18} />
      <Bone w={90} h={15} r="sm" />
      <Bone w={60} h={13} r="xs" />
    </BoneCard>
  );
}

/** Stat tile. **263×96** in the 4-up row at 1112, padding 22, gap 16. */
export function StatTileSkeleton({ w = '100%', h = 96, className }: Sizeable) {
  return (
    <BoneCard bordered={false} r="card" pad={22} gap={16} row w={w} h={h} className={className}>
      <Bone w={52} h={52} r={16} />
      <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
        <Bone w={90} h={13} r="xs" />
        <Bone w={60} h={26} r="sm" />
      </div>
    </BoneCard>
  );
}

/* --------------------------------------------------------------------- hero */

/**
 * The Ozio card block. **480×300**, `rounded-xl`.
 * The tint is a `BoneTint`, so its fill stays outside the shimmer and only the
 * logo / tier / balance bones on top sweep.
 */
export function OzioCardSkeleton({
  w = 480,
  h = 300,
  tone = 'surface2',
  className,
}: Sizeable & { tone?: Extract<BoneTintTone, 'surface2' | 'brand' | 'block'> }) {
  const boneTone = tone === 'surface2' ? 'surface' : 'white';
  return (
    <BoneTint tone={tone} r="xl" w={w} h={h} pad={28} className={cn('justify-between', className)}>
      <div className="flex w-full flex-row items-start justify-between">
        <Bone w={96} h={28} r="sm" tone={boneTone} />
        <Bone w={56} h={14} r="xs" tone={boneTone} />
      </div>
      <div className="flex flex-col gap-3">
        <Bone w={120} h={14} r="xs" tone={boneTone} />
        <Bone w={200} h={44} r={12} tone={boneTone} />
        <Bone w={110} h={14} r="xs" tone={boneTone} />
      </div>
    </BoneTint>
  );
}

/**
 * Live order tracker. **608×300**, `rounded-xl`: kicker + title, an ETA pill,
 * a 4-step row joined by 56×4 line bones, and the courier footer row.
 */
export function OrderTrackerSkeleton({
  steps = 4,
  w = '100%',
  h = 300,
  className,
}: Sizeable & { steps?: number }) {
  const stepCount = Math.max(steps, 1);
  return (
    <BoneCard
      r="xl"
      pad={28}
      gap={24}
      w={w}
      h={h}
      className={cn('justify-between', className)}
    >
      <div className="flex w-full flex-row items-start justify-between">
        <div className="flex flex-col gap-[10px]">
          <Bone w={110} h={12} r="xs" />
          <Bone w={200} h={26} r="sm" />
        </div>
        <Bone w={80} h={32} r={16} />
      </div>

      <div className="flex w-full flex-row items-start justify-between">
        {Array.from({ length: stepCount }, (_, i) => (
          <div key={i} className="flex flex-row items-center">
            <div className="flex flex-col items-center gap-[10px]">
              <Bone w={48} h={48} r="full" />
              <Bone w={60} h={13} r="xs" />
            </div>
            {i < stepCount - 1 ? <Bone w={56} h={4} r="full" className="mx-[10px] mb-[23px]" /> : null}
          </div>
        ))}
      </div>

      <div className="flex w-full flex-row items-center gap-[14px]">
        <Bone w={40} h={40} r="full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Bone w={150} h={14} r="sm" />
          <Bone w={90} h={12} r="xs" />
        </div>
        <Bone w={64} h={40} r={18} />
      </div>
    </BoneCard>
  );
}

/* --------------------------------------------------------------- cart rows */

/**
 * One cart line. Thumb 80, stepper bone 112×40, price bone 70×20.
 * Row content only — the loaded cart separates rows with a real 1px `line`.
 */
export function CartRowSkeleton({ className, index = 0 }: { className?: string; index?: number }) {
  const widths = [200, 168, 220, 184];
  return (
    <div className={cn('flex w-full flex-row items-center gap-4 py-5', className)}>
      <Bone w={80} h={80} r={16} />
      <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
        <Bone w={widths[Math.abs(index) % widths.length]} h={16} r="sm" />
        <Bone w={120} h={12} r="xs" />
      </div>
      <Bone w={112} h={40} r="lg" />
      <Bone w={70} h={20} r="sm" />
    </div>
  );
}

const SUMMARY_LABEL_WIDTHS = [120, 90, 140, 100, 112];

/**
 * Checkout / mini-cart summary: the `<dl>` shape — `rows` label/value bone
 * rows, a real divider, a total row and the 56-high CTA bone.
 */
export function SummaryCardSkeleton({
  rows = 4,
  cta = true,
  w = '100%',
  className,
}: Sizeable & { rows?: number; cta?: boolean }) {
  return (
    <BoneCard r="xl" pad={28} gap={20} w={w} className={className}>
      <Bone w={80} h={28} r="sm" />
      <dl className="flex w-full flex-col gap-[14px]">
        {Array.from({ length: Math.max(rows, 0) }, (_, i) => (
          <div key={i} className="flex w-full flex-row items-center justify-between">
            <dt>
              <Bone w={SUMMARY_LABEL_WIDTHS[i % SUMMARY_LABEL_WIDTHS.length]} h={14} r="xs" />
            </dt>
            <dd>
              <Bone w={70} h={14} r="xs" />
            </dd>
          </div>
        ))}
      </dl>
      <div className="h-px w-full bg-line" />
      <div className="flex w-full flex-row items-center justify-between">
        <Bone w={90} h={20} r="sm" />
        <Bone w={110} h={26} r="sm" />
      </div>
      {cta ? <Bone w="100%" h={56} r="pill" /> : null}
    </BoneCard>
  );
}

/* -------------------------------------------------------------- list rows */

/** Order row. **708×104**, padding 22, gap 20, thumb 60. */
export function OrderRowSkeleton({ w = '100%', h = 104, className, index = 0 }: Sizeable & { index?: number }) {
  const widths = [180, 212, 164, 196];
  return (
    <BoneCard r="card" pad={22} gap={20} row w={w} h={h} className={className}>
      <Bone w={60} h={60} r={16} />
      <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
        <Bone w={widths[Math.abs(index) % widths.length]} h={16} r="sm" />
        <Bone w={260} h={12} r="xs" />
      </div>
      <Bone w={90} h={32} r={16} />
      <Bone w={70} h={22} r="sm" />
    </BoneCard>
  );
}

/**
 * Coupon ticket. **546×168**, radius 24, 1px `line`, with the perforation and
 * the 150-wide `surface2` stub.
 */
export function CouponTicketSkeleton({ w = '100%', h = 168, className }: Sizeable) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex flex-row items-stretch overflow-hidden rounded-card border border-line bg-surface',
        className,
      )}
      style={{ width: w, height: h }}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-6">
        <Bone w={220} h={18} r="sm" />
        <Bone w={160} h={12} r="xs" />
        <Bone w={120} h={12} r="xs" />
      </div>
      <div className="w-px border-l border-dashed border-line" />
      <BoneTint tone="surface2" r={0} w={150} h="100%" className="items-center justify-center">
        <Bone w={64} h={14} r="xs" tone="surface" />
      </BoneTint>
    </div>
  );
}

/** Bonus transaction row: 44 circle + two text bones + amount bone. */
export function TransactionRowSkeleton({ className, index = 0 }: { className?: string; index?: number }) {
  return (
    <BoneRow
      thumb={44}
      circle
      titleH={14}
      metaH={12}
      gap={14}
      textGap={8}
      trailingW={70}
      trailingH={16}
      index={index}
      className={className}
    />
  );
}

/**
 * Saved address card. **546×328**, radius 28, padding 24: map bone 180 high,
 * title, one line and the tag bones.
 */
export function AddressRowSkeleton({ w = '100%', className, map = true }: Sizeable & { map?: boolean }) {
  return (
    <BoneCard r="xl" pad={24} gap={14} w={w} className={className}>
      {map ? <Bone w="100%" h={180} r="lg" /> : null}
      <Bone w={160} h={18} r="sm" />
      <Bone w="100%" h={14} r="xs" />
      <div className="flex flex-row gap-2">
        <Bone w={90} h={28} r="pill" />
        <Bone w={70} h={28} r="pill" />
      </div>
    </BoneCard>
  );
}

/** Partner card. **263×238**, radius 24, padding 12, gap 14, image 140 high. */
export function PartnerCardSkeleton({ w = '100%', h = 238, className }: Sizeable) {
  return (
    <BoneCard bordered={false} r="card" pad={12} gap={14} w={w} h={h} className={className}>
      <Bone w="100%" h={140} r={16} />
      <Bone w={150} h={16} r="sm" />
      <Bone w={100} h={12} r="xs" />
    </BoneCard>
  );
}

/** Notification row: icon chip 44 + title/body bones + a time bone. */
export function NotificationRowSkeleton({
  w = '100%',
  className,
  index = 0,
}: Sizeable & { index?: number }) {
  const widths = ['70%', '58%', '76%', '64%'];
  return (
    <BoneCard r="card" pad={18} gap={14} row w={w} className={cn('items-start', className)}>
      <Bone w={44} h={44} r={14} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Bone w={widths[Math.abs(index) % widths.length]} h={15} r="sm" />
        <Bone w="90%" h={12} r="xs" />
      </div>
      <Bone w={48} h={12} r="xs" />
    </BoneCard>
  );
}

/**
 * Lottery ticket / active-draw hero. **680×499**, radius 36, `surface2` tint
 * (the dark `block` region is not used while loading) with 3 centred bones.
 */
export function TicketSkeleton({ w = '100%', h = 499, className }: Sizeable) {
  return (
    <BoneTint
      tone="surface2"
      r="bento"
      w={w}
      h={h}
      pad={32}
      gap={20}
      className={cn('items-center justify-center', className)}
    >
      <Bone w={160} h={14} r="xs" tone="surface" />
      <Bone w={360} h={44} r={12} tone="surface" />
      <Bone w={240} h={14} r="xs" tone="surface" />
    </BoneTint>
  );
}

/** The generic list row as a card. **420×96**, radius 24, padding 20, gap 16. */
export function ListRowSkeleton({
  w = '100%',
  h = 96,
  className,
  index = 0,
}: Sizeable & { index?: number }) {
  return (
    <BoneCard r="card" pad={20} gap={16} row w={w} h={h} className={className}>
      <BoneRow index={index} />
    </BoneCard>
  );
}

/* ------------------------------------------------------------ table / form */

/** Table skeleton: a head row of label bones plus `rows` body rows. */
export function TableSkeleton({
  cols = 4,
  rows = 5,
  head = true,
  className,
}: {
  cols?: number;
  rows?: number;
  head?: boolean;
  className?: string;
}) {
  const template = `repeat(${Math.max(cols, 1)}, minmax(0, 1fr))`;
  return (
    <BoneCard r="xl" pad={0} gap={0} className={cn('overflow-hidden', className)}>
      {head ? (
        <>
          <div className="grid w-full items-center gap-5 px-6 py-[18px]" style={{ gridTemplateColumns: template }}>
            {Array.from({ length: Math.max(cols, 1) }, (_, c) => (
              <Bone key={c} w={c === 0 ? '60%' : '45%'} h={13} r="xs" />
            ))}
          </div>
          <div className="h-px w-full bg-line" />
        </>
      ) : null}
      {Array.from({ length: Math.max(rows, 0) }, (_, r) => (
        <div key={r} className="w-full">
          <div className="grid w-full items-center gap-5 px-6 py-5" style={{ gridTemplateColumns: template }}>
            {Array.from({ length: Math.max(cols, 1) }, (_, c) => (
              <Bone key={c} w={c === 0 ? '85%' : c % 2 === 0 ? '55%' : '70%'} h={14} r="xs" />
            ))}
          </div>
          {r < rows - 1 ? <div className="h-px w-full bg-line" /> : null}
        </div>
      ))}
    </BoneCard>
  );
}

/** Form skeleton: per field a 80×13 label bone over a 56-high input bone. */
export function FormSkeleton({
  fields = 4,
  cols = 1,
  submit = true,
  className,
}: {
  fields?: number;
  cols?: 1 | 2;
  submit?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full flex-col gap-5', className)}>
      <div className={cn('grid w-full gap-5', cols === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
        {Array.from({ length: Math.max(fields, 0) }, (_, i) => (
          <div key={i} className="flex w-full flex-col gap-2">
            <Bone w={80} h={13} r="xs" />
            <Bone w="100%" h={56} r="md" />
          </div>
        ))}
      </div>
      {submit ? <Bone w="100%" h={56} r="pill" /> : null}
    </div>
  );
}

/* -------------------------------------------------------- headers & blocks */

/**
 * Page/detail header skeleton: title bone **243×36** over a subtitle bone
 * **420×16**, with the optional **153×52** CTA bone on the right.
 * Use it only where the title itself is data — a static page title stays real
 * and un-shimmered (architecture/05 §2).
 */
export function DetailHeaderSkeleton({
  action = false,
  titleW = 243,
  subtitleW = 420,
  className,
}: {
  action?: boolean;
  titleW?: number | string;
  subtitleW?: number | string;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full flex-row items-start justify-between gap-5', className)}>
      <div className="flex min-w-0 flex-col gap-[10px]">
        <Bone w={titleW} h={36} r={12} />
        <Bone w={subtitleW} h={16} r="sm" />
      </div>
      {action ? <Bone w={153} h={52} r="pill" /> : null}
    </div>
  );
}

/** Section head: a 140×24 heading bone plus the optional 90×14 link bone. */
export function SectionHeaderSkeleton({
  action = true,
  titleW = 140,
  className,
}: {
  action?: boolean;
  titleW?: number | string;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full flex-row items-center justify-between gap-5', className)}>
      <Bone w={titleW} h={24} r="sm" />
      {action ? <Bone w={90} h={14} r="xs" /> : null}
    </div>
  );
}

/**
 * Product page top: the **540** gallery (main image + thumb row) beside the
 * **532** info column. Stacks under `lg`, exactly like the loaded page.
 */
export function GallerySkeleton({ thumbs = 4, className }: { thumbs?: number; className?: string }) {
  return (
    <div className={cn('flex w-full flex-col gap-10 lg:flex-row', className)}>
      <div className="flex w-full flex-col gap-3 lg:w-[540px] lg:shrink-0">
        <Bone w="100%" h="auto" r="bento" className="aspect-square" />
        <div className="flex flex-row gap-3">
          {Array.from({ length: Math.max(thumbs, 0) }, (_, i) => (
            <Bone key={i} w={96} h={96} r={16} />
          ))}
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-5 lg:w-[532px]">
        <Bone w={241} h={32} r={16} />
        <Bone w="100%" h={40} r={12} className="max-w-[400px]" />
        <Bone w={185} h={20} r="sm" />
        <Bone w={206} h={55} r={12} />
        <Bone w={197} h={36} r={18} />
        <div className="h-px w-full bg-line" />
        <div className="flex w-full flex-row gap-3">
          <Bone w={132} h={56} r="xl" />
          <Bone w="100%" h={56} r="xl" className="min-w-0 flex-1" />
        </div>
        <BoneText lines={2} last="40%" h={14} gap={10} w="70%" />
      </div>
    </div>
  );
}

const CHIP_WIDTHS = [96, 120, 84, 132, 104, 112, 88];

/** A row of chip bones: height 40, pill radius, deterministic widths 84–132. */
export function ChipRowSkeleton({
  count = 7,
  h = 40,
  className,
}: {
  count?: number;
  h?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full flex-row flex-wrap gap-[10px]', className)}>
      {Array.from({ length: Math.max(count, 0) }, (_, i) => (
        <Bone key={i} w={CHIP_WIDTHS[i % CHIP_WIDTHS.length]} h={h} r="pill" />
      ))}
    </div>
  );
}

/**
 * Banner / hero tint block. **1112×140**, `rounded-xl`. The fill is outside
 * the shimmer — only the highlight sweeps over it.
 */
export function BannerSkeleton({
  w = '100%',
  h = 140,
  r = 'xl',
  tone = 'surface2',
  className,
}: Sizeable & { r?: BoneRadius; tone?: BoneTintTone }) {
  return <BoneTint tone={tone} r={r} w={w} h={h} className={className} />;
}

/** Map tint block (no moving pins while loading). Radius 20 by default. */
export function MapSkeleton({
  w = '100%',
  h = 200,
  r = 'lg',
  className,
}: Sizeable & { r?: BoneRadius }) {
  return <BoneTint tone="surface2" r={r} w={w} h={h} className={className} />;
}

/* ---------------------------------------------------------------- fallback */

function GenericSectionSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <section className="flex w-full flex-col gap-5">
      <SectionHeaderSkeleton />
      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: Math.max(cards, 0) }, (_, i) => (
          <BoneCard key={i} r="card" pad={18} gap={12} h={132}>
            <Bone w={44} h={44} r={14} />
            <BoneText lines={2} last="55%" h={12} gap={8} />
          </BoneCard>
        ))}
      </div>
    </section>
  );
}

/**
 * The generic shell-level fallback for a route's `loading.tsx`: a page-header
 * bone row plus three section blocks. Self-contained — it renders its own
 * `<Shimmer>`, so pass the localized loading label.
 *
 * A screen with a real skeleton should ship that instead; this is the fallback
 * for navigation transitions, never a substitute for the mirror skeleton.
 */
export function PageSkeleton({
  sections = 3,
  action = true,
  label,
  className,
}: {
  sections?: number;
  action?: boolean;
  label?: string;
  className?: string;
}): ReactNode {
  return (
    <Shimmer label={label} className={cn('flex w-full flex-col gap-8', className)}>
      <DetailHeaderSkeleton action={action} />
      {Array.from({ length: Math.max(sections, 0) }, (_, i) => (
        <GenericSectionSkeleton key={i} />
      ))}
    </Shimmer>
  );
}
