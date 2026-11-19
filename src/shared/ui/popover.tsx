"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ReactNode } from "react";

import { cn } from "@/core/lib/cn";

import styles from "./ui.module.css";

export interface PopoverProps {
  /** Anchor. Rendered through `asChild`, so pass a single focusable element. */
  trigger: ReactNode;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  /** Fixed content width; omit for content-driven width. */
  width?: number | string;
  /** Accessible name for the popover surface. */
  label?: string;
  className?: string;
  contentClassName?: string;
  modal?: boolean;
}

/**
 * Token-styled Radix popover: `surface`, 1px `line`, radius 20, padding 8,
 * shadow `menu`; opens from the trigger corner in 160ms (motion.md §2).
 */
export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  defaultOpen,
  side = "bottom",
  align = "end",
  sideOffset = 8,
  alignOffset = 0,
  width,
  label,
  className,
  contentClassName,
  modal = false,
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
      modal={modal}
    >
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          collisionPadding={16}
          aria-label={label}
          style={width ? { width: typeof width === "number" ? `${width}px` : width } : undefined}
          className={cn(
            styles.menuPanel,
            "z-[70] max-w-[calc(100vw-32px)] rounded-lg border border-line bg-surface p-2 text-ink shadow-menu outline-none",
            className,
            contentClassName,
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export const PopoverRoot = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

/** Pre-styled content for when you need the compound form. */
export function PopoverContent({
  children,
  className,
  side = "bottom",
  align = "end",
  sideOffset = 8,
  ...rest
}: PopoverPrimitive.PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={16}
        className={cn(
          styles.menuPanel,
          "z-[70] max-w-[calc(100vw-32px)] rounded-lg border border-line bg-surface p-2 text-ink shadow-menu outline-none",
          className,
        )}
        {...rest}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
