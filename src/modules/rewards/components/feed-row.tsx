'use client';

/**
 * `Notification Row` from `price-alerts.html`: a 44px tinted chip, title + body, the server's own
 * time string on the right and the unread dot.
 *
 * `time` is rendered literally — the fixture sends "10:05" / "Dünən" / "B.e" the way the API would,
 * and `api/README.md` says a Baku wall-clock string is never re-formatted.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { ArrowDownLeft, Gift, Package, Ticket, Wallet, type LucideIcon } from '@/shared/lucide';

import type { FeedKind, FeedNotification } from '../data/models/price-alert';

const CHIP: Record<FeedKind, { tint: string; icon: LucideIcon }> = {
  priceDrop: { tint: 'bg-success-soft text-success', icon: ArrowDownLeft },
  lottery: { tint: 'bg-violet-soft text-violet', icon: Ticket },
  bonus: { tint: 'bg-yellow text-on-yellow', icon: Wallet },
  order: { tint: 'bg-sky-soft text-sky', icon: Package },
  birthday: { tint: 'bg-brand-soft text-brand', icon: Gift },
};

export function FeedRow({ item }: { item: FeedNotification }) {
  const t = useTranslations('rewards');
  const chip = CHIP[item.kind];
  const Icon = chip.icon;

  return (
    <li className="flex min-h-[76px] flex-row items-center gap-3 py-2">
      <span
        aria-hidden="true"
        className={cn('flex size-11 shrink-0 items-center justify-center rounded-pill', chip.tint)}
      >
        <Icon size={20} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <p className="text-label font-bold text-ink">{item.title}</p>
        <p className="text-caption text-ink2">{item.body}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-micro text-ink3">{item.time}</span>
        {item.unread ? (
          <span className="size-2 rounded-pill bg-brand">
            <span className="sr-only">{t('priceAlerts.feed.unread')}</span>
          </span>
        ) : null}
      </div>
    </li>
  );
}
