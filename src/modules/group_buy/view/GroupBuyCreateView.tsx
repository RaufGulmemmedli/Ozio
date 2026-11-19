'use client';

/**
 * GB3 — `/group-buy/create` (`gb3-group-buy-create.html`, node `vwccR`).
 *
 * The five numbered steps of the form card (product 3×2, target chips, deadline chips, own
 * quantity, read-only address) beside the dark 400px `Qiymət önizləməsi` card.
 *
 * The targets, the deadlines, the delivery address and **every tier price** come from
 * `GET products` — the preview card slices the product's own ladder at the chosen target and
 * multiplies nothing. The only validation GB3 has is "a product is required".
 *
 * TODO(search): the brief wants the product chosen through the search from `@/modules/search`
 * (`import { ProductSearch } from '@/modules/search'`). That module has no public surface yet, so
 * the drawn 3×2 catalog grid is the picker; swapping in the search field is a one-component
 * change inside step 1.
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { useRouter } from '@/core/i18n';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, InlineNotice } from '@/shared/states';
import { CircleAlert } from '@/shared/lucide';
import { Card, Chip, QuantityStepper } from '@/shared/ui';

import { GroupBuyError } from '../components/group-state-panels';
import { PricePreview } from '../components/price-preview';
import { ProductPick } from '../components/product-pick';
import { useCreateGroupDeal, useGroupBuyCatalog } from '../hooks/use-group-buy';
import { GroupBuyCreateHeaderSkeleton, GroupBuyCreateSkeleton } from './GroupBuyCreateSkeleton';

function Step({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex w-full min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="mb-3 text-body-sm font-extrabold text-ink">
        <span aria-hidden="true">{index}. </span>
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

export function GroupBuyCreateView() {
  const t = useTranslations('group_buy');
  const router = useRouter();
  const catalog = useGroupBuyCatalog();
  const create = useCreateGroupDeal();

  const [productId, setProductId] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [hours, setHours] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  const data = catalog.data;
  // The source's own defaults: the largest target and the 24h deadline the export shows selected.
  const targets = data?.targets ?? [];
  const deadlines = data?.deadlines ?? [];
  const activeTarget = target ?? targets[targets.length - 1] ?? 0;
  const activeHours = hours ?? deadlines[Math.max(0, deadlines.length - 2)] ?? 0;

  const product = useMemo(
    () => data?.products.find((p) => p.id === productId) ?? null,
    [data?.products, productId],
  );

  const submit = () => {
    if (!product || activeTarget <= 0 || activeHours <= 0) return;
    create.mutate(
      { productId: product.id, target: activeTarget, hours: activeHours, qty },
      { onSuccess: (deal) => router.push(paths.groupBuyDeal(deal.id)) },
    );
  };

  return (
    <>
      {catalog.isPending ? (
        <GroupBuyCreateHeaderSkeleton />
      ) : (
        <PageHeader
          title={t('create.title')}
          subtitle={t('create.subtitle')}
          backHref={paths.groupBuy}
          backLabel={t('detail.breadcrumb')}
        />
      )}

      <DemoBanner module={t('demo.module')} body={t('demo.body')} />

      {catalog.isPending ? (
        <GroupBuyCreateSkeleton label={t('loading')} />
      ) : catalog.isError || !data ? (
        <GroupBuyError
          failure={catalog.error}
          onRetry={() => void catalog.refetch()}
          retrying={catalog.isRefetching}
        />
      ) : (
        <form
          className="flex flex-col gap-5 xl:flex-row xl:gap-8"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Card tone="surface" radius="xl" className="flex min-w-0 flex-1 flex-col gap-6 p-8">
            <Step index={1} label={t('create.step1')}>
              <div
                role="radiogroup"
                aria-label={t('create.productsLabel')}
                className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3"
              >
                {data.products.map((item) => (
                  <ProductPick
                    key={item.id}
                    product={item}
                    selected={item.id === productId}
                    onSelect={() => setProductId(item.id)}
                  />
                ))}
              </div>
            </Step>

            <Step index={2} label={t('create.step2')}>
              <div role="radiogroup" aria-label={t('create.targetsLabel')} className="flex flex-wrap gap-3">
                {targets.map((value) => (
                  <Chip
                    key={value}
                    role="radio"
                    aria-checked={value === activeTarget}
                    selected={value === activeTarget}
                    onClick={() => setTarget(value)}
                  >
                    {t('tiers.people', { count: value })}
                  </Chip>
                ))}
              </div>
            </Step>

            <Step index={3} label={t('create.step3')}>
              <div
                role="radiogroup"
                aria-label={t('create.deadlinesLabel')}
                className="flex flex-wrap gap-3"
              >
                {deadlines.map((value) => (
                  <Chip
                    key={value}
                    role="radio"
                    aria-checked={value === activeHours}
                    selected={value === activeHours}
                    onClick={() => setHours(value)}
                  >
                    {t('create.hours', { count: value })}
                  </Chip>
                ))}
              </div>
            </Step>

            <Step index={4} label={t('create.step4')}>
              <QuantityStepper
                value={qty}
                min={1}
                max={20}
                onChange={setQty}
                decreaseLabel={t('join.qtyDecrease')}
                increaseLabel={t('join.qtyIncrease')}
              />
            </Step>

            <Step index={5} label={t('create.step5')}>
              <p className="text-body-sm font-semibold text-ink">{data.address}</p>
            </Step>

            {create.isError ? (
              <InlineNotice tone="error" multiline icon={CircleAlert}>
                {t('create.failed')}
              </InlineNotice>
            ) : null}
          </Card>

          <div className="flex w-full flex-col gap-5 xl:w-[400px] xl:shrink-0">
            <PricePreview
              product={product}
              target={activeTarget}
              submitting={create.isPending}
              canSubmit={product !== null}
              onSubmit={submit}
            />
          </div>
        </form>
      )}
    </>
  );
}
