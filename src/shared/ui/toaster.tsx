"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/core/lib/cn";

import { Toast, useToastStore } from "./toast";

export interface ToasterProps {
  /**
   * Distance from the bottom edge of the viewport for the bottom-anchored
   * stack. Defaults to 24px. Pass
   * `calc(68px + 28px + env(safe-area-inset-bottom))` on screens that render
   * the mobile bottom pill so toasts clear it.
   */
  offsetBottom?: number | string;
  /** Where toasts sit below 768px. Desktop is always bottom-right. */
  mobilePosition?: "top" | "bottom";
  /** Keep at most this many toasts on screen (oldest are dropped). */
  max?: number;
  /** aria-label of each toast's close button. Pass a translated string. */
  closeLabel?: string;
  className?: string;
}

/**
 * Mount once in the app shell. Stacks bottom-right on desktop (24px from the
 * edges) and top-centre, full-width minus 40, on mobile (components.md §7).
 */
export function Toaster({
  offsetBottom = 24,
  mobilePosition = "top",
  max = 4,
  closeLabel,
  className,
}: ToasterProps) {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);
  const [closing, setClosing] = useState<string[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const requestClose = useCallback(
    (id: string) => {
      if (timers.current.has(id)) return;
      setClosing((current) => (current.includes(id) ? current : [...current, id]));
      const timer = setTimeout(() => {
        timers.current.delete(id);
        setClosing((current) => current.filter((item) => item !== id));
        dismiss(id);
      }, 160);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, []);

  const visible = toasts.slice(-max);
  if (visible.length === 0) return null;

  const bottom = typeof offsetBottom === "number" ? `${offsetBottom}px` : offsetBottom;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[80] flex flex-col gap-3",
        // desktop: bottom-right, 24px from the edges
        "md:bottom-[var(--oz-toaster-bottom)] md:left-auto md:right-6 md:top-auto md:items-end",
        // mobile: full width minus 40
        "max-md:left-5 max-md:right-5 max-md:items-stretch",
        mobilePosition === "top"
          ? "max-md:top-5"
          : "max-md:bottom-[var(--oz-toaster-bottom)] max-md:top-auto",
        className,
      )}
      style={{ "--oz-toaster-bottom": bottom } as CSSProperties}
    >
      {visible.map((item) => (
        <Toast
          key={item.id}
          toast={item}
          onDismiss={requestClose}
          closing={closing.includes(item.id)}
          closeLabel={closeLabel}
        />
      ))}
    </div>
  );
}
