'use client';

/**
 * GB1's 360px right rail: the dark `Create CTA Block` (radius 36, padding 28, yellow pill) and the
 * `How it works` card (radius 28, padding 24, three numbered rows).
 *
 * The three steps are an ordered list, not `<Stepper>`: `<Stepper>` is the order-tracker widget
 * (48px circles joined by rails) and does not match what is drawn here.
 */
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { Plus } from '@/shared/lucide';
import { Button, Card } from '@/shared/ui';

import { useHref } from '../lib/use-href';

export function CreateCtaBlock() {
  const t = useTranslations('group_buy');
  const href = useHref();

  return (
    <Card tone="block" radius="bento" className="flex flex-col gap-4 p-7">
      <p className="text-[26px] font-extrabold leading-tight text-on-block">{t('rail.title')}</p>
      <p className="text-body-sm text-on-block2">{t('rail.body')}</p>
      <Button
        as="a"
        href={href(paths.groupBuyCreate)}
        variant="white"
        fullWidth
        className="bg-yellow text-on-yellow"
        leadingIcon={<Plus size={20} aria-hidden="true" />}
      >
        {t('create.cta')}
      </Button>
    </Card>
  );
}

export function HowItWorks() {
  const t = useTranslations('group_buy');
  const steps = [t('how.step1'), t('how.step2'), t('how.step3')];

  return (
    <Card tone="surface" radius="xl" className="flex flex-col gap-[18px] p-6">
      <h2 className="text-body-l font-extrabold text-ink">{t('how.title')}</h2>
      <ol className="flex flex-col gap-[14px]">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span aria-hidden="true" className="text-label font-extrabold text-brand">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 text-label font-semibold text-ink2">{step}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
