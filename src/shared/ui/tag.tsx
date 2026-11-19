import type { ReactNode } from "react";

import { cn } from "@/core/lib/cn";

export interface TagProps {
  /** Discount copy, e.g. "-20%". */
  children?: ReactNode;
  className?: string;
}

/**
 * Tag/Yellow (components.md §3): height 28, padding-inline 12, pill,
 * `yellow` fill, `on-yellow` 13/700. Sits top-left inside a product image.
 */
export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-pill bg-yellow px-3 text-[13px] font-bold text-on-yellow",
        className,
      )}
    >
      {children}
    </span>
  );
}
