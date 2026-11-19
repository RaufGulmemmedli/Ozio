'use client';

/**
 * One row of the permissions screen (`icazeler.html` `teBtp` / `d24sJ`).
 *
 * Export: card `surface`, radius 20, padding 22, gap 16 · 52px icon tile radius 16 (`violet-soft`
 * for notifications, `sky-soft` for location) · title 18/700, description 14/400 `ink2` ·
 * granted state: the card gets a 2px `success` border and a `success-soft` pill with a 14/700
 * `success` label "İcazə verildi" · default state: a `brand` pill button 48 high "İcazə ver".
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Check, CircleAlert, type LucideIcon } from '@/shared/lucide';
import { Button } from '@/shared/ui';

import type { PermissionState } from '../hooks/use-browser-permission';

export function PermissionCard({
  icon: Icon,
  tone,
  title,
  body,
  state,
  pending,
  grantLabel,
  grantedLabel,
  deniedHint,
  onGrant,
}: {
  icon: LucideIcon;
  tone: 'violet' | 'sky';
  title: ReactNode;
  body: ReactNode;
  state: PermissionState;
  pending: boolean;
  grantLabel: string;
  grantedLabel: string;
  /** "Brauzer parametrlərindən aç" — shown when the browser has already refused. */
  deniedHint: string;
  onGrant: () => void;
}) {
  // An unsupported API hides the row entirely (states-catalog: never show a dead control).
  if (state === 'unsupported') return null;

  const granted = state === 'granted';
  const denied = state === 'denied';

  return (
    <section
      className={cn(
        'flex w-full flex-col gap-4 rounded-lg bg-surface p-[22px]',
        granted ? 'border-2 border-success' : 'border border-line',
      )}
    >
      <div className="flex w-full items-center gap-4">
        <span
          className={cn(
            'flex size-13 shrink-0 items-center justify-center rounded-md',
            tone === 'violet' ? 'bg-violet-soft' : 'bg-sky-soft',
          )}
        >
          <Icon
            aria-hidden="true"
            className={cn('size-6', tone === 'violet' ? 'text-violet' : 'text-sky')}
          />
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <h2 className="text-body-l font-bold text-ink">{title}</h2>
          <p className="text-label font-normal leading-5 text-ink2">{body}</p>
        </div>
      </div>

      {granted ? (
        <p className="flex h-9 w-fit items-center gap-2 rounded-pill bg-success-soft px-[14px] text-label font-bold text-success">
          <Check aria-hidden="true" className="size-4 shrink-0" />
          {grantedLabel}
        </p>
      ) : denied ? (
        <p role="status" className="flex w-full items-start gap-2 text-label font-normal leading-5 text-ink2">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink3" />
          {deniedHint}
        </p>
      ) : (
        <Button
          type="button"
          variant="brand"
          size="lg"
          fullWidth
          loading={pending}
          onClick={onGrant}
        >
          {grantLabel}
        </Button>
      )}
    </section>
  );
}
