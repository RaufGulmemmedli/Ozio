"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/core/lib/cn";

import { DragHandle, OverlayCloseButton, useDragDismiss } from "./sheet";
import styles from "./ui.module.css";

export type ModalSize = "s" | "m" | "l";

/** components.md §7 "Modal sizes": S 400 / M 560 / L 760. */
const MODAL_WIDTH: Record<ModalSize, string> = {
  s: "400px",
  m: "560px",
  l: "760px",
};

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Title row, 20/700. Also the dialog's accessible name. */
  title: string;
  /** Keep the title as an accessible name only (no visual head text). */
  titleHidden?: boolean;
  /** Optional sub-line under the title, wired to aria-describedby. */
  description?: string;
  size?: ModalSize;
  /**
   * `false` keeps the scrim/outside click from closing the modal (Esc still
   * works, per the a11y contract).
   */
  dismissible?: boolean;
  /** aria-label of the 36px close circle. Pass a translated string. */
  closeLabel?: string;
  hideClose?: boolean;
  /** Right-aligned actions row, gap 12 — pass Cancel (soft 48) + Confirm (primary 48). */
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  /** Rendered inside a Radix Trigger when the modal should own its opener. */
  trigger?: ReactNode;
}

/**
 * Centred modal at >=768px (padding 28, gap 20, radius 32, shadow modal),
 * full-width bottom sheet with a drag handle below 768px.
 * Radix Dialog supplies focus trap, Esc, scroll lock and focus restore.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  titleHidden = false,
  description,
  size = "m",
  dismissible = true,
  closeLabel = "Close",
  hideClose = false,
  footer,
  children,
  className,
  bodyClassName,
  footerClassName,
  trigger,
}: ModalProps) {
  const drag = useDragDismiss({ onDismiss: () => onOpenChange(false) });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.scrim} />
        <DialogPrimitive.Content
          className={cn(styles.modalPanel, "text-ink outline-none", className)}
          style={{ "--oz-modal-w": MODAL_WIDTH[size], ...drag.style } as CSSProperties}
          onInteractOutside={(event) => {
            if (!dismissible) event.preventDefault();
          }}
        >
          <div {...drag.handlers} className="shrink-0">
            <DragHandle />
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                {titleHidden ? (
                  <VisuallyHidden asChild>
                    <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
                  </VisuallyHidden>
                ) : (
                  <DialogPrimitive.Title className="text-[20px] font-bold leading-[1.3] text-ink">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description ? (
                  <DialogPrimitive.Description className="mt-2 text-[14px] font-normal leading-[1.5] text-ink2">
                    {description}
                  </DialogPrimitive.Description>
                ) : null}
              </div>
              {hideClose ? null : <OverlayCloseButton label={closeLabel} />}
            </div>
          </div>

          <div className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}>{children}</div>

          {footer ? (
            <div
              className={cn(
                "flex shrink-0 flex-wrap items-center justify-end gap-3 max-md:flex-col-reverse max-md:items-stretch",
                footerClassName,
              )}
            >
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * The 56-high `surface2` placeholder row the modal spec uses for body content
 * (components.md §7 "Body rows"). Handy for building modal bodies 1:1.
 */
export function ModalRow({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-14 items-center gap-3 rounded-[16px] bg-surface2 px-4 text-[15px] font-medium text-ink",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { DialogPrimitive as ModalPrimitive };
