import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/core/lib/cn";

import styles from "./ui.module.css";

export interface ResponsiveValue {
  base?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export interface GridProps extends HTMLAttributes<HTMLElement> {
  /** Column count per breakpoint: `{ base: 2, md: 3, lg: 4 }` or a number. */
  cols?: number | ResponsiveValue;
  /** Gap in px per breakpoint: `20` or `{ base: 12, md: 16, lg: 20 }`. */
  gap?: number | ResponsiveValue;
  as?: ElementType;
  children?: ReactNode;
}

const COL_VAR: Record<keyof ResponsiveValue, string> = {
  base: "--oz-grid-c-base",
  sm: "--oz-grid-c-sm",
  md: "--oz-grid-c-md",
  lg: "--oz-grid-c-lg",
  xl: "--oz-grid-c-xl",
};

const GAP_VAR: Record<keyof ResponsiveValue, string> = {
  base: "--oz-grid-g-base",
  sm: "--oz-grid-g-sm",
  md: "--oz-grid-g-md",
  lg: "--oz-grid-g-lg",
  xl: "--oz-grid-g-xl",
};

function toVars(
  value: number | ResponsiveValue | undefined,
  vars: Record<keyof ResponsiveValue, string>,
  unit: "" | "px",
): CSSProperties {
  if (value === undefined) return {};
  const style: Record<string, string> = {};
  if (typeof value === "number") {
    style[vars.base] = `${value}${unit}`;
    return style as CSSProperties;
  }
  (Object.keys(vars) as (keyof ResponsiveValue)[]).forEach((key) => {
    const step = value[key];
    if (typeof step === "number") style[vars[key]] = `${step}${unit}`;
  });
  return style as CSSProperties;
}

/**
 * The design's grid recipes as a component. The desktop product row is
 * 4 columns at gap 20, tablet 2-3 at gap 16, mobile 2 at gap 12-16
 * (layout.md breakpoints: sm 480 / md 768 / lg 1200 / 2xl 1440).
 *
 * `<Grid cols={{ base: 2, md: 3, lg: 4 }} gap={20}>`
 */
export function Grid({
  cols = { base: 2, md: 3, lg: 4 },
  gap = { base: 16, md: 16, lg: 20 },
  as,
  className,
  style,
  children,
  ...rest
}: GridProps) {
  const Comp = (as ?? "div") as ElementType;
  return (
    <Comp
      className={cn(styles.grid, className)}
      style={{ ...toVars(cols, COL_VAR, ""), ...toVars(gap, GAP_VAR, "px"), ...style }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
