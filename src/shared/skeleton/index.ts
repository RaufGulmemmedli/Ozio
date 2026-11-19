/**
 * `@/shared/skeleton` — the skeleton system (architecture/05,
 * design-system/skeletons.md).
 *
 * Rules every caller inherits:
 * - **One `<Shimmer>` per skeleton root.** Nesting is harmless but pointless.
 * - Static chrome (page title, nav, section headings, buttons that do not
 *   depend on data) stays real and is **not** shimmered.
 * - Tinted block fills (`BoneTint`) stay outside the shimmer; only the bones
 *   on top sweep.
 * - The skeleton mirrors the loaded layout: same container sizes, same gaps,
 *   same grid columns — no layout shift.
 * - `prefers-reduced-motion` is handled in `globals.css`; never re-implement it.
 */

export { Shimmer, type ShimmerProps } from './shimmer';
export {
  Bone,
  BONE_RADIUS_CLASS,
  boneRadius,
  type BoneProps,
  type BoneRadius,
  type BoneRadiusToken,
  type BoneTone,
} from './bone';
export {
  BoneCard,
  BoneTint,
  type BoneCardProps,
  type BoneTintProps,
  type BoneTintTone,
} from './bone-card';
export { BoneText, BoneTitle, type BoneTextProps, type BoneTitleProps } from './bone-text';
export { BoneList, BoneRow, type BoneListProps, type BoneRowProps } from './bone-list';

export {
  // catalog
  ProductCardSkeleton,
  ProductGridSkeleton,
  StoreTileSkeleton,
  StatTileSkeleton,
  // hero
  OzioCardSkeleton,
  OrderTrackerSkeleton,
  // cart / checkout
  CartRowSkeleton,
  SummaryCardSkeleton,
  // list rows
  OrderRowSkeleton,
  CouponTicketSkeleton,
  TransactionRowSkeleton,
  AddressRowSkeleton,
  PartnerCardSkeleton,
  NotificationRowSkeleton,
  TicketSkeleton,
  ListRowSkeleton,
  // table / form
  TableSkeleton,
  FormSkeleton,
  // headers & blocks
  DetailHeaderSkeleton,
  SectionHeaderSkeleton,
  GallerySkeleton,
  ChipRowSkeleton,
  BannerSkeleton,
  MapSkeleton,
  // route fallback
  PageSkeleton,
} from './presets';
