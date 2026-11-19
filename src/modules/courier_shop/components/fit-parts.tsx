'use client';

/**
 * "Geyin, seç, qaytar" parts (`geyin-sec-qaytar-olculer.html`): the product card with its size
 * group, the "Necə işləyir" explainer and the dark order summary.
 *
 * The size picker is a real `<fieldset>` + `<legend>` with native checkboxes (`sr-only peer`), so
 * it is a labelled group that arrow keys, the screen reader and the focus ring all understand —
 * the drawn 52-high chips are the label styling on top.
 *
 * `// TODO(store):` the product card would reuse `<ProductCard>` / `<ProductImage>` from
 * `@/modules/store` (agent M3) — `import { ProductCard } from '@/modules/store'`. The module does
 * not exist yet, and the fixture carries no image URL (the export draws a tinted icon tile), so
 * `<ProductImage>` would render only its placeholder.
 */
import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Button } from '@/shared/ui';
import { ArrowLeft, Package, Shirt, Timer } from '@/shared/lucide';

import { pick, type FitProduct } from '../data/models';
import { ShopCard, ShopCardTitle, ShopPanel, SummaryRow } from './shop-chrome';

export interface SizePickerProps {
  product: FitProduct;
  selected: readonly string[];
  onToggle: (size: string) => void;
}

/** The product card: 300 tinted tile, brand, name, price, the size group and the counter. */
export function FitProductCard({ product, selected, onToggle }: SizePickerProps) {
  const t = useTranslations('courier_shop');
  const locale = useLocale();
  const { money } = useFormat();
  const legendId = useId();
  const full = selected.length >= product.requiredSizes;

  return (
    <ShopCard className="gap-6 md:flex-row">
      <span
        aria-hidden="true"
        className="flex h-[220px] w-full shrink-0 items-center justify-center rounded-lg bg-brand-soft md:size-[300px]"
      >
        <Shirt size={96} className="text-brand" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="m-0 text-caption font-bold uppercase tracking-[0.08em] text-ink3">
          {product.brand}
        </p>
        <h2 className="m-0 text-h4 font-extrabold leading-tight text-ink">
          {pick(product.name, locale)}
        </h2>
        <p className="m-0 text-h4 font-extrabold text-ink">{money(product.price)}</p>

        <fieldset className="m-0 flex w-full flex-col gap-3 border-0 p-0">
          <legend id={legendId} className="mb-1 p-0 text-label font-semibold text-ink2">
            {t('fit.sizes.legend', { count: product.requiredSizes })}
          </legend>
          <div className="flex w-full flex-row flex-wrap gap-2">
            {product.sizes.map((size) => {
              const checked = selected.includes(size);
              // A size that is not picked yet cannot be picked once the group is full.
              const locked = !checked && full;
              return (
                <label
                  key={size}
                  className={cn(
                    'relative flex h-13 min-w-[56px] flex-1 cursor-pointer items-center justify-center rounded-[16px]',
                    'text-body-sm font-bold transition-colors',
                    'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand',
                    checked ? 'bg-cta text-on-cta' : 'bg-surface2 text-ink hover:bg-line',
                    locked && 'cursor-not-allowed opacity-40',
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    disabled={locked}
                    onChange={() => {
                      onToggle(size);
                    }}
                  />
                  {t('fit.sizes.option', { size })}
                </label>
              );
            })}
          </div>
          <p className="m-0 text-caption font-semibold text-ink2" aria-live="polite">
            {t('fit.sizes.counter', {
              selected: selected.length,
              total: product.requiredSizes,
            })}
          </p>
        </fieldset>
      </div>
    </ShopCard>
  );
}

const STEP_ICONS = [Package, Timer, ArrowLeft] as const;

/** "Necə işləyir" — three rows, 44 brand-soft chip + one line each. */
export function FitExplainer({ waitMinutes }: { waitMinutes: number }) {
  const t = useTranslations('courier_shop');
  const titleId = useId();

  return (
    <ShopCard aria-labelledby={titleId}>
      <ShopCardTitle id={titleId}>{t('fit.how.title')}</ShopCardTitle>
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {([1, 2, 3] as const).map((step, index) => {
          const Icon = STEP_ICONS[index]!;
          return (
            <li key={step} className="flex flex-row items-center gap-4">
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-soft"
              >
                <Icon size={20} className="text-brand" />
              </span>
              <span className="min-w-0 text-body-sm text-ink">
                {t(`fit.how.step${step}`, { minutes: waitMinutes })}
              </span>
            </li>
          );
        })}
      </ol>
    </ShopCard>
  );
}

export interface FitOrderSummaryProps {
  product: FitProduct;
  selected: readonly string[];
  submitting: boolean;
  onOrder: () => void;
}

/** The dark 380 panel: picked sizes, pair price, free delivery, what is taken now (0), the CTA. */
export function FitOrderSummary({ product, selected, submitting, onOrder }: FitOrderSummaryProps) {
  const t = useTranslations('courier_shop');
  const { money } = useFormat();
  const ready = selected.length === product.requiredSizes;

  return (
    <ShopPanel>
      <p className="m-0 text-label font-bold text-on-block/70">{t('fit.summary.title')}</p>
      <p className="m-0 text-[20px] font-extrabold leading-tight text-on-block">
        {ready
          ? selected.map((size) => t('fit.sizes.label', { size })).join(' + ')
          : t('fit.summary.placeholder', { count: product.requiredSizes })}
      </p>
      <SummaryRow
        onBlock
        divider
        label={t('fit.summary.price')}
        value={money(product.price)}
      />
      <SummaryRow onBlock divider label={t('fit.summary.delivery')} value={t('common.free')} />
      <SummaryRow
        onBlock
        divider
        label={t('fit.summary.chargeNow')}
        value={money(product.chargeNow)}
      />
      <Button
        variant="brand"
        size="2xl"
        disabled={!ready}
        loading={submitting}
        onClick={onOrder}
        leadingIcon={<Package size={18} aria-hidden="true" />}
      >
        {t('fit.summary.cta', { count: product.requiredSizes })}
      </Button>
      <p className="m-0 text-caption text-on-block/70">{t('demo.noCharge')}</p>
    </ShopPanel>
  );
}
