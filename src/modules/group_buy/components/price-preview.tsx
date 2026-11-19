'use client';

/**
 * GB3's dark `Price Preview` card (400px, radius 36, padding 28).
 *
 * The rungs are the product's own ladder from `GET products`, sliced at the chosen target — the
 * screen never multiplies a retail price by a factor. The target rung is the highlighted yellow
 * row; the rungs below it are plain rows on the dark block.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Button, Card } from '@/shared/ui';

import type { GroupProduct } from '../data/models/group-product';

export interface PricePreviewProps {
  product: GroupProduct | null;
  target: number;
  submitting: boolean;
  onSubmit: () => void;
  /** Disabled until a product is chosen — the only validation GB3 has. */
  canSubmit: boolean;
}

export function PricePreview({
  product,
  target,
  submitting,
  onSubmit,
  canSubmit,
}: PricePreviewProps) {
  const t = useTranslations('group_buy');
  const { money } = useFormat();
  const tiers = product ? product.tiers.filter((tier) => tier.people <= target) : [];

  return (
    <Card tone="block" radius="bento" className="flex w-full flex-col gap-[18px] p-7">
      <p className="text-label font-bold text-on-block">{t('create.preview')}</p>

      {product ? (
        <p className="text-[22px] font-extrabold text-on-block">
          {t('detail.title', { title: product.title, pack: product.pack })}
        </p>
      ) : (
        <p className="text-body-sm text-on-block2">{t('create.needProduct')}</p>
      )}

      <ol className="flex flex-col gap-[10px]">
        {tiers.map((tier) => {
          const isTarget = tier.people === target;
          return (
            <li
              key={tier.people}
              aria-current={isTarget ? 'true' : undefined}
              className={cn(
                'flex min-h-[52px] flex-wrap items-center gap-3 rounded-lg px-4 py-2',
                isTarget ? 'bg-yellow text-on-yellow' : 'bg-on-block/10 text-on-block',
              )}
            >
              <span className="min-w-0 flex-1 text-body-sm font-bold">
                {t('tiers.people', { count: tier.people })}
              </span>
              <span className={cn('text-caption font-bold', !isTarget && 'text-yellow')}>
                {t('tag.discount', { percent: tier.percentOff })}
              </span>
              <span className="text-h4 font-extrabold">{money(tier.price)}</span>
            </li>
          );
        })}
      </ol>

      {product ? (
        <p className="text-caption text-on-block2">
          {t('create.previewNote', { price: money(product.retailPrice) })}
        </p>
      ) : null}

      <Button
        variant="brand"
        fullWidth
        type="submit"
        loading={submitting}
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        {t('create.submit')}
      </Button>
    </Card>
  );
}
