'use client';

/**
 * `Delivery Steps` (`TWInN` / `Lig3w`): the four hand-off stages.
 *
 * Marked up as an ordered list, with `aria-current="step"` on the stage the courier is on
 * (architecture/07 §Accessibility). Markers follow the export: done = `success-soft` circle 36 +
 * check, current = `brand` circle + bike, to-do = `surface2` circle + circle glyph.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Bike, Check, Circle } from '@/shared/lucide';

import { CP_LAST_STEP, type CpDelivery, type CpStep } from '../data/models/courier-plus';

import { CpCard, CpCardTitle } from './CpPrimitives';

const STEPS: readonly CpStep[] = [0, 1, 2, 3];

export interface CpDeliveryStepsProps {
  delivery: CpDelivery;
  titleId?: string;
}

export function CpDeliverySteps({ delivery, titleId = 'cp-steps' }: CpDeliveryStepsProps) {
  const t = useTranslations('courier_plus');
  const { offer, step } = delivery;

  /** The drawn second line per stage: the address for 0 / 2, fixed copy for 1 / 3. */
  const detailFor = (index: CpStep): string => {
    if (index === 0) return offer.pickup;
    if (index === 1) return t('track.step1.body');
    if (index === 2) return offer.dropoff;
    return t('track.step3.body');
  };

  return (
    <CpCard aria-labelledby={titleId}>
      <CpCardTitle id={titleId}>{t('track.steps')}</CpCardTitle>

      <ol className="m-0 flex w-full list-none flex-col gap-4 p-0">
        {STEPS.map((index) => {
          const done = step > index || (index === CP_LAST_STEP && step >= CP_LAST_STEP);
          const current = step === index && step < CP_LAST_STEP;
          return (
            <li
              key={index}
              aria-current={current ? 'step' : undefined}
              className="flex w-full flex-row items-center gap-4"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-pill',
                  done
                    ? 'bg-success-soft text-success'
                    : current
                      ? 'bg-brand text-on-cta'
                      : 'bg-surface2 text-ink3',
                )}
              >
                {done ? <Check size={18} /> : current ? <Bike size={18} /> : <Circle size={18} />}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span
                  className={cn(
                    'text-body-sm',
                    done || current ? 'font-bold text-ink' : 'font-medium text-ink3',
                  )}
                >
                  {t(`track.step${index}.title`)}
                </span>
                <span className="truncate text-caption font-normal text-ink3">
                  {detailFor(index)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </CpCard>
  );
}
