'use client';

/**
 * The product-page entry point: the "Qiyməti dondur" text button described in
 * `api/mock-modules.md` §14 ("Entries: product page text button; Profile 'Daha çox' rows").
 *
 * Exported from `@/modules/price_lock` so the product module never reaches inside this one:
 *
 * ```tsx
 * import { FreezePriceEntry } from '@/modules/price_lock';
 * <FreezePriceEntry productName={product.name} price={product.price} />
 * ```
 *
 * It owns its dialog and reads `lockDays` / `deposit` from `GET locks`, so the host screen passes
 * only the product. It renders nothing when the `priceLock` flag is off.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Snowflake } from '@/shared/lucide';
import { Button } from '@/shared/ui';

import { EMPTY_LOCK_LIST } from '../data/models/price-lock-item';
import { usePriceLocks } from '../hooks/use-price-lock';
import { priceLockEnabled } from '../price_lock.flags';
import { FreezePriceDialog } from './freeze-price-dialog';

export interface FreezePriceEntryProps {
  productName: string;
  price: number;
  /** `ghost` matches the product page's text-button row; `soft` suits a card footer. */
  variant?: 'ghost' | 'soft';
  className?: string;
}

export function FreezePriceEntry({
  productName,
  price,
  variant = 'ghost',
  className,
}: FreezePriceEntryProps) {
  const t = useTranslations('price_lock');
  const { money } = useFormat();
  const [open, setOpen] = useState(false);
  const locks = usePriceLocks();

  if (!priceLockEnabled()) return null;

  const terms = locks.data ?? EMPTY_LOCK_LIST;

  return (
    <>
      <Button
        variant={variant}
        size="md"
        className={className}
        leadingIcon={<Snowflake size={18} aria-hidden="true" />}
        onClick={() => setOpen(true)}
      >
        <span className="flex flex-col items-start">
          <span>{t('entry.freeze')}</span>
          <span className="text-micro font-normal opacity-70">
            {t('entry.freezeHint', { days: terms.lockDays, deposit: money(terms.deposit) })}
          </span>
        </span>
      </Button>

      <FreezePriceDialog
        open={open}
        onOpenChange={setOpen}
        productName={productName}
        price={price}
        lockDays={terms.lockDays}
        deposit={terms.deposit}
      />
    </>
  );
}
