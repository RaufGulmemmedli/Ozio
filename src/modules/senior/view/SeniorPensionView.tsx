'use client';

/**
 * `/senior/pension` — "Pensiya günü" (`senior-pension.html`, node `Bt0fC`).
 *
 * Layout from the export: Page Header (breadcrumb "Profil / Sadə rejim") → yellow demo notice →
 * Columns (gap 32). The left column is the `brand` payday banner (radius 36) over the
 * "Əsas ərzaq səbəti" card with its six rows; the 400-wide right column is the order summary —
 * the "Hər ay təkrarla" switch, a divider, "Səbət cəmi" and the 64-high brand CTA.
 *
 * States: `senior-pension-skeleton.html` (loading), `senior-pension-error.html` (error, "Səbət
 * yüklənmədi" + retry) and `senior-pension-ordered.html` (result: a `success-soft` banner with the
 * order number, the switch reflecting auto-repeat, and the CTA replaced by a soft "Sifarişə bax").
 *
 * **Nothing is ordered and nothing is charged** — the CTA moves mock state and mints a demo order
 * number, which is exactly what the demo banner at the top says.
 *
 * TODO(address): the export draws no delivery step here — the side card is the auto-repeat switch,
 * the total and the CTA, and the result banner names the courier day instead of an address. If the
 * flow ever grows one, it belongs between the total and the CTA as
 * `import { AddressPicker, useAddresses } from '@/modules/address'` (agent M9), which has no
 * public `index.ts` yet.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { CircleCheck } from '@/shared/lucide';
import { DemoBanner, ErrorState } from '@/shared/states';
import { Breadcrumbs, Button, Switch } from '@/shared/ui';

import { BasketRow } from '../components/basket-row';
import { LinkButton } from '../components/link-button';
import { PaydayBanner } from '../components/payday-banner';
import { SeniorScreen } from '../components/senior-screen';
import { useOrderPensionBasket, usePensionPlan, useSetAutoRepeat } from '../hooks/use-senior';
import { SeniorPensionSkeleton } from './SeniorPensionSkeleton';

export function SeniorPensionView() {
  const t = useTranslations('senior');
  const tc = useTranslations('common');
  const { money, date } = useFormat();
  const failureMessage = useFailureMessage();

  const plan = usePensionPlan();
  const autoRepeat = useSetAutoRepeat();
  const order = useOrderPensionBasket();

  const header = (
    <>
      <PageHeader
        title={t('pension.title')}
        subtitle={t('pension.subtitle')}
        breadcrumbs={
          <Breadcrumbs
            label={t('breadcrumb.label')}
            items={[
              { label: t('breadcrumb.profile'), href: paths.profile },
              { label: t('breadcrumb.module'), href: paths.seniorMode },
              { label: t('pension.title') },
            ]}
          />
        }
      />
      <DemoBanner module={t('pension.title')} body={t('demo.body')} />
    </>
  );

  if (plan.isPending) {
    return (
      <SeniorScreen>
        {header}
        <SeniorPensionSkeleton />
      </SeniorScreen>
    );
  }

  if (plan.isError) {
    return (
      <SeniorScreen>
        {header}
        <ErrorState
          failure={plan.error}
          title={t('pension.error.title')}
          message={failureMessage(plan.error)}
          retryLabel={tc('retry')}
          retrying={plan.isRefetching}
          onRetry={() => plan.refetch()}
          className="min-h-[460px] justify-center rounded-xl bg-surface p-7"
        />
      </SeniorScreen>
    );
  }

  const data = plan.data;

  return (
    <SeniorScreen>
      {header}

      <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
          <PaydayBanner
            payday={data.payday}
            daysUntilPayday={data.daysUntilPayday}
            pension={data.pension}
          />

          <section
            aria-labelledby="senior-basket"
            className="flex w-full flex-col items-start rounded-xl bg-surface px-7 pb-2 pt-7"
          >
            <h2 id="senior-basket" className="mb-3 text-h4 font-bold text-ink">
              {t('pension.basket')}
            </h2>
            <ul className="flex w-full flex-col">
              {data.items.map((item) => (
                <BasketRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        </div>

        <div className="flex w-full shrink-0 flex-col items-start gap-5 lg:w-[400px]">
          {data.ordered ? (
            <div
              role="status"
              className="flex w-full flex-col items-start gap-[10px] rounded-xl bg-success-soft p-7"
            >
              <CircleCheck aria-hidden="true" size={32} className="text-success" />
              <p className="text-h3 font-extrabold text-success">{t('pension.ordered.title')}</p>
              <p className="text-body-sm text-ink">
                {t('pension.ordered.body', {
                  number: data.orderNumber ?? '',
                  date: date(data.payday, 'long'),
                })}
              </p>
            </div>
          ) : null}

          <section
            aria-labelledby="senior-order"
            className="flex w-full flex-col items-start gap-4 rounded-xl bg-surface p-7"
          >
            <h2 id="senior-order" className="sr-only">
              {t('pension.summary')}
            </h2>

            <div className="flex w-full flex-row items-center justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-body font-bold text-ink">{t('pension.autoRepeat')}</span>
                <span className="text-caption text-ink2">{t('pension.autoRepeatHint')}</span>
              </div>
              <Switch
                checked={data.autoRepeat}
                aria-label={t('pension.autoRepeat')}
                disabled={autoRepeat.isPending}
                onCheckedChange={(next) => autoRepeat.mutate(next)}
              />
            </div>

            <div className="h-px w-full bg-line" />

            <div className="flex w-full flex-row items-center justify-between gap-4">
              <span className="text-body font-semibold text-ink">{t('pension.total')}</span>
              <span className="text-h3 font-extrabold text-ink">{money(data.total)}</span>
            </div>

            {data.ordered ? (
              <LinkButton
                href={data.orderId ? paths.order(data.orderId) : paths.orders}
                variant="soft"
                size="xl"
                fullWidth
              >
                {t('pension.openOrder')}
              </LinkButton>
            ) : (
              <Button
                variant="brand"
                size="2xl"
                fullWidth
                loading={order.isPending}
                onClick={() => order.mutate()}
              >
                {t('pension.order')}
              </Button>
            )}

            <p aria-live="polite" className="text-caption text-ink3">
              {order.isError
                ? failureMessage(order.error)
                : data.ordered
                  ? t('pension.orderedNote')
                  : t('pension.demoNote')}
            </p>
          </section>
        </div>
      </div>
    </SeniorScreen>
  );
}
