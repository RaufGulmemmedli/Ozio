'use client';

/**
 * Detail tabs (`F4SIf`): Təsvir / Qida dəyəri / Məlumat, gap 32, 1 px `line` rule with the 3 px
 * brand indicator, body 16/400/24 beside the 420-wide `surface` r24 spec table (`Nutrition`).
 *
 * The API carries no nutrition fields (recorded as a design defect in `screens/app-catalog.md`),
 * so that tab states plainly that the information is not provided instead of inventing numbers.
 * "Məlumat" is built from what the payload really has: brand, pack size, unit, category, barcode,
 * product code and the `is_organic` / `is_halal` / `is_vegan` flags.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';

import { packLabel, type ProductDetail } from '../data/models/product-detail';

export interface ProductTabsProps {
  product: ProductDetail;
  className?: string;
}

export function ProductTabs({ product, className }: ProductTabsProps) {
  const t = useTranslations('product');

  const flags = [
    product.flags.organic ? t('info.organic') : null,
    product.flags.halal ? t('info.halal') : null,
    product.flags.vegan ? t('info.vegan') : null,
  ].filter((v): v is string => v !== null);

  const rows: Array<{ label: string; value: string }> = [
    { label: t('info.brand'), value: product.brand },
    { label: t('info.pack'), value: packLabel(product) },
    { label: t('info.category'), value: product.categoryName },
    { label: t('info.store'), value: product.store?.name ?? '' },
    { label: t('info.barcode'), value: product.barcodes[0] ?? '' },
    { label: t('info.code'), value: product.materialCode },
    { label: t('info.flags'), value: flags.join(' · ') },
  ].filter((row) => row.value.length > 0);

  return (
    <section className={cn('flex w-full flex-col gap-6', className)}>
      <Tabs defaultValue="description">
        <TabsList label={t('tabs.label')}>
          <TabsTrigger value="description">{t('tabs.description')}</TabsTrigger>
          <TabsTrigger value="nutrition">{t('tabs.nutrition')}</TabsTrigger>
          <TabsTrigger value="info">{t('tabs.info')}</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="pt-6">
          <p className="m-0 max-w-[640px] text-body leading-6 text-ink">
            {product.description.trim() || t('description.empty')}
          </p>
        </TabsContent>

        <TabsContent value="nutrition" className="pt-6">
          <p className="m-0 text-body text-ink2">{t('nutrition.empty')}</p>
        </TabsContent>

        <TabsContent value="info" className="pt-6">
          {rows.length === 0 ? (
            <p className="m-0 text-body text-ink2">{t('info.empty')}</p>
          ) : (
            <dl className="flex w-full max-w-[420px] flex-col rounded-card bg-surface px-6 py-2">
              {rows.map((row, index) => (
                <div
                  key={row.label}
                  className={cn(
                    'flex flex-row items-start justify-between gap-5 py-3.5',
                    index < rows.length - 1 && 'border-b border-line',
                  )}
                >
                  <dt className="text-body-sm text-ink2">{row.label}</dt>
                  <dd className="m-0 text-end text-body-sm font-bold text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
