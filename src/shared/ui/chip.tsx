"use client";

import {
  forwardRef,
  useCallback,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/core/lib/cn";
import type { LucideIcon } from "@/shared/lucide";

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Active state: fill `ink`, label `bg` 14/600. */
  selected?: boolean;
  /** Rendered as "· n" after the label. */
  count?: number;
  leadingIcon?: LucideIcon;
  children?: ReactNode;
}

/**
 * Chip (components.md §3): height 40, padding-inline 18, pill, label 14.
 * Used for categories, city selection and filter tabs.
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, count, leadingIcon: Icon, children, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-selected={selected || undefined}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-pill px-[18px] text-[14px]",
        "transition-[background-color,border-color,color,transform] duration-[var(--oz-dur-fast)] ease-out",
        "active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
        selected
          ? "border border-transparent bg-ink font-semibold text-bg"
          : "border border-line bg-surface font-medium text-ink hover:border-ink3",
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon size={16} aria-hidden="true" className="shrink-0" /> : null}
      {children}
      {typeof count === "number" ? (
        <span aria-hidden="true" className="opacity-60">
          · {count}
        </span>
      ) : null}
    </button>
  );
});

export interface ChipOption {
  value: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface ChipGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ChipOption[];
  /** Accessible name of the group (pass a translated string). */
  label?: string;
  className?: string;
  /** Let the row scroll horizontally instead of wrapping (mobile filters). */
  scroll?: boolean;
}

/**
 * Single-select chip row: `role="radiogroup"` with roving tabindex and
 * arrow-key navigation (components.md §3 a11y note).
 */
export function ChipGroup({
  value,
  onValueChange,
  options,
  label,
  className,
  scroll = false,
}: ChipGroupProps) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const focusAt = useCallback(
    (index: number) => {
      const enabled = options.filter((option) => !option.disabled);
      if (enabled.length === 0) return;
      const next = enabled[((index % enabled.length) + enabled.length) % enabled.length];
      onValueChange(next.value);
      const node = listRef.current?.querySelector<HTMLButtonElement>(
        `[data-chip-value="${next.value}"]`,
      );
      node?.focus();
    },
    [onValueChange, options],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const enabled = options.filter((option) => !option.disabled);
      const index = enabled.findIndex((option) => option.value === value);
      if (index < 0) return;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          focusAt(index + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          focusAt(index - 1);
          break;
        case "Home":
          event.preventDefault();
          focusAt(0);
          break;
        case "End":
          event.preventDefault();
          focusAt(enabled.length - 1);
          break;
        default:
          break;
      }
    },
    [focusAt, options, value],
  );

  return (
    <div
      ref={listRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "flex items-center gap-2",
        scroll
          ? "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex-wrap",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Chip
            key={option.value}
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            data-chip-value={option.value}
            selected={selected}
            count={option.count}
            leadingIcon={option.icon}
            disabled={option.disabled}
            onClick={() => onValueChange(option.value)}
          >
            {option.label}
          </Chip>
        );
      })}
    </div>
  );
}
