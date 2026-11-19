import type { ReactNode } from "react";

import { cn } from "@/core/lib/cn";
import type { LucideIcon } from "@/shared/lucide";

export type BadgeTone = "brand" | "yellow" | "success" | "sky" | "neutral" | "violet";

const TONE: Record<BadgeTone, string> = {
  brand: "bg-brand text-white",
  yellow: "bg-yellow text-on-yellow",
  // 12/700 is small text, so these use the accessible *-text tokens rather than
  // the plain accents: `text-success` on `bg-success-soft` measures 2.99:1 and
  // `text-sky` on `bg-sky-soft` 2.81:1, both failing AA. The *-text variants
  // clear 4.5:1 in both themes and keep the same hue. See globals.css.
  success: "bg-success-soft text-success-text",
  sky: "bg-sky-soft text-sky-text",
  neutral: "bg-surface2 text-ink2",
  violet: "bg-violet-soft text-violet-text",
};

export interface BadgeProps {
  /** Status colour. Orders: aktiv→success, yolda/gözləyir→sky, ləğv→neutral. */
  tone?: BadgeTone;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}

/**
 * Badge (components.md §3): height 28, padding-inline 12, pill, 12/700.
 */
export function Badge({ tone = "neutral", icon: Icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-3 text-[12px] font-bold",
        TONE[tone],
        className,
      )}
    >
      {Icon ? <Icon size={14} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export interface CountBadgeProps {
  count: number;
  /** Values above this render as "max+". */
  max?: number;
  className?: string;
  /** Accessible description, e.g. "3 yeni bildiriş". Falls back to the number. */
  label?: string;
}

/** 22px circle, `brand`, 12/700 white (cart / bell / nav counts). */
export function CountBadge({ count, max = 99, className, label }: CountBadgeProps) {
  if (count <= 0) return null;
  const text = count > max ? `${max}+` : String(count);
  return (
    <span
      aria-label={label}
      className={cn(
        "inline-flex size-[22px] shrink-0 items-center justify-center rounded-pill bg-brand px-1 text-[12px] font-bold text-white",
        className,
      )}
    >
      {text}
    </span>
  );
}

export interface StepPillProps {
  current: number;
  total: number;
  className?: string;
  /** Overrides the "7 / 10" rendering (e.g. for a localised separator). */
  children?: ReactNode;
}

/** Tier/step pill "7 / 10": 30 high, `brand-soft`, `brand-dark` 13/700. */
export function StepPill({ current, total, className, children }: StepPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[30px] shrink-0 items-center rounded-pill bg-brand-soft px-3 text-[13px] font-bold text-brand-dark",
        className,
      )}
    >
      {children ?? `${current} / ${total}`}
    </span>
  );
}
