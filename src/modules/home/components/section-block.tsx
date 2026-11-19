'use client';

/**
 * Per-section state switch: skeleton -> error -> empty -> content.
 *
 * Every home / offers region goes through this, which is what keeps one failing endpoint from
 * blanking the page: the error variant is `<ErrorState compact>` inside the section, never a page
 * takeover. A 401 on a guest-reachable section renders the login prompt instead of an error
 * (server-side guest acceptance is unverified).
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { useFailureMessage } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { EmptyState, ErrorState } from '@/shared/states';
import type { LucideIcon } from '@/shared/lucide';

import { isLoginFailure } from '../hooks';

export interface SectionBlockProps {
  /** First load in flight → the mirror skeleton. */
  pending: boolean;
  skeleton: ReactNode;
  error?: Failure | null;
  /** Loaded, but there is nothing to show. */
  empty?: boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: ReactNode;
  onRetry?: () => void;
  retryLabel: string;
  /** Shown instead of the error when the section answered 401 for a guest. */
  loginPrompt?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionBlock({
  pending,
  skeleton,
  error,
  empty = false,
  emptyIcon,
  emptyTitle,
  emptyBody,
  emptyAction,
  onRetry,
  retryLabel,
  loginPrompt,
  children,
  className,
}: SectionBlockProps) {
  if (pending) return <>{skeleton}</>;

  if (error) {
    if (isLoginFailure(error) && loginPrompt) return <>{loginPrompt}</>;
    return (
      <SectionShell className={className}>
        <SectionError error={error} onRetry={onRetry} retryLabel={retryLabel} />
      </SectionShell>
    );
  }

  if (empty && emptyTitle) {
    return (
      <SectionShell className={className}>
        <EmptyState
          compact
          panel
          icon={emptyIcon}
          title={emptyTitle}
          body={emptyBody}
          action={emptyAction}
          titleAs="p"
        />
      </SectionShell>
    );
  }

  return <>{children}</>;
}

function SectionShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('w-full', className)}>{children}</div>;
}

/** The compact retry card used on its own where a block is not needed. */
export function SectionError({
  error,
  onRetry,
  retryLabel,
}: {
  error: Failure;
  onRetry?: () => void;
  retryLabel: string;
}) {
  const failureMessage = useFailureMessage();
  return (
    <ErrorState
      compact
      failure={error}
      message={failureMessage(error)}
      onRetry={onRetry}
      retryLabel={retryLabel}
    />
  );
}
