"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { create } from "zustand";

import { cn } from "@/core/lib/cn";
import type { LucideIcon } from "@/shared/lucide";
import { CircleAlert, CircleCheck, Info, X } from "@/shared/lucide";

import styles from "./ui.module.css";

export type ToastTone = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  /** Title, 15/700 `ink`. */
  title: string;
  /** Body, 13/400/1.4 `ink2`. */
  body?: string;
  action?: ToastAction;
  /** Override the auto-dismiss (ms). 0 keeps the toast until dismissed. */
  duration?: number;
  /** Reuse an id to replace an existing toast instead of stacking. */
  id?: string;
  icon?: LucideIcon;
}

export interface ToastRecord extends Omit<ToastInput, "id" | "duration"> {
  id: string;
  tone: ToastTone;
  duration: number;
}

/** Auto-dismiss 5s, errors 8s (components.md §7). */
export const TOAST_DURATION: Record<ToastTone, number> = {
  success: 5000,
  info: 5000,
  error: 8000,
};

const TONE_CHIP: Record<ToastTone, string> = {
  success: "bg-success-soft text-success",
  error: "bg-brand-soft text-brand",
  info: "bg-sky-soft text-sky",
};

const TONE_ICON: Record<ToastTone, LucideIcon> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
};

/* -------------------------------------------------------------------------- */
/* Headless store                                                            */
/* -------------------------------------------------------------------------- */

interface ToastStore {
  toasts: ToastRecord[];
  push: (toast: ToastRecord) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

/** Subscribe to this from a custom renderer if `<Toaster/>` is not enough. */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => ({
      toasts: [...state.toasts.filter((existing) => existing.id !== toast.id), toast],
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

let toastSequence = 0;

function emit(tone: ToastTone, input: string | ToastInput): string {
  const options: ToastInput = typeof input === "string" ? { title: input } : input;
  toastSequence += 1;
  const id = options.id ?? `oz-toast-${toastSequence}`;
  useToastStore.getState().push({
    id,
    tone,
    title: options.title,
    body: options.body,
    action: options.action,
    icon: options.icon,
    duration: options.duration ?? TOAST_DURATION[tone],
  });
  return id;
}

/**
 * Fire a toast from anywhere (hooks, repositories, event handlers).
 * Requires `<Toaster/>` mounted once in the app shell.
 * Every string is caller-supplied — this package never translates.
 */
export const toast = {
  success: (input: string | ToastInput) => emit("success", input),
  error: (input: string | ToastInput) => emit("error", input),
  info: (input: string | ToastInput) => emit("info", input),
  custom: (tone: ToastTone, input: string | ToastInput) => emit(tone, input),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
};

/* -------------------------------------------------------------------------- */
/* Presentational toast                                                      */
/* -------------------------------------------------------------------------- */

/** Auto-dismiss that pauses while the toast is hovered or focused. */
function useAutoDismiss(duration: number, onDone: () => void, paused: boolean) {
  const remaining = useRef(duration);
  const startedAt = useRef(0);
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (duration <= 0 || paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => done.current(), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    };
  }, [duration, paused]);
}

export interface ToastProps {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
  /** aria-label of the close button. Pass a translated string. */
  closeLabel?: string;
  /** Plays the 160ms exit fade. */
  closing?: boolean;
  className?: string;
}

/**
 * Toast card: 400 wide, `surface`, 1px `line`, radius 20, padding 16, gap 14,
 * shadow `toast`; 44px circle icon chip; title 15/700 + body 13/400/1.4.
 */
export function Toast({ toast: item, onDismiss, closeLabel = "Close", closing, className }: ToastProps) {
  const [paused, setPaused] = useState(false);
  const dismiss = useCallback(() => onDismiss(item.id), [item.id, onDismiss]);
  useAutoDismiss(item.duration, dismiss, paused || Boolean(closing));
  const Icon = item.icon ?? TONE_ICON[item.tone];

  return (
    <div
      role={item.tone === "error" ? "alert" : "status"}
      data-closing={closing ? "true" : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={cn(
        styles.toastItem,
        "pointer-events-auto flex w-[400px] max-w-full items-start gap-[14px] rounded-lg border border-line bg-surface p-4 shadow-toast",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-pill",
          TONE_CHIP[item.tone],
        )}
      >
        <Icon size={22} />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[15px] font-bold text-ink">{item.title}</p>
        {item.body ? (
          <p className="mt-0.5 text-[13px] font-normal leading-[1.4] text-ink2">{item.body}</p>
        ) : null}
        {item.action ? (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              dismiss();
            }}
            className="mt-2 text-[13px] font-bold text-brand transition-colors duration-[var(--oz-dur-fast)] ease-out hover:text-brand-dark"
          >
            {item.action.label}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        aria-label={closeLabel}
        onClick={dismiss}
        className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-pill text-ink3 transition-colors duration-[var(--oz-dur-fast)] ease-out hover:bg-surface2 hover:text-ink"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
