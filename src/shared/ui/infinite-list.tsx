"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/core/lib/cn";
import { CircleAlert, Loader } from "@/shared/lucide";

export interface InfiniteListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemKey?: (item: T, index: number) => string;
  /** TanStack `useInfiniteQuery` flags map 1:1 onto these. */
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  /** First page still loading — renders `renderSkeleton()` instead of items. */
  isPending?: boolean;
  renderSkeleton?: () => ReactNode;
  /** Shown when the first page came back empty. */
  empty?: ReactNode;
  /** Anything truthy switches the footer to the retry row. */
  error?: unknown;
  onRetry?: () => void;
  /** Error row copy (pass a translated string). */
  errorMessage?: string;
  retryLabel?: string;
  /** Visually hidden status text for the footer spinner. */
  loadingLabel?: string;
  /** Rendered once every page is in. */
  endMessage?: ReactNode;
  className?: string;
  /** Sentinel pre-fetch distance. Default "320px". */
  rootMargin?: string;
  as?: "div" | "ul";
}

/**
 * IntersectionObserver-driven list: sentinel + pagination footer spinner (one
 * of the three places a spinner is allowed), a `renderSkeleton` slot for the
 * first page and an error row with retry.
 */
export function InfiniteList<T>({
  items,
  renderItem,
  itemKey,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  isPending = false,
  renderSkeleton,
  empty,
  error,
  onRetry,
  errorMessage,
  retryLabel,
  loadingLabel,
  endMessage,
  className,
  rootMargin = "320px",
  as = "div",
}: InfiniteListProps<T>) {
  const sentinel = useRef<HTMLDivElement | null>(null);
  const fetchRef = useRef(fetchNextPage);

  useEffect(() => {
    fetchRef.current = fetchNextPage;
  }, [fetchNextPage]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage || isFetchingNextPage || error) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) fetchRef.current?.();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, error, rootMargin, items.length]);

  if (isPending) {
    return <div className={className}>{renderSkeleton?.()}</div>;
  }

  if (items.length === 0 && !error) {
    return <div className={className}>{empty}</div>;
  }

  const List = as;

  return (
    <div className="flex flex-col">
      <List className={cn(as === "ul" && "list-none p-0", className)}>
        {items.map((item, index) => {
          const key = itemKey ? itemKey(item, index) : String(index);
          return as === "ul" ? (
            <li key={key}>{renderItem(item, index)}</li>
          ) : (
            <div key={key} className="contents">
              {renderItem(item, index)}
            </div>
          );
        })}
      </List>

      {error ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 py-6 text-center md:flex-row md:justify-center"
        >
          <span className="flex items-center gap-2 text-[14px] font-medium text-ink2">
            <CircleAlert size={18} aria-hidden="true" className="text-brand" />
            {errorMessage}
          </span>
          {onRetry && retryLabel ? (
            <button
              type="button"
              onClick={onRetry}
              className="flex h-11 items-center rounded-pill bg-surface2 px-5 text-[14px] font-semibold text-ink transition-[background-color,transform] duration-[var(--oz-dur-fast)] ease-out hover:bg-line active:scale-[.97]"
            >
              {retryLabel}
            </button>
          ) : null}
        </div>
      ) : isFetchingNextPage ? (
        <div className="flex items-center justify-center py-6 text-ink3">
          <Loader size={24} aria-hidden="true" className="oz-spinner" />
          {loadingLabel ? (
            <span role="status" className="sr-only">
              {loadingLabel}
            </span>
          ) : null}
        </div>
      ) : hasNextPage ? (
        <div ref={sentinel} aria-hidden="true" className="h-1 w-full" />
      ) : (
        endMessage ?? null
      )}
    </div>
  );
}
