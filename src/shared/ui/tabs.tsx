"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/core/lib/cn";
import type { LucideIcon } from "@/shared/lucide";

interface TabsContextValue {
  value: string | undefined;
}

const TabsContext = createContext<TabsContextValue>({ value: undefined });

export interface TabsProps {
  /** Controlled active tab. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

/**
 * Underline tabs (components.md §6). Radix Tabs underneath, so
 * `role="tablist"/"tab"/"tabpanel"`, arrow keys and `aria-selected` come for
 * free; the 3px brand indicator slides between triggers.
 */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  orientation = "horizontal",
}: TabsProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;

  const handleChange = useCallback(
    (next: string) => {
      setUncontrolled(next);
      onValueChange?.(next);
    },
    [onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: current }}>
      <TabsPrimitive.Root
        value={current}
        onValueChange={handleChange}
        orientation={orientation}
        className={cn("flex flex-col", className)}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children?: ReactNode;
  className?: string;
  /** Accessible name of the tab strip. */
  label?: string;
  /** Hide the sliding indicator (e.g. when the tabs sit on a tinted strip). */
  hideIndicator?: boolean;
}

/** Row gap 32, bottom 1px `line`, sliding 3px `brand` indicator. */
export function TabsList({ children, className, label, hideIndicator = false }: TabsListProps) {
  const { value } = useContext(TabsContext);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
    if (!active) {
      setIndicator(null);
      return;
    }
    setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
  }, []);

  useEffect(() => {
    measure();
  }, [measure, value, children]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <TabsPrimitive.List
      ref={listRef}
      aria-label={label}
      className={cn(
        "relative flex items-end gap-8 overflow-x-auto border-b border-line",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
      {hideIndicator || !indicator ? null : (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-[3px] rounded-[2px] bg-brand transition-[transform,width] duration-[var(--oz-dur-base)] ease-in-out"
          style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
        />
      )}
    </TabsPrimitive.List>
  );
}

export interface TabsTriggerProps {
  value: string;
  children?: ReactNode;
  /** Optional 20px `brand` count circle, 11/700 white. */
  count?: number;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
}

/** Label 15 (active 15/700 `ink`, inactive 15/500 `ink2`) + optional count. */
export function TabsTrigger({
  value,
  children,
  count,
  icon: Icon,
  disabled,
  className,
}: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      disabled={disabled}
      className={cn(
        "group flex shrink-0 items-center gap-2 whitespace-nowrap pb-[14px] pt-2 text-[15px]",
        "transition-colors duration-[var(--oz-dur-fast)] ease-out",
        "font-medium text-ink2 data-[state=active]:font-bold data-[state=active]:text-ink",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {Icon ? <Icon size={18} aria-hidden="true" /> : null}
      {children}
      {typeof count === "number" ? (
        <span className="flex size-5 items-center justify-center rounded-pill bg-brand text-[11px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </TabsPrimitive.Trigger>
  );
}

export interface TabsContentProps {
  value: string;
  children?: ReactNode;
  className?: string;
  forceMount?: boolean;
}

export function TabsContent({ value, children, className, forceMount }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      value={value}
      forceMount={forceMount ? true : undefined}
      className={cn("outline-none", className)}
    >
      {children}
    </TabsPrimitive.Content>
  );
}

/* -------------------------------------------------------------------------- */
/* SegmentedControl — pill tabs ("Aktiv / Keçmiş")                            */
/* -------------------------------------------------------------------------- */

export interface SegmentedControlOption {
  value: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedControlOption[];
  /** Accessible name of the group. */
  label?: string;
  className?: string;
  fullWidth?: boolean;
}

/**
 * 44 high, padding-inline 22, pill; active `cta`/`on-cta`, inactive
 * `surface`/`ink2`, gap 10 (components.md §6, Orders toolbar).
 */
export function SegmentedControl({
  value,
  onValueChange,
  options,
  label,
  className,
  fullWidth = false,
}: SegmentedControlProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} activationMode="automatic">
      <TabsPrimitive.List
        aria-label={label}
        className={cn("flex items-center gap-2.5", fullWidth && "w-full", className)}
      >
        {options.map((option) => (
          <TabsPrimitive.Trigger
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              "flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill px-[22px]",
              "text-[14px] font-semibold",
              "transition-[background-color,color,transform] duration-[var(--oz-dur-fast)] ease-out",
              "bg-surface text-ink2 active:scale-[.97]",
              "data-[state=active]:bg-cta data-[state=active]:text-on-cta",
              "disabled:cursor-not-allowed disabled:opacity-40",
              fullWidth && "flex-1",
            )}
          >
            {option.icon ? <option.icon size={18} aria-hidden="true" /> : null}
            {option.label}
            {typeof option.count === "number" ? (
              <span className="text-[13px] font-bold opacity-70">{option.count}</span>
            ) : null}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
