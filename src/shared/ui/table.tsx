"use client";

import type { ReactNode } from "react";

import { cn } from "@/core/lib/cn";
import { ArrowDownUp, ChevronDown, ChevronUp } from "@/shared/lucide";

export type TableEmphasis = "id" | "default" | "amount";

const CELL_TEXT: Record<TableEmphasis, string> = {
  id: "text-[15px] font-bold text-ink",
  default: "text-[14px] font-normal text-ink2",
  amount: "text-[15px] font-bold text-ink",
};

export interface TableColumn<T> {
  key: string;
  /** Head cell copy — rendered 12/700, +1px tracking, uppercase `ink3`. */
  header: string;
  /** Row label for the stacked mobile cards. Falls back to `header`. */
  label?: string;
  render: (row: T, index: number) => ReactNode;
  width?: number | string;
  align?: "start" | "end";
  emphasis?: TableEmphasis;
  sortable?: boolean;
  /** Keep this column out of the mobile cards. */
  hideOnMobile?: boolean;
  className?: string;
}

export interface TableSort {
  key: string;
  direction: "asc" | "desc";
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** Visually hidden `<caption>` — the table's accessible name. */
  caption?: string;
  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
  onRowClick?: (row: T, index: number) => void;
  /** Below 768px: horizontal scroll, or one stacked card per row. */
  mobile?: "scroll" | "cards";
  /** Shown in place of the rows when `rows` is empty. */
  empty?: ReactNode;
  className?: string;
}

/**
 * Data table (components.md §8): container `surface`, radius 24,
 * padding 8/24; head row 48 high with a bottom 1px `line`; rows 64 high.
 * Real `<table>` with `<th scope>` and `aria-sort` when sortable.
 */
export function Table<T>({
  columns,
  rows,
  rowKey,
  caption,
  sort,
  onSortChange,
  onRowClick,
  mobile = "scroll",
  empty,
  className,
}: TableProps<T>) {
  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    const direction = sort?.key === key && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ key, direction });
  };

  const table = (
    <div
      className={cn(
        "rounded-card bg-surface px-6 py-2",
        mobile === "cards" ? "max-md:hidden" : "max-md:overflow-x-auto",
        className,
      )}
    >
      <table className="w-full border-collapse text-left">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => {
              const active = sort?.key === column.key;
              const ariaSort = column.sortable
                ? active
                  ? sort?.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
                : undefined;
              const SortIcon = !active ? ArrowDownUp : sort?.direction === "asc" ? ChevronUp : ChevronDown;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={ariaSort}
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    "h-12 whitespace-nowrap text-[12px] font-bold uppercase tracking-[1px] text-ink3",
                    column.align === "end" ? "text-right" : "text-left",
                    column.className,
                  )}
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 uppercase tracking-[1px] transition-colors duration-[var(--oz-dur-fast)] ease-out hover:text-ink2",
                        active && "text-ink2",
                      )}
                    >
                      {column.header}
                      <SortIcon size={14} aria-hidden="true" />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && empty ? (
            <tr>
              <td colSpan={columns.length} className="py-8">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                className={cn(
                  "border-b border-line last:border-b-0",
                  onRowClick &&
                    "cursor-pointer transition-colors duration-[var(--oz-dur-fast)] ease-out hover:bg-bg",
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "h-16 align-middle",
                      CELL_TEXT[column.emphasis ?? "default"],
                      column.align === "end" ? "text-right" : "text-left",
                      column.className,
                    )}
                  >
                    {column.render(row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (mobile !== "cards") return table;

  return (
    <>
      {table}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.length === 0 && empty ? (
          empty
        ) : (
          rows.map((row, index) => (
            <div
              key={rowKey(row, index)}
              onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              className={cn(
                "flex flex-col gap-2 rounded-card bg-surface p-4",
                onRowClick && "cursor-pointer active:scale-[.99]",
              )}
            >
              {columns
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <div key={column.key} className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-[12px] font-bold uppercase tracking-[1px] text-ink3">
                      {column.label ?? column.header}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 text-right",
                        CELL_TEXT[column.emphasis ?? "default"],
                      )}
                    >
                      {column.render(row, index)}
                    </span>
                  </div>
                ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}

/** Row helper for tables that need a secondary line under the main cell. */
export function TableCellStack({
  primary,
  secondary,
  className,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 flex-col", className)}>
      <span className="truncate text-[15px] font-bold text-ink">{primary}</span>
      {secondary ? (
        <span className="truncate text-[13px] font-normal text-ink2">{secondary}</span>
      ) : null}
    </span>
  );
}
