/**
 * kind → icon + tint, for the drawn icon tiles.
 *
 * The exports paint a flat 140/160/300 tile in a per-kind tint with a single glyph on top — there
 * are no product photographs in this module's fixtures, so `<ProductImage>` would only render its
 * placeholder. Every tint below is a token (`yellow`, `brand-soft`, `violet-soft`, `sky-soft`,
 * `success-soft`), so both themes are covered.
 *
 * Icons come from `@/shared/lucide` only (BUILD-CONTRACT rule 9). Lucide has no battery / cable /
 * gum glyph in this project's curated set, so the nearest available ones are used: `Zap` for the
 * batteries, `Smartphone` for the USB-C cable and `Sparkles` for the gum.
 */
import {
  Bike,
  ChefHat,
  Coffee,
  Croissant,
  CupSoda,
  Monitor,
  ShieldCheck,
  ShoppingBag,
  Shirt,
  Smartphone,
  Sparkles,
  Zap,
  type LucideIcon,
} from '@/shared/lucide';

import type { BagItemKind, ExpertProductKind } from '../data/models';

export interface TileLook {
  icon: LucideIcon;
  /** Tailwind token fill for the tile behind the glyph. */
  tint: string;
  /** Token colour for the glyph itself. */
  ink: string;
}

export const BAG_ITEM_LOOK: Record<BagItemKind, TileLook> = {
  battery: { icon: Zap, tint: 'bg-yellow', ink: 'text-on-yellow' },
  chocolate: { icon: Croissant, tint: 'bg-brand-soft', ink: 'text-brand' },
  coffee: { icon: Coffee, tint: 'bg-violet-soft', ink: 'text-violet' },
  cable: { icon: Smartphone, tint: 'bg-sky-soft', ink: 'text-sky' },
  water: { icon: CupSoda, tint: 'bg-sky-soft', ink: 'text-sky' },
  gum: { icon: Sparkles, tint: 'bg-success-soft', ink: 'text-success' },
};

export const EXPERT_PRODUCT_ICON: Record<ExpertProductKind, LucideIcon> = {
  bike: Bike,
  tv: Monitor,
  hood: ChefHat,
};

/** The three hub services, in the drawn order. */
export const SERVICE_ICON = {
  bag: ShoppingBag,
  fit: Shirt,
  expert: ShieldCheck,
} as const;
