"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

import { cn } from "@/core/lib/cn";
import { ChevronDown } from "@/shared/lucide";

import styles from "./ui.module.css";

/**
 * Mount once near the app root if you want a shared delay group; `<Tooltip>`
 * also provides its own provider so it works standalone.
 */
export const TooltipProvider = TooltipPrimitive.Provider;

export interface TooltipProps {
  /** Bubble copy (13/400 on-block). Pass a translated string. */
  label: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** Open delay in ms. Default 300 (components.md §3). */
  delayDuration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /** Set when the trigger is not itself focusable and you wrap a plain node. */
  asChild?: boolean;
}

/**
 * Bubble: padding-inline 14, height 36, radius 10, fill `block`,
 * text `on-block` 13/400, 16px chevron-down arrow below. Opens on hover and
 * on focus after 300ms; `role="tooltip"`.
 */
export function Tooltip({
  label,
  children,
  side = "top",
  align = "center",
  sideOffset = 8,
  delayDuration = 300,
  open,
  onOpenChange,
  className,
  asChild = true,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={200}>
      <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange} delayDuration={delayDuration}>
        <TooltipPrimitive.Trigger asChild={asChild}>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            role="tooltip"
            side={side}
            align={align}
            sideOffset={sideOffset}
            collisionPadding={12}
            className={cn(
              styles.tooltipBubble,
              "relative z-[75] flex h-9 max-w-[280px] items-center rounded-sm bg-block px-[14px]",
              "text-[13px] font-normal text-on-block",
              className,
            )}
          >
            {label}
            {side === "top" ? (
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[3px] text-block"
              >
                <ChevronDown size={16} strokeWidth={3} />
              </span>
            ) : (
              <TooltipPrimitive.Arrow width={16} height={8} className="fill-block" />
            )}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
