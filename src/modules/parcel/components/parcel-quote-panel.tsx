'use client';

/**
 * The sticky right column of `/parcel/new` (`Quote Column`: 400 wide, `block`, radius 36,
 * padding 32, gap 20).
 *
 * Four states, all drawn: **idle** (dashes, no addresses yet), **loading** (translucent bones over
 * the dark fill — `paAxF`), **ready**, **error** (inline retry).
 *
 * Every number is server/mock data; the component only formats.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { Bone, Shimmer } from '@/shared/skeleton';
import { Button } from '@/shared/ui';

import type { ParcelQuote, ParcelSpec } from '../data/models/parcel';

export interface ParcelQuotePanelProps {
  quote?: ParcelQuote;
  spec: ParcelSpec;
  state: 'idle' | 'loading' | 'ready' | 'error';
  failure?: Failure | null;
  onRetry: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  /** `false` greys the CTA out: the form still has field errors. */
  canConfirm: boolean;
}

export function ParcelQuotePanel({
  quote,
  spec,
  state,
  onRetry,
  onConfirm,
  submitting = false,
  canConfirm,
}: ParcelQuotePanelProps) {
  const t = useTranslations('parcel');
  const { money, number } = useFormat();

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 rounded-bento bg-block p-8 lg:sticky lg:top-6 lg:w-[400px]">
      <h2 className="m-0 text-h4 font-extrabold text-on-block">{t('quote.title')}</h2>

      {state === 'loading' ? (
        <Shimmer label={t('quote.title')} className="flex w-full flex-col gap-5">
          <Bone w={180} h={48} r={12} tone="white" className="opacity-[0.14]" />
          <div className="flex flex-row gap-2">
            <Bone w={84} h={30} r="pill" tone="white" className="opacity-[0.14]" />
            <Bone w={96} h={30} r="pill" tone="white" className="opacity-[0.14]" />
          </div>
          <div className="flex w-full flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex w-full flex-row items-center justify-between">
                <Bone w={[120, 150, 128, 140][i]} h={14} r="xs" tone="white" className="opacity-[0.14]" />
                <Bone w={56} h={14} r="xs" tone="white" className="opacity-[0.14]" />
              </div>
            ))}
          </div>
          <Bone w="100%" h={56} r="pill" tone="white" className="opacity-[0.14]" />
        </Shimmer>
      ) : state === 'error' ? (
        <div role="alert" className="flex w-full flex-col items-start gap-4">
          <p className="m-0 text-body-sm text-on-block/70">{t('quote.errorTitle')}</p>
          <Button variant="soft" size="lg" onClick={onRetry}>
            {t('quote.retry')}
          </Button>
        </div>
      ) : (
        <>
          <p className="m-0 flex flex-row items-baseline gap-2">
            <span className="text-h1-app font-extrabold tabular-nums text-on-block">
              {quote ? money(quote.price) : '—'}
            </span>
          </p>

          <div className="flex flex-row flex-wrap gap-2">
            <Chip>
              {quote ? t('quote.km', { km: number(quote.distanceKm, { maximumFractionDigits: 1 }) }) : '—'}
            </Chip>
            <Chip>{quote ? t('quote.eta', { minutes: quote.etaMinutes }) : '—'}</Chip>
          </div>

          <dl className="m-0 flex w-full flex-col gap-3">
            <QuoteRow label={t('quote.base')} value={quote ? money(quote.baseFee) : '—'} />
            <QuoteRow
              label={t('quote.distance', {
                km: quote ? number(quote.distanceKm, { maximumFractionDigits: 1 }) : '—',
              })}
              value={quote ? money(quote.distanceFee) : '—'}
            />
            <QuoteRow
              label={t('quote.weight', {
                kg: number(spec.weightKg, { maximumFractionDigits: 1 }),
              })}
              value={quote ? money(quote.weightFee) : '—'}
            />
            {spec.fragile ? (
              <QuoteRow label={t('quote.fragile')} value={quote ? money(quote.fragileFee) : '—'} />
            ) : null}
          </dl>

          <Button
            variant="brand"
            size="3xl"
            fullWidth
            loading={submitting}
            disabled={state !== 'ready' || !canConfirm}
            onClick={onConfirm}
          >
            {t('quote.confirm')}
          </Button>

          <p className="m-0 text-micro text-on-block/60">
            {state === 'idle' ? t('quote.idle') : t('quote.serverNote')}
          </p>
        </>
      )}
    </aside>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[30px] items-center rounded-pill bg-on-block/10 px-3 text-caption font-semibold tabular-nums text-on-block">
      {children}
    </span>
  );
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-4">
      <dt className="min-w-0 text-label text-on-block/70">{label}</dt>
      <dd className="m-0 shrink-0 text-label font-bold tabular-nums text-on-block">{value}</dd>
    </div>
  );
}
