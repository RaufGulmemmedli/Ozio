'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import {
  CircleAlert,
  SearchX,
  ServerCrash,
  Timer,
  WifiOff,
  type LucideIcon,
} from '@/shared/lucide';

import { StateButton } from './inline-notice';

/**
 * The `FailureKind` union from `@/core/network`, accepted **structurally** so
 * `shared/states` does not depend on the network layer: a `Failure` instance
 * satisfies `FailureLike`.
 */
export type FailureKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'notFound'
  | 'server'
  | 'parse'
  | 'unknown'
  | 'rateLimited';

export type FailureLike = { kind?: FailureKind | string };

/** states-catalog.md §1.1–1.2 + architecture/05: `failure.kind` → icon. */
export const FAILURE_ICON: Partial<Record<FailureKind, LucideIcon>> = {
  network: WifiOff,
  timeout: WifiOff,
  server: ServerCrash,
  notFound: SearchX,
  rateLimited: Timer,
};

/** The icon `<ErrorState>` picks for a kind; `circle-alert` is the fallback. */
export function failureIcon(kind: string | undefined): LucideIcon {
  return FAILURE_ICON[kind as FailureKind] ?? CircleAlert;
}

export type ErrorStateProps = {
  /** The failure — only `kind` is read, for the icon. */
  failure?: FailureLike | null;
  /** Already-localized title (page variant). */
  title?: ReactNode;
  /**
   * The message to show. The caller resolves it with `useFailureMessage()`
   * from `@/core/i18n/failure-message` — this package localizes nothing.
   */
  message?: ReactNode;
  /** Request-id / timestamp line under the body (13/400), copyable by the caller. */
  meta?: ReactNode;
  /** Retry handler. An async handler drives the in-button spinner. */
  onRetry?: () => unknown;
  /** Already-localized retry label ("Yenidən cəhd et"). */
  retryLabel?: ReactNode;
  /** Controlled spinner, e.g. from `query.isRefetching`. */
  retrying?: boolean;
  /** Optional ghost/soft second action ("Əsas səhifəyə qayıt"). */
  secondaryAction?: ReactNode;
  /** Extra content under the actions (the network tips chips). */
  children?: ReactNode;
  /** Section-level variant — one failing home section must not blank the page. */
  compact?: boolean;
  /** Overrides the icon derived from `failure.kind`. */
  icon?: LucideIcon;
  className?: string;
  titleId?: string;
};

/**
 * The error block. `role="alert"`.
 *
 * - page variant: icon chip 120 (`brand-soft`/`brand`), title 32/700, body
 *   16/400 `ink2` max 480, actions row (primary retry + optional secondary).
 * - `compact`: the `surface` r24 section card with `circle-alert` 24 `brand`,
 *   15/600 text and a 40-high soft retry button (states-catalog.md §1.2).
 */
export function ErrorState({
  failure,
  title,
  message,
  meta,
  onRetry,
  retryLabel,
  retrying,
  secondaryAction,
  children,
  compact = false,
  icon,
  className,
  titleId,
}: ErrorStateProps) {
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const handleRetry = useCallback(() => {
    if (!onRetry) return;
    let result: unknown;
    try {
      result = onRetry();
    } catch {
      return;
    }
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      setBusy(true);
      void (result as Promise<unknown>)
        .catch(() => undefined)
        .finally(() => {
          if (alive.current) setBusy(false);
        });
    }
  }, [onRetry]);

  const isRetrying = retrying ?? busy;
  const Icon = icon ?? FAILURE_ICON[failure?.kind as FailureKind] ?? CircleAlert;

  if (compact) {
    return (
      <div
        role="alert"
        className={cn(
          'flex w-full flex-row items-center gap-[14px] rounded-card border border-line bg-surface p-5',
          className,
        )}
      >
        <CircleAlert aria-hidden="true" size={24} className="shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          {title ? <p className="text-body-sm font-semibold text-ink">{title}</p> : null}
          {message ? <p className="text-label text-ink2">{message}</p> : null}
        </div>
        {onRetry && retryLabel ? (
          <StateButton variant="soft" size={40} loading={isRetrying} onClick={handleRetry}>
            {retryLabel}
          </StateButton>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn('flex w-full flex-col items-center gap-5 text-center', className)}
    >
      <div
        aria-hidden="true"
        className="flex size-[120px] shrink-0 items-center justify-center rounded-pill bg-brand-soft"
      >
        <Icon size={52} className="text-brand" />
      </div>

      {title ? (
        <h2 id={titleId} tabIndex={-1} className="text-h2 font-bold text-ink outline-none">
          {title}
        </h2>
      ) : null}

      {message ? <p className="max-w-[480px] text-body text-ink2">{message}</p> : null}

      {meta ? <p className="text-caption text-ink3">{meta}</p> : null}

      {(onRetry && retryLabel) || secondaryAction ? (
        <div className="flex flex-row flex-wrap items-center justify-center gap-3">
          {onRetry && retryLabel ? (
            <StateButton variant="primary" loading={isRetrying} onClick={handleRetry}>
              {retryLabel}
            </StateButton>
          ) : null}
          {secondaryAction}
        </div>
      ) : null}

      {children}
    </div>
  );
}
