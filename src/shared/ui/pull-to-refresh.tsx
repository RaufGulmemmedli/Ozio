"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/core/lib/cn";
import { Loader } from "@/shared/lucide";

import styles from "./ui.module.css";

export interface PullToRefreshProps {
  onRefresh: () => void | Promise<unknown>;
  children: ReactNode;
  /** Pull distance in px that triggers the refresh. Default 72. */
  threshold?: number;
  disabled?: boolean;
  /** Visually hidden status text while refreshing. */
  label?: string;
  className?: string;
}

/**
 * Touch-width pull to refresh. The spinner is allowed here (motion.md §3).
 * Enabled only for coarse pointers below 768px; desktop renders children
 * untouched.
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 72,
  disabled = false,
  label,
  className,
}: PullToRefreshProps) {
  const [touch, setTouch] = useState(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(pointer: coarse) and (max-width: 767px)");
    const update = () => setTouch(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const active = touch && !disabled && !refreshing;

  const onTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!active) return;
      if (window.scrollY > 0) return;
      start.current = event.touches[0]?.clientY ?? null;
    },
    [active],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!active || start.current === null) return;
      const current = event.touches[0]?.clientY ?? start.current;
      setPull(Math.max(0, Math.min(threshold * 1.5, current - start.current)));
    },
    [active, threshold],
  );

  const onTouchEnd = useCallback(() => {
    if (start.current === null) return;
    const travelled = pull;
    start.current = null;
    setPull(0);
    if (travelled < threshold) return;
    setRefreshing(true);
    void Promise.resolve(onRefresh()).finally(() => setRefreshing(false));
  }, [onRefresh, pull, threshold]);

  const indicatorHeight = refreshing ? 48 : Math.min(pull, threshold);

  return (
    <div
      className={cn("relative", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {touch ? (
        <div className={styles.ptrIndicator} style={{ height: indicatorHeight }}>
          {indicatorHeight > 8 ? (
            <Loader
              size={24}
              aria-hidden="true"
              className={refreshing ? "oz-spinner" : undefined}
              style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }}
            />
          ) : null}
          {refreshing && label ? (
            <span role="status" className="sr-only">
              {label}
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
