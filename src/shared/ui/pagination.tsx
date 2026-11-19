"use client";

import { cn } from "@/core/lib/cn";
import { ChevronLeft, ChevronRight } from "@/shared/lucide";

const CELL =
  "flex size-11 shrink-0 items-center justify-center rounded-pill text-[15px] font-semibold " +
  "transition-[background-color,border-color,color,transform] duration-[var(--oz-dur-fast)] ease-out";

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** aria-label of the nav landmark (pass a translated string). */
  label?: string;
  /** aria-label of the previous/next chevrons. */
  prevLabel?: string;
  nextLabel?: string;
  /** Pages shown either side of the current page. Default 1. */
  siblingCount?: number;
  className?: string;
}

type Cell = number | "gap-start" | "gap-end";

function buildCells(page: number, pageCount: number, siblingCount: number): Cell[] {
  if (pageCount <= 1) return pageCount === 1 ? [1] : [];
  const total = siblingCount * 2 + 5;
  if (pageCount <= total) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const left = Math.max(2, page - siblingCount);
  const right = Math.min(pageCount - 1, page + siblingCount);
  const cells: Cell[] = [1];

  if (left > 2) cells.push("gap-start");
  for (let index = left; index <= right; index += 1) cells.push(index);
  if (right < pageCount - 1) cells.push("gap-end");

  cells.push(pageCount);
  return cells;
}

/**
 * Pagination (components.md §6): 44x44 circles, gap 8, `surface` + 1px `line`;
 * current = `cta` fill with `on-cta` and no border; chevrons + ellipsis cell.
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  label = "Pagination",
  prevLabel = "Previous page",
  nextLabel = "Next page",
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;
  const cells = buildCells(page, pageCount, siblingCount);
  const atStart = page <= 1;
  const atEnd = page >= pageCount;

  return (
    <nav aria-label={label} className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label={prevLabel}
        aria-disabled={atStart || undefined}
        disabled={atStart}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          CELL,
          "border border-line bg-surface text-ink hover:bg-surface2 active:scale-[.97]",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
        )}
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>

      {cells.map((cell) =>
        typeof cell === "number" ? (
          <button
            key={cell}
            type="button"
            aria-current={cell === page ? "page" : undefined}
            onClick={() => onPageChange(cell)}
            className={cn(
              CELL,
              cell === page
                ? "border border-transparent bg-cta text-on-cta"
                : "border border-line bg-surface text-ink hover:bg-surface2 active:scale-[.97]",
            )}
          >
            {cell}
          </button>
        ) : (
          <span
            key={cell}
            aria-hidden="true"
            className={cn(CELL, "text-ink3")}
          >
            …
          </span>
        ),
      )}

      <button
        type="button"
        aria-label={nextLabel}
        aria-disabled={atEnd || undefined}
        disabled={atEnd}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          CELL,
          "border border-line bg-surface text-ink hover:bg-surface2 active:scale-[.97]",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
        )}
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </nav>
  );
}
