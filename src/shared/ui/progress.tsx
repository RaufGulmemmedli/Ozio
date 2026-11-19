"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import type { ReactNode } from "react";

import { cn } from "@/core/lib/cn";

export type ProgressTone = "brand" | "success" | "yellow" | "violet" | "sky";

const FILL: Record<ProgressTone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  yellow: "bg-yellow",
  violet: "bg-violet",
  sky: "bg-sky",
};

const STROKE: Record<ProgressTone, string> = {
  brand: "stroke-brand",
  success: "stroke-success",
  yellow: "stroke-yellow",
  violet: "stroke-violet",
  sky: "stroke-sky",
};

function clampRatio(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(1, Math.max(0, value / max));
}

export interface ProgressProps {
  value: number;
  max?: number;
  tone?: ProgressTone;
  /** Track height in px. Default 8. */
  height?: number;
  /** Accessible name (pass a translated string). */
  label?: string;
  /** Visible value text, e.g. "7 / 10". Rendered above the track. */
  valueText?: string;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
}

/**
 * Token-styled bar: `surface2` track, `brand` fill, pill radius, 8 high.
 * Radix Progress supplies `role="progressbar"` + `aria-valuenow`.
 */
export function Progress({
  value,
  max = 100,
  tone = "brand",
  height = 8,
  label,
  valueText,
  className,
  trackClassName,
  barClassName,
}: ProgressProps) {
  const ratio = clampRatio(value, max);

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {valueText ? (
        <span className="text-[13px] font-bold text-ink2">{valueText}</span>
      ) : null}
      <ProgressPrimitive.Root
        value={value}
        max={max}
        aria-label={label}
        aria-valuetext={valueText}
        className={cn("relative w-full overflow-hidden rounded-pill bg-surface2", trackClassName)}
        style={{ height }}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full rounded-pill transition-[width] duration-[var(--oz-dur-slow)] ease-out",
            FILL[tone],
            barClassName,
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}

export interface ProgressRingProps {
  value: number;
  max?: number;
  tone?: ProgressTone;
  /** Outer diameter in px. Default 120. */
  size?: number;
  /** Ring thickness in px. Default 10. */
  strokeWidth?: number;
  /** Accessible name (pass a translated string). */
  label?: string;
  /** Spoken value, e.g. "Səviyyə 3". */
  valueText?: string;
  /** Centre content (tier name, percentage…). */
  children?: ReactNode;
  className?: string;
}

/** Ring variant for the level / tier UI. */
export function ProgressRing({
  value,
  max = 100,
  tone = "brand",
  size = 120,
  strokeWidth = 10,
  label,
  valueText,
  children,
  className,
}: ProgressRingProps) {
  const ratio = clampRatio(value, max);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      aria-label={label}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-surface2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={cn(
            "transition-[stroke-dashoffset] duration-[var(--oz-dur-slow)] ease-out",
            STROKE[tone],
          )}
        />
      </svg>
      {children ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </span>
      ) : null}
    </div>
  );
}
