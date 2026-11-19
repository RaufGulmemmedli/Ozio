'use client';

/**
 * PL2's `Lock Card · …` (radius 28, padding 24, gap 16) in all three drawn variants:
 *
 * | export node                                       | status    | tag                        | button |
 * | `Lock Card · Günəbaxan yağı 1 L` / `Ağ düyü 1 kq` | `active`  | brand-soft "11 gün"        | `İstifadə et` |
 * | `Lock Card · Tam südlü pendir 400 q`              | `used`    | success "İstifadə edildi"  | none   |
 * | `Lock Card · Makaron 500 q`                       | `expired` | neutral "Bitib"            | none   |
 *
 * `daysLeft` and `savings` are the source's numbers. Using a lock is **mock state only**: the row
 * becomes `used` and no cart row is written, which the toast says out loud.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { ProductImage } from '@/shared/media';
import { Badge, Button, Card } from '@/shared/ui';

import type { PriceLockItem } from '../data/models/price-lock-item';

export interface LockCardProps {
  lock: PriceLockItem;
  /** Only passed for the active tab. */
  onUse?: (id: string) => void;
  using?: boolean;
}

export function LockCard({ lock, onUse, using = false }: LockCardProps) {
  const t = useTranslations('price_lock');
  const { money } = useFormat();

  const subtitle =
    lock.status === 'active'
      ? t('card.daysLeft', { days: lock.daysLeft })
      : lock.status === 'used'
        ? t('card.usedSub')
        : t('card.expiredSub');

  return (
    <Card
      as="article"
      tone="surface"
      radius="xl"
      className="flex flex-col items-start gap-4 p-6"
      aria-labelledby={`pl-lock-${lock.id}`}
    >
      <div className="flex w-full items-center gap-[14px]">
        <span className="w-14 shrink-0">
          <ProductImage src={null} alt="" ratio="1/1" radius="inner" fallbackIconSize={24} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 id={`pl-lock-${lock.id}`} className="truncate text-body-l font-bold text-ink">
            {lock.productName}
          </h3>
          <p className="text-caption font-semibold text-ink3">{subtitle}</p>
        </div>
        {lock.status === 'active' ? (
          <Badge className="bg-brand-soft text-brand">
            {t('card.daysTag', { days: lock.daysLeft })}
          </Badge>
        ) : lock.status === 'used' ? (
          <Badge tone="success">{t('card.used')}</Badge>
        ) : (
          <Badge tone="neutral">{t('card.expiredTag')}</Badge>
        )}
      </div>

      <div className="flex w-full flex-wrap items-end gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1">
          <span className="text-micro text-ink3">{t('card.locked')}</span>
          <span className="text-[30px] font-extrabold leading-none text-ink">
            {money(lock.lockedPrice)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-micro text-ink3">{t('card.market')}</span>
          <span className="text-h4 font-bold leading-none text-ink2">
            {money(lock.currentPrice)}
          </span>
        </div>
        {lock.savings > 0 ? (
          <Badge tone="success">{t('card.savings', { amount: money(lock.savings) })}</Badge>
        ) : null}
      </div>

      <p className="text-label text-ink2">{t('card.deposit', { amount: money(lock.deposit) })}</p>

      {lock.status === 'active' && onUse ? (
        <Button variant="primary" size="md" loading={using} onClick={() => onUse(lock.id)}>
          {t('card.use')}
        </Button>
      ) : null}
    </Card>
  );
}
