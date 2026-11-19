'use client';

import type { ReactNode } from 'react';

import { useOnline } from '@/core/lib/use-online';
import { cn } from '@/core/lib/cn';
import { WifiOff } from '@/shared/lucide';

import { InlineNotice, type InlineNoticeTone } from './inline-notice';

export type OfflineBannerProps = {
  /**
   * Already-localized bar copy — "İnternet bağlantısı yoxdur. Son yadda
   * saxlanan məlumat göstərilir." (states-catalog.md §1.1).
   */
  message: ReactNode;
  /** Already-localized action label ("Yenilə"). Omit to hide the action. */
  actionLabel?: ReactNode;
  onRetry?: () => void;
  /**
   * Controlled override for the debug `?preview=offline` state. `undefined`
   * (default) → driven by `useOnline()`.
   */
  offline?: boolean;
  /** `warning` = the yellow bar from the export (default); `error` = brand-soft. */
  tone?: Extract<InlineNoticeTone, 'warning' | 'error'>;
  className?: string;
};

/**
 * Sticky bar at the top of the shell content. Shown while the browser is
 * offline; it **auto-hides on `online`** and never replaces the page — cached
 * data stays visible underneath (architecture/05, states-catalog.md §1.1).
 */
export function OfflineBanner({
  message,
  actionLabel,
  onRetry,
  offline,
  tone = 'warning',
  className,
}: OfflineBannerProps) {
  const online = useOnline();
  const visible = offline ?? !online;

  if (!visible) return null;

  return (
    <InlineNotice
      tone={tone}
      icon={WifiOff}
      body={message}
      actionLabel={actionLabel}
      onAction={onRetry}
      role="status"
      className={cn('sticky top-0 z-30 h-[52px]', className)}
    />
  );
}
