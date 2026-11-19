"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useRef, type ReactNode } from "react";
import { create } from "zustand";

import { cn } from "@/core/lib/cn";
import type { LucideIcon } from "@/shared/lucide";
import { CircleAlert, CircleCheck } from "@/shared/lucide";

import styles from "./ui.module.css";

export type DialogTone = "brand" | "success";

const ICON_CHIP: Record<DialogTone, string> = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
};

const DEFAULT_ICON: Record<DialogTone, LucideIcon> = {
  brand: CircleAlert,
  success: CircleCheck,
};

/* -------------------------------------------------------------------------- */
/* Local button styling                                                       */
/* -------------------------------------------------------------------------- */
/* The dialog owns its two equal 52h actions, so it does not depend on the
   shared <Button> (different package owner) for its own layout. */

const ACTION_BASE =
  "flex h-13 flex-1 items-center justify-center rounded-pill px-6 text-[16px] font-semibold " +
  "transition-[background-color,color,transform] duration-[var(--oz-dur-fast)] ease-out " +
  "active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-40";

const ACTION_SOFT = "bg-surface2 text-ink hover:bg-line";
const ACTION_BRAND = "bg-brand text-white hover:bg-brand-dark";

/* -------------------------------------------------------------------------- */
/* ConfirmDialog (components.md §7 "Dialogs", 410 wide)                       */
/* -------------------------------------------------------------------------- */

export interface ConfirmDialogOptions {
  title: string;
  /** 15/400/1.5 ink2 body copy. */
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Icon chip tint. `brand` is also the destructive look (brand confirm). */
  tone?: DialogTone;
  icon?: LucideIcon;
  /** Destructive flows keep the brand confirm button and block scrim dismiss. */
  destructive?: boolean;
}

export interface ConfirmDialogProps extends ConfirmDialogOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  /** Disables both actions and dims the confirm button (e.g. while mutating). */
  busy?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * Centred 410px confirm dialog: 64px icon chip, title 22/700, body 15/400/1.5,
 * then two equal 52h buttons (soft cancel + brand confirm).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "brand",
  icon,
  destructive = false,
  busy = false,
  children,
  className,
}: ConfirmDialogProps) {
  const Icon = icon ?? DEFAULT_ICON[tone];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.scrim} />
        <DialogPrimitive.Content
          className={cn(styles.dialogPanel, "items-stretch text-ink outline-none", className)}
          onInteractOutside={(event) => {
            if (destructive) event.preventDefault();
          }}
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex size-16 items-center justify-center rounded-pill",
              ICON_CHIP[tone],
            )}
          >
            <Icon size={28} />
          </span>

          <DialogPrimitive.Title className="text-[22px] font-bold leading-[1.25] text-ink">
            {title}
          </DialogPrimitive.Title>

          {body ? (
            <DialogPrimitive.Description className="text-[15px] font-normal leading-[1.5] text-ink2">
              {body}
            </DialogPrimitive.Description>
          ) : null}

          {children}

          <div className="flex gap-3 pt-2.5">
            <button
              type="button"
              disabled={busy}
              className={cn(ACTION_BASE, ACTION_SOFT)}
              onClick={() => {
                onCancel?.();
                onOpenChange(false);
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={busy}
              aria-busy={busy || undefined}
              className={cn(ACTION_BASE, ACTION_BRAND)}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* Imperative confirmDialog() — tiny store + a host mounted once              */
/* -------------------------------------------------------------------------- */

interface ConfirmRequest extends ConfirmDialogOptions {
  id: number;
  resolve: (value: boolean) => void;
}

interface ConfirmStore {
  request: ConfirmRequest | null;
  open: boolean;
  ask: (request: ConfirmRequest) => void;
  settle: (value: boolean) => void;
  clear: () => void;
}

const useConfirmStore = create<ConfirmStore>((set, get) => ({
  request: null,
  open: false,
  ask: (request) => {
    const previous = get().request;
    if (previous) previous.resolve(false);
    set({ request, open: true });
  },
  settle: (value) => {
    const { request } = get();
    if (!request) return;
    request.resolve(value);
    set({ open: false });
  },
  clear: () => set({ request: null }),
}));

let confirmSequence = 0;

/**
 * Ask for a confirmation from anywhere (repositories, hooks, event handlers)
 * without rendering a component. Requires `<ConfirmDialogHost/>` mounted once
 * in the app shell. Resolves `false` when cancelled, dismissed or superseded.
 */
export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    confirmSequence += 1;
    useConfirmStore.getState().ask({ ...options, id: confirmSequence, resolve });
  });
}

/** Mount once (next to `<Toaster/>`) to enable `confirmDialog()`. */
export function ConfirmDialogHost() {
  const request = useConfirmStore((state) => state.request);
  const open = useConfirmStore((state) => state.open);
  const settle = useConfirmStore((state) => state.settle);
  const clear = useConfirmStore((state) => state.clear);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the panel mounted for the 140ms exit animation, then drop it.
  useEffect(() => {
    if (open || !request) return;
    timer.current = setTimeout(clear, 200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open, request, clear]);

  if (!request) return null;

  return (
    <ConfirmDialog
      key={request.id}
      open={open}
      onOpenChange={(next) => {
        if (!next) settle(false);
      }}
      onConfirm={() => settle(true)}
      title={request.title}
      body={request.body}
      confirmLabel={request.confirmLabel}
      cancelLabel={request.cancelLabel}
      tone={request.tone}
      icon={request.icon}
      destructive={request.destructive}
    />
  );
}
