import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Our Tailwind theme replaces the default scales with named Ozio tokens
 * (see `src/app/globals.css`). tailwind-merge does not know them, and for
 * `text-*` it cannot tell a font size from a text colour, so by default it
 * files `text-caption` under *text colour* — which makes
 * `cn("text-caption text-ink2")` silently drop the size.
 *
 * Declaring the custom scales here fixes that for every call site.
 */
const FONT_SIZES = [
  "nano",
  "micro",
  "caption",
  "label",
  "body-sm",
  "body",
  "body-l",
  "h4",
  "h3",
  "h2",
  "h1-app",
  "h1",
  "hero-lg",
  "hero",
  "display",
  "display-404",
] as const;

const COLORS = [
  "bg",
  "surface",
  "surface2",
  "ink",
  "ink2",
  "ink3",
  "line",
  "brand",
  "brand-dark",
  "brand-soft",
  "yellow",
  "success",
  "success-soft",
  "sky",
  "sky-soft",
  "violet",
  "violet-soft",
  "block",
  "cta",
  "on-cta",
  "on-block",
  "on-block2",
  "on-block3",
  "on-yellow",
  "white",
  "danger",
  "danger-soft",
  "warn",
  "warn-soft",
  "overlay",
  // accessible small-text variants (see globals.css)
  "brand-text",
  "success-text",
  "sky-text",
  "violet-text",
  "warn-text",
  "danger-text",
] as const;

const RADII = [
  "xs",
  "sm",
  "md",
  "lg",
  "card",
  "xl",
  "modal",
  "bento",
  "2xl",
  "pill",
] as const;

const SHADOWS = ["toast", "chip", "menu", "modal", "float"] as const;

const twMerge = extendTailwindMerge({
  override: {
    theme: {
      // `text` is tailwind-merge's font-size scale (Tailwind v4's `--text-*`).
      // Declaring it is what keeps `cn("text-caption text-ink2")` from
      // dropping the size, while `cn("text-caption text-h3")` still wins last.
      text: [...FONT_SIZES],
      color: [...COLORS],
      radius: [...RADII],
      shadow: [...SHADOWS],
    },
  },
});

/** The single class-name joiner. Never concatenate class strings by hand. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
