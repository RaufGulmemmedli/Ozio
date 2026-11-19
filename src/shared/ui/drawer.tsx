"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/core/lib/cn";

import { DragHandle, OverlayCloseButton, useDragDismiss } from "./sheet";
import styles from "./ui.module.css";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Head title (20/700) and the dialog's accessible name. */
  title: string;
  titleHidden?: boolean;
  /** Optional meta line under the title, e.g. "3 məhsul". */
  subtitle?: string;
  /** Replaces the whole head row when you need custom chrome. */
  header?: ReactNode;
  /** Sticky footer (totals + checkout CTA). */
  footer?: ReactNode;
  children?: ReactNode;
  /** Panel width at >=768px. Default 420 (the cart drawer). */
  width?: number | string;
  dismissible?: boolean;
  closeLabel?: string;
  hideClose?: boolean;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  trigger?: ReactNode;
}

/**
 * Right-side cart drawer: 420 wide at >=768px (slide-in 200ms ease-out),
 * full-width bottom sheet below. Head + scrollable body + sticky footer.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  titleHidden = false,
  subtitle,
  header,
  footer,
  children,
  width = 420,
  dismissible = true,
  closeLabel = "Close",
  hideClose = false,
  className,
  bodyClassName,
  footerClassName,
  trigger,
}: DrawerProps) {
  const drag = useDragDismiss({ onDismiss: () => onOpenChange(false) });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.scrim} />
        <DialogPrimitive.Content
          className={cn(
            styles.sheetPanel,
            styles.drawerPanel,
            "bg-surface text-ink shadow-modal outline-none",
            className,
          )}
          style={
            {
              "--oz-sheet-w": typeof width === "number" ? `${width}px` : width,
              ...drag.style,
            } as CSSProperties
          }
          onInteractOutside={(event) => {
            if (!dismissible) event.preventDefault();
          }}
        >
          <div {...drag.handlers} className="shrink-0">
            <DragHandle />
            {titleHidden ? (
              <VisuallyHidden asChild>
                <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              </VisuallyHidden>
            ) : null}
            {header ?? (
              <div className="flex items-center gap-3 border-b border-line px-5 pb-4 pt-1 md:px-6 md:pb-5 md:pt-6">
                <div className="min-w-0 flex-1">
                  {titleHidden ? null : (
                    <DialogPrimitive.Title className="truncate text-[20px] font-bold text-ink">
                      {title}
                    </DialogPrimitive.Title>
                  )}
                  {subtitle ? (
                    <p className="mt-1 text-[13px] font-normal text-ink2">{subtitle}</p>
                  ) : null}
                </div>
                {hideClose ? null : <OverlayCloseButton label={closeLabel} />}
              </div>
            )}
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 md:px-6",
              bodyClassName,
            )}
          >
            {children}
          </div>

          {footer ? (
            <div
              className={cn(
                "sticky bottom-0 shrink-0 border-t border-line bg-surface px-5 py-4 md:px-6 md:py-5",
                "pb-[max(16px,env(safe-area-inset-bottom))] md:pb-5",
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
