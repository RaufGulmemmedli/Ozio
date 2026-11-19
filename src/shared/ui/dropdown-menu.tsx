"use client";

import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

import { cn } from "@/core/lib/cn";
import type { LucideIcon } from "@/shared/lucide";

import styles from "./ui.module.css";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuGroup = MenuPrimitive.Group;
export const DropdownMenuSub = MenuPrimitive.Sub;
export const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;

const CONTENT_CLASS =
  "z-[70] flex flex-col gap-0.5 rounded-lg border border-line bg-surface p-2 text-ink shadow-menu outline-none";

export interface DropdownMenuContentProps
  extends Omit<ComponentPropsWithoutRef<typeof MenuPrimitive.Content>, "asChild"> {
  /** Menu width. Default 260 (components.md §6). */
  width?: number | string;
}

/** 260 wide, `surface`, 1px `line`, radius 20, padding 8, gap 2, shadow menu. */
export function DropdownMenuContent({
  width = 260,
  className,
  sideOffset = 8,
  align = "end",
  style,
  ...rest
}: DropdownMenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        collisionPadding={16}
        className={cn(styles.menuPanel, CONTENT_CLASS, className)}
        style={
          {
            width: typeof width === "number" ? `${width}px` : width,
            maxWidth: "calc(100vw - 32px)",
            ...style,
          } as CSSProperties
        }
        {...rest}
      />
    </MenuPrimitive.Portal>
  );
}

export interface DropdownMenuItemProps
  extends Omit<ComponentPropsWithoutRef<typeof MenuPrimitive.Item>, "asChild"> {
  icon?: LucideIcon;
  /** Renders the label and icon in `brand` (e.g. "Çıxış"). */
  destructive?: boolean;
  /** Right-aligned slot: a value, a badge or a chevron. */
  trailing?: ReactNode;
}

/** Item: 44 high, padding-inline 12, gap 12, radius 12, icon 18 + label 14/500. */
export function DropdownMenuItem({
  icon: Icon,
  destructive = false,
  trailing,
  className,
  children,
  ...rest
}: DropdownMenuItemProps) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "flex h-11 cursor-pointer select-none items-center gap-3 rounded-[12px] px-3 outline-none",
        "text-[14px] font-medium",
        "transition-colors duration-[var(--oz-dur-fast)] ease-out",
        "data-[highlighted]:bg-surface2 data-[state=open]:bg-surface2",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
        destructive ? "text-brand" : "text-ink",
        className,
      )}
      {...rest}
    >
      {Icon ? (
        <Icon
          size={18}
          aria-hidden="true"
          className={cn("shrink-0", destructive ? "text-brand" : "text-ink2")}
        />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className="shrink-0 text-ink3">{trailing}</span> : null}
    </MenuPrimitive.Item>
  );
}

/** Checkable variant with the same geometry. */
export function DropdownMenuCheckboxItem({
  icon: Icon,
  className,
  children,
  ...rest
}: Omit<ComponentPropsWithoutRef<typeof MenuPrimitive.CheckboxItem>, "asChild"> & {
  icon?: LucideIcon;
}) {
  return (
    <MenuPrimitive.CheckboxItem
      className={cn(
        "flex h-11 cursor-pointer select-none items-center gap-3 rounded-[12px] px-3 outline-none",
        "text-[14px] font-medium text-ink",
        "transition-colors duration-[var(--oz-dur-fast)] ease-out",
        "data-[highlighted]:bg-surface2 data-[state=checked]:text-ink",
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon size={18} aria-hidden="true" className="shrink-0 text-ink2" /> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <MenuPrimitive.ItemIndicator className="shrink-0 text-brand">
        <span aria-hidden="true" className="block size-2 rounded-pill bg-brand" />
      </MenuPrimitive.ItemIndicator>
    </MenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...rest
}: Omit<ComponentPropsWithoutRef<typeof MenuPrimitive.RadioItem>, "asChild">) {
  return (
    <MenuPrimitive.RadioItem
      className={cn(
        "flex h-11 cursor-pointer select-none items-center gap-3 rounded-[12px] px-3 outline-none",
        "text-[14px] font-medium text-ink",
        "transition-colors duration-[var(--oz-dur-fast)] ease-out",
        "data-[highlighted]:bg-surface2",
        className,
      )}
      {...rest}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <MenuPrimitive.ItemIndicator className="shrink-0">
        <span aria-hidden="true" className="block size-2 rounded-pill bg-brand" />
      </MenuPrimitive.ItemIndicator>
    </MenuPrimitive.RadioItem>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <MenuPrimitive.Separator className={cn("my-1 h-px bg-line", className)} />;
}

export function DropdownMenuLabel({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <MenuPrimitive.Label
      className={cn(
        "px-3 pb-1 pt-2 text-[12px] font-bold uppercase tracking-[1px] text-ink3",
        className,
      )}
    >
      {children}
    </MenuPrimitive.Label>
  );
}
