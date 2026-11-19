'use client';

/**
 * The `/parcel` hero row (`G9SN92` → `baglama-esas.html`):
 * a dark `block` hero (radius 36, padding 40, gap 24) with the headline, the four step pills and
 * the CTA, beside the 400-wide yellow rules card (radius 36, padding 32, gap 16).
 *
 * The rules card prints server data (`ParcelRules`) — nothing here computes a fee.
 * Both blocks are static chrome, so they stay real in the loading state.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Button } from '@/shared/ui';

import type { ParcelRules } from '../data/models/parcel';

const STEPS = ['hero.step1', 'hero.step2', 'hero.step3', 'hero.step4'] as const;

export function ParcelHeroRow({ rules }: { rules?: ParcelRules }) {
  const t = useTranslations('parcel');
  const { money } = useFormat();

  return (
    <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6 rounded-bento bg-block p-7 md:p-10">
        <h2 className="m-0 max-w-[520px] text-h3 font-extrabold leading-[1.2] tracking-[-0.02em] text-on-block md:text-h2">
          {t('hero.headline')}
        </h2>
        <p className="m-0 max-w-[560px] text-body-sm text-on-block/70">{t('hero.lead')}</p>

        <ol className="m-0 flex list-none flex-row flex-wrap gap-3 p-0">
          {STEPS.map((key, index) => (
            <li
              key={key}
              className="flex h-10 flex-row items-center gap-2.5 rounded-pill bg-on-block/10 pl-1.5 pr-4"
            >
              <span className="grid size-7 place-items-center rounded-pill bg-on-block/15 text-caption font-bold text-on-block">
                {index + 1}
              </span>
              <span className="text-label font-semibold text-on-block">{t(key)}</span>
            </li>
          ))}
        </ol>

        <Button as="a" href={paths.parcelNew} variant="brand" size="3xl" className="w-fit">
          {t('hero.send')}
        </Button>
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-4 rounded-bento bg-yellow p-8 lg:w-[400px]">
        <h3 className="m-0 text-h4 font-extrabold text-on-yellow">{t('rules.title')}</h3>
        <p className="m-0 text-h3 font-extrabold tabular-nums text-on-yellow">
          {rules ? t('rules.fromPrice', { price: money(rules.fromPrice) }) : '—'}
        </p>
        <dl className="m-0 flex w-full flex-col">
          <RuleRow
            label={t('rules.maxWeight')}
            value={rules ? `${rules.maxWeightKg} kq` : '—'}
          />
          <RuleRow
            label={t('rules.maxSide')}
            value={rules ? t('rules.cm', { value: rules.maxSideCm }) : '—'}
          />
          <RuleRow label={t('rules.payment')} value={t('rules.paymentMethods')} />
          <RuleRow
            label={t('rules.fragile')}
            value={rules ? t('rules.fragileFee', { amount: money(rules.fragileFee) }) : '—'}
          />
        </dl>
      </aside>
    </div>
  );
}

/** One rule row: 1px top hairline at 12 % ink, 10px top padding (measured). */
function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-4 border-t border-on-yellow/12 pt-2.5 first:border-t-0 first:pt-0">
      <dt className="text-label font-medium text-on-yellow/70">{label}</dt>
      <dd className="m-0 text-label font-bold tabular-nums text-on-yellow">{value}</dd>
    </div>
  );
}
