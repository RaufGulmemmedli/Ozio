"use client";

import type { ReactNode } from "react";

import { cn } from "@/core/lib/cn";
import type { LucideIcon } from "@/shared/lucide";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "@/shared/lucide";

export type BannerTone = "info" | "warning" | "error" | "success";

const TONE: Record<BannerTone, { shell: string; icon: string; action: string }> = {
  info: { shell: "bg-sky-soft text-ink", icon: "text-sky", action: "text-sky" },
  warning: { shell: "bg-yellow text-on-yellow", icon: "text-on-yellow", action: "text-on-yellow" },
  error: { shell: "bg-brand-soft text-ink", icon: "text-brand", action: "text-brand" },
  success: { shell: "bg-success-soft text-ink", icon: "text-success", action: "text-success" },
};

const TONE_ICON: Record<BannerTone, LucideIcon> = {
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
  success: CircleCheck,
};

export interface BannerProps {
  tone?: BannerTone;
  /** Message, 14/500. */
  children?: ReactNode;
  /** Trailing action, 14/700 in the tone colour. */
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
  onDismiss?: () => void;
  /** aria-label of the close button. Pass a translated string. */
  dismissLabel?: string;
  icon?: LucideIcon;
  /** Hide the leading icon entirely. */
  hideIcon?: boolean;
  className?: string;
}

/**
 * Banner (components.md §7): full-width row, 56 high, padding-inline 20,
 * radius 16, gap 12, 20px icon, text 14/500, action 14/700.
 * `role="status"`; errors get `role="alert"`.
 */
export function Banner({
  tone = "info",
  children,
  action,
  dismissible = false,
  onDismiss,
  dismissLabel = "Close",
  icon,
  hideIcon = false,
  className,
}: BannerProps) {
  const Icon = icon ?? TONE_ICON[tone];
  const palette = TONE[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex w-full items-center gap-3 rounded-[16px] px-5 py-3 max-md:py-4 md:h-14 md:py-0",
        palette.shell,
        className,
      )}
    >
      {hideIcon ? null : (
        <Icon size={20} aria-hidden="true" className={cn("shrink-0", palette.icon)} />
      )}
      <span className="min-w-0 flex-1 text-[14px] font-medium">{children}</span>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            "shrink-0 whitespace-nowrap text-[14px] font-bold transition-opacity duration-[var(--oz-dur-fast)] ease-out hover:opacity-80",
            palette.action,
          )}
        >
          {action.label}
        </button>
      ) : null}
      {dismissible ? (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className={cn(
            "-mr-2 flex size-8 shrink-0 items-center justify-center rounded-pill transition-opacity duration-[var(--oz-dur-fast)] ease-out hover:opacity-70",
            palette.icon,
          )}
        >
          <X size={18} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
