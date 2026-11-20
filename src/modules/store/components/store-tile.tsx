'use client';

/**
 * `<StoreTile>` — the store chip from the home "Mağazalar" rail (`MJAu4`) and the market store
 * picker. Measured: `surface`, radius 24, padding 18, gap 14; `<StoreLogo>` 56 radius 18,
 * name 15/700 `ink`, subtitle 13/400 `ink2`.
 *
 * With no coordinates the delivery line is hidden (the fee / window only exist for rows that
 * deliver to the requested point).
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { StoreLogo } from '@/shared/media';

import { isOpenNow, type Store } from '../data/models/store';

export interface StoreTileProps {
  store: Store;
  /** Overrides the derived delivery / category line. */
  subtitle?: string;
  /** Marks the tile as the one the catalog is currently showing. */
  selected?: boolean;
  /** Render as a button instead of a link to the store page. */
  onSelect?: () => void;
  className?: string;
}

export function StoreTile({ store, subtitle, selected = false, onSelect, className }: StoreTileProps) {
  const t = useTranslations('store');
  const { money } = useFormat();
  const open = isOpenNow(store.hours);

  const delivery =
    store.deliveryTimeMin !== null && store.deliveryTimeMax !== null
      ? t('tile.eta', { min: store.deliveryTimeMin, max: store.deliveryTimeMax })
      : null;
  const fee = store.isDeliveryFree
    ? t('tile.freeDelivery')
    : store.deliveryFee !== null
      ? money(store.deliveryFee)
      : null;

  const derived =
    [delivery, fee].filter(Boolean).join(' · ') || store.storeCategoryName || '';
  const line = subtitle ?? derived;

  const body = (
    <>
      <StoreLogo src={store.logoUrl} name={store.name} size={56} radius={18} decorative />
      {/* `w-full`, not auto: the shell is `items-start`, which stops children stretching, so
          this block sized itself to the longest word — tiles in the rail came out different
          widths and `truncate` had nothing to truncate against. */}
      <div className="flex w-full min-w-0 flex-col gap-[2px]">
        <span className="truncate text-body-sm font-bold text-ink">{store.name}</span>
        <span className="truncate text-caption font-normal text-ink2">
          {open ? line : t('header.closed')}
        </span>
      </div>
    </>
  );

  const shell = cn(
    'flex w-full min-w-0 flex-col items-start gap-[14px] rounded-card bg-surface p-[18px] text-left',
    'transition-transform duration-[var(--oz-dur-base)] ease-out hover:-translate-y-0.5 active:scale-[.99]',
    selected && 'outline outline-2 -outline-offset-2 outline-ink',
    className,
  );

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} aria-pressed={selected} className={shell}>
        {body}
      </button>
    );
  }

  return (
    <Link href={paths.store(store.id)} className={shell}>
      {body}
    </Link>
  );
}
