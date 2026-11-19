'use client';

/**
 * One inbox row: `surface` card (radius 24, padding 18, gap 14), 44 icon chip (radius 14),
 * title 15/700, body 13/400 `ink2`, relative time 12/400 `ink3` — the shape
 * `NotificationRowSkeleton` mirrors.
 *
 * Unread rows carry a brand dot; `createdAt` is a zone-less UTC timestamp, already normalised to a
 * real instant by the parser, so `relative()` can be applied directly.
 */
import { cn } from '@/core/lib/cn';
import { Bell, Gift, Package, Percent, Ticket, type LucideIcon } from '@/shared/lucide';
import { ProductImage } from '@/shared/media';

import type { NotificationItem, NotificationKind } from '../data/models';

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  order: Package,
  bonus: Gift,
  coupon: Ticket,
  lottery: Percent,
  push: Bell,
};

const KIND_TONE: Record<NotificationKind, string> = {
  order: 'bg-sky-soft text-sky',
  bonus: 'bg-success-soft text-success',
  coupon: 'bg-violet-soft text-violet',
  lottery: 'bg-yellow text-on-yellow',
  push: 'bg-brand-soft text-brand',
};

export interface NotificationRowProps {
  item: NotificationItem;
  /** Already formatted, e.g. "2 saat əvvəl". */
  timeLabel: string | null;
  unreadLabel: string;
  className?: string;
}

export function NotificationRow({ item, timeLabel, unreadLabel, className }: NotificationRowProps) {
  const Icon = KIND_ICON[item.kind];

  return (
    <article
      className={cn(
        'flex w-full flex-row items-start gap-3.5 rounded-card bg-surface p-[18px]',
        className,
      )}
    >
      {item.imageUrl ? (
        <ProductImage
          src={item.imageUrl}
          alt=""
          ratio="1/1"
          radius="inner"
          sizes="44px"
          className="size-11 shrink-0"
        />
      ) : (
        <span
          aria-hidden
          className={cn('flex size-11 shrink-0 items-center justify-center rounded-md', KIND_TONE[item.kind])}
        >
          <Icon className="size-5" />
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-row items-center gap-2">
          <h3 className="min-w-0 text-body-sm font-bold text-ink">{item.title}</h3>
          {!item.isRead ? (
            <>
              <span aria-hidden className="size-2 shrink-0 rounded-pill bg-brand" />
              <span className="sr-only">{unreadLabel}</span>
            </>
          ) : null}
        </div>
        {item.message ? <p className="text-caption text-ink2">{item.message}</p> : null}
      </div>

      {timeLabel ? (
        <time
          dateTime={item.createdAt ?? undefined}
          className="shrink-0 whitespace-nowrap text-micro text-ink3"
        >
          {timeLabel}
        </time>
      ) : null}
    </article>
  );
}
