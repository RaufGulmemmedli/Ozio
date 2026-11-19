"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { create } from "zustand";

import { cn } from "@/core/lib/cn";

import styles from "./ui.module.css";

export const SNACKBAR_DURATION = 4000;

export interface SnackbarProps {
  /** Message, 14 `on-block`. */
  message: string;
  /** Action label, 14/700 `yellow` (e.g. "Geri qaytar"). */
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  /** Auto-dismiss in ms. 0 keeps it open. Default 4000. */
  duration?: number;
  className?: string;
}

/**
 * Snackbar (components.md §7): 52 high, padding-inline 20, radius 16, fill
 * `block`, text 14 `on-block` + action 14/700 `yellow`, gap 20.
 * Positioning is up to the caller; `<SnackbarHost/>` centres it at the bottom.
 */
export function Snackbar({
  message,
  actionLabel,
  onAction,
  onClose,
  duration = SNACKBAR_DURATION,
  className,
}: SnackbarProps) {
  const close = useRef(onClose);

  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => close.current?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, message]);

  return (
    <div
      role="status"
      className={cn(
        styles.snackbarItem,
        "pointer-events-auto flex h-13 max-w-full items-center gap-5 rounded-[16px] bg-block px-5",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate text-[14px] font-normal text-on-block">
        {message}
      </span>
      {actionLabel ? (
        <button
          type="button"
          onClick={() => {
            onAction?.();
            close.current?.();
          }}
          className="shrink-0 text-[14px] font-bold text-yellow transition-opacity duration-[var(--oz-dur-fast)] ease-out hover:opacity-80"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Imperative snackbar (used for cart undo)                                   */
/* -------------------------------------------------------------------------- */

export interface SnackbarRequest {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface SnackbarStore {
  current: SnackbarRequest | null;
  show: (request: SnackbarRequest) => void;
  hide: () => void;
}

const useSnackbarStore = create<SnackbarStore>((set) => ({
  current: null,
  show: (request) => set({ current: request }),
  hide: () => set({ current: null }),
}));

let snackbarSequence = 0;

/** Show the single bottom-centre snackbar from anywhere. */
export const snackbar = {
  show: (options: Omit<SnackbarRequest, "id">) => {
    snackbarSequence += 1;
    useSnackbarStore.getState().show({ ...options, id: snackbarSequence });
    return snackbarSequence;
  },
  hide: () => useSnackbarStore.getState().hide(),
};

export interface SnackbarHostProps {
  /**
   * Distance from the bottom edge. Pass
   * `calc(68px + 28px + env(safe-area-inset-bottom))` on screens with the
   * mobile bottom pill. Default 24px.
   */
  offsetBottom?: number | string;
  className?: string;
}

/** Mount once (next to `<Toaster/>`) to enable `snackbar.show()`. */
export function SnackbarHost({ offsetBottom = 24, className }: SnackbarHostProps) {
  const current = useSnackbarStore((state) => state.current);
  const hide = useSnackbarStore((state) => state.hide);
  if (!current) return null;

  const bottom = typeof offsetBottom === "number" ? `${offsetBottom}px` : offsetBottom;

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-[var(--oz-snackbar-bottom)] left-1/2 z-[80] w-[min(560px,calc(100vw-40px))] -translate-x-1/2",
        className,
      )}
      style={{ "--oz-snackbar-bottom": bottom } as CSSProperties}
    >
      <Snackbar
        key={current.id}
        message={current.message}
        actionLabel={current.actionLabel}
        onAction={current.onAction}
        duration={current.duration}
        onClose={hide}
      />
    </div>
  );
}
