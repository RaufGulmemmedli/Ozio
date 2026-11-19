'use client';

/**
 * "Çatdırılma mərhələləri" (`Status Timeline` in `baglama-izleme.html`).
 *
 * A real `<ol>` with `aria-current="step"` on the live step (a11y contract): done = `success-soft`
 * check, current = `brand` circle with the bike glyph, todo = `surface2`. The times come from
 * `createdAt / assignedAt / pickedUpAt / deliveredAt`; a step with no time yet prints "—".
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Bike, Check, Circle } from '@/shared/lucide';

import { parcelStep, type Parcel } from '../data/models/parcel';

export function ParcelTimeline({ parcel }: { parcel: Parcel }) {
  const t = useTranslations('parcel');
  const { date } = useFormat();
  const current = parcel.status === 'delivered' ? 3 : parcelStep(parcel.status);

  const steps = [
    { key: 'track.step1', at: parcel.createdAt },
    { key: 'track.step2', at: parcel.assignedAt },
    { key: 'track.step3', at: parcel.pickedUpAt },
    { key: 'track.step4', at: parcel.deliveredAt },
  ] as const;

  return (
    <ol
      aria-label={t('track.timeline')}
      className="m-0 flex w-full list-none flex-col gap-0 p-0"
    >
      {steps.map((step, index) => {
        const done = index < current || (index === 3 && parcel.status === 'delivered');
        const live = index === current && parcel.status !== 'delivered';
        const Icon = done ? Check : live ? Bike : Circle;
        const last = index === steps.length - 1;

        return (
          <li
            key={step.key}
            aria-current={live ? 'step' : undefined}
            className="flex w-full flex-row items-stretch gap-4"
          >
            <span className="flex shrink-0 flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-10 place-items-center rounded-pill',
                  done
                    ? 'bg-success-soft text-success'
                    : live
                      ? 'bg-brand text-white'
                      : 'bg-surface2 text-ink3',
                )}
              >
                <Icon size={18} />
              </span>
              {!last ? (
                <span
                  aria-hidden="true"
                  className={cn('w-0.5 flex-1 rounded-pill', done ? 'bg-success' : 'bg-line')}
                />
              ) : null}
            </span>

            <span className={cn('flex min-w-0 flex-1 flex-row items-center justify-between gap-4', last ? 'pb-0' : 'pb-5')}>
              <span className={cn('text-label text-ink', (done || live) && 'font-bold')}>
                {t(step.key)}
              </span>
              <span className="shrink-0 text-caption tabular-nums text-ink3">
                {step.at ? date(step.at, 'time') : t('track.pending')}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
