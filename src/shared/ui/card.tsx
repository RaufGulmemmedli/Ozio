import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/core/lib/cn";

export type CardTone = "surface" | "block" | "brand" | "yellow" | "soft";
export type CardRadius = "card" | "xl" | "bento" | "modal" | "2xl";

const TONE: Record<CardTone, string> = {
  surface: "bg-surface text-ink border border-line",
  block: "bg-block text-on-block border border-transparent",
  brand: "bg-brand text-white border border-transparent",
  yellow: "bg-yellow text-on-yellow border border-transparent",
  soft: "bg-surface2 text-ink border border-transparent",
};

const RADIUS: Record<CardRadius, string> = {
  card: "rounded-card",
  xl: "rounded-xl",
  bento: "rounded-bento",
  modal: "rounded-modal",
  "2xl": "rounded-2xl",
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Element/component to render. Defaults to `div`. */
  as?: ElementType;
  tone?: CardTone;
  radius?: CardRadius;
  /** Adds the hover lift + border shift + press scale from components.md §5. */
  interactive?: boolean;
  children?: ReactNode;
  /** Convenience passthrough when `as` is a link component. */
  href?: string;
}

/**
 * The card shell. **Flat by design — no shadows on cards.**
 * tones `surface | block | brand | yellow | soft`;
 * radii `card`(24) `xl`(28) `bento`(36) `modal`(32) `2xl`(48).
 */
export function Card({
  as,
  tone = "surface",
  radius = "card",
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  const Comp = (as ?? "div") as ElementType;
  return (
    <Comp
      className={cn(
        "relative",
        TONE[tone],
        RADIUS[radius],
        interactive && [
          "cursor-pointer transition-[transform,border-color,background-color] duration-[var(--oz-dur-base)] ease-out",
          "hover:-translate-y-0.5 hover:border-ink3 active:scale-[.99]",
        ],
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}
