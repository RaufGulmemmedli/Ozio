"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/core/lib/cn";
import { X } from "@/shared/lucide";

import styles from "./ui.module.css";

/* -------------------------------------------------------------------------- */
/* drag-to-dismiss (shared by Sheet / Modal / Drawer on touch)                */
/* -------------------------------------------------------------------------- */

export interface DragDismissOptions {
  onDismiss: () => void;
  enabled?: boolean;
  /** Pixels the panel must travel before it closes. */
  threshold?: number;
}

/**
 * Minimal touch drag: follows the finger downwards and dismisses past the
 * threshold. Pointer type `mouse` is ignored so desktop keeps its own close
 * affordances. Internal — not part of the public barrel.
 */
export function useDragDismiss({ onDismiss, enabled = true, threshold = 80 }: DragDismissOptions) {
  const [offset, setOffset] = useState(0);
  const start = useRef<number | null>(null);

  const reset = useCallback(() => {
    start.current = null;
    setOffset(0);
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled || event.pointerType === "mouse") return;
      start.current = event.clientY;
    },
    [enabled],
  );

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (start.current === null) return;
    setOffset(Math.max(0, event.clientY - start.current));
  }, []);

  const onPointerEnd = useCallback(() => {
    if (start.current === null) return;
    const travelled = offset;
    reset();
    if (travelled > threshold) onDismiss();
  }, [offset, onDismiss, reset, threshold]);

  const style: CSSProperties | undefined =
    offset > 0 ? { transform: `translateY(${offset}px)`, transition: "none" } : undefined;

  return {
    offset,
    style,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
  };
}

/** The 40x4 pill at the top of a mobile sheet. Internal. */
export function DragHandle({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex h-7 shrink-0 items-center justify-center md:hidden", className)}
    >
      <span className="h-1 w-10 rounded-pill bg-line" />
    </div>
  );
}

/** Shared 36px circular close button (modal / sheet / drawer head). */
export function OverlayCloseButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <DialogPrimitive.Close
      aria-label={label}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface2 text-ink",
        "transition-[background-color,transform] duration-[var(--oz-dur-fast)] ease-out",
        "hover:bg-line active:scale-[.97]",
        className,
      )}
    >
      <X size={16} aria-hidden="true" />
    </DialogPrimitive.Close>
  );
}

/* -------------------------------------------------------------------------- */
/* Sheet                                                                      */
/* -------------------------------------------------------------------------- */

export type SheetSize = "sm" | "md" | "lg" | "xl";

const SHEET_WIDTH: Record<SheetSize, string> = {
  sm: "360px",
  md: "420px",
  lg: "560px",
  xl: "760px",
};

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name. Pass `titleHidden` to keep it out of the visual head. */
  title: string;
  titleHidden?: boolean;
  description?: string;
  /** Side-panel width at >=768px. Below that the sheet is always full-width. */
  size?: SheetSize;
  /** Scrim click / outside interaction closes the sheet. Default `true`. */
  dismissible?: boolean;
  /** aria-label of the close button (pass a translated string). */
  closeLabel?: string;
  hideClose?: boolean;
  /** Extra nodes in the head row, right of the title. */
  headActions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  trigger?: ReactNode;
}

/**
 * Bottom sheet below 768px, right side panel at >=768px (components.md §7,
 * motion.md §5). Radix Dialog gives focus trap, Esc, scroll lock and focus
 * restore for free.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  titleHidden = false,
  description,
  size = "md",
  dismissible = true,
  closeLabel = "Close",
  hideClose = false,
  headActions,
  footer,
  children,
  className,
  bodyClassName,
  trigger,
}: SheetProps) {
  const drag = useDragDismiss({ onDismiss: () => onOpenChange(false) });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.scrim} />
        <DialogPrimitive.Content
          className={cn(styles.sheetPanel, "text-ink outline-none", className)}
          style={{ "--oz-sheet-w": SHEET_WIDTH[size], ...drag.style } as CSSProperties}
          onInteractOutside={(event) => {
            if (!dismissible) event.preventDefault();
          }}
        >
          <div {...drag.handlers}>
            <DragHandle />
            <div className="flex items-center gap-3 px-5 pb-4 pt-1 md:px-6 md:pt-6">
              <div className="min-w-0 flex-1">
                {titleHidden ? (
                  <VisuallyHidden asChild>
                    <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
                  </VisuallyHidden>
                ) : (
                  <DialogPrimitive.Title className="truncate text-[20px] font-bold text-ink">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description ? (
                  <DialogPrimitive.Description className="mt-1 text-[14px] font-normal text-ink2">
                    {description}
                  </DialogPrimitive.Description>
                ) : null}
              </div>
              {headActions}
              {hideClose ? null : <OverlayCloseButton label={closeLabel} />}
            </div>
          </div>

          <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 md:px-6", bodyClassName)}>
            {children}
          </div>

          {footer ? (
            <div className="shrink-0 border-t border-line px-5 py-4 md:px-6">{footer}</div>
          ) : (
            <div className="h-5 shrink-0 md:h-6" />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
