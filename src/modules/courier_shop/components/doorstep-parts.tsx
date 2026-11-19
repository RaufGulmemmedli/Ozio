'use client';

/**
 * "Qapıda sınaq" parts (`qapida-sinaq-sessiya.html`, `-tesdiq-modali`, `-netice`).
 *
 * The timer hero reads `session.expiresAt` — the mock owns the deadline, the component only reads
 * the clock. When it elapses the hero settles on `00:00` and swaps its line for "Vaxt bitdi —
 * seçimini təsdiqlə"; nothing is auto-charged, because nothing is ever charged here.
 *
 * The keep / return choice per item is a real `<fieldset>` + `<legend>` radio group (native
 * inputs, `sr-only`), so each pair is one tab stop with arrow-key movement.
 */
import { useId, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Button, Modal } from '@/shared/ui';
import { CircleCheck, Shirt } from '@/shared/lucide';

import { pick, type FitResult, type FitSession } from '../data/models';
import type { DoorstepClock } from '../hooks/use-courier-fit';
import { ShopCard, ShopCardTitle, ShopPanel, SummaryRow } from './shop-chrome';

/** mm:ss hero with the yellow progress bar and the polite minute announcement. */
export function DoorstepTimer({ clock }: { clock: DoorstepClock }) {
  const t = useTranslations('courier_shop');

  return (
    <ShopPanel padding={40}>
      <p className="m-0 text-label font-bold text-on-block/70">{t('doorstep.waiting')}</p>
      <p className="m-0 text-[56px] font-extrabold leading-none text-on-block md:text-[80px]">
        <span aria-hidden="true">{clock.label}</span>
        <span className="sr-only">{t('doorstep.clock', { clock: clock.label })}</span>
      </p>

      <div
        className="h-2.5 w-full overflow-hidden rounded-pill bg-white/[0.12]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clock.ratio * 100)}
        aria-label={t('doorstep.progress')}
      >
        <div
          className="h-full rounded-pill bg-yellow transition-[width] duration-1000 ease-linear"
          style={{ width: `${clock.ratio * 100}%` }}
        />
      </div>

      <p className="m-0 text-label text-on-block/70">
        {clock.expired ? t('doorstep.expired') : t('doorstep.autoConfirm')}
      </p>

      {/* Announced once a minute (and on expiry), never on every tick. */}
      <p aria-live="polite" className="sr-only">
        {clock.expired
          ? t('doorstep.expired')
          : t('doorstep.minutesLeft', { count: clock.announceMinutes })}
      </p>
    </ShopPanel>
  );
}

export interface FitItemChoiceProps {
  session: FitSession;
  size: string;
  kept: boolean;
  onChange: (kept: boolean) => void;
}

/** One ordered size: tinted tile, "name · Ölçü N", and the Saxla / Qaytar radio pair. */
export function FitItemChoice({ session, size, kept, onChange }: FitItemChoiceProps) {
  const t = useTranslations('courier_shop');
  const locale = useLocale();
  const legendId = useId();
  const groupName = `doorstep-${session.id}-${size}`;
  const label = t('doorstep.item', {
    name: pick(session.product.shortName, locale),
    size,
  });

  return (
    <article className="flex w-full flex-1 flex-col gap-4 rounded-card bg-surface p-6">
      <span
        aria-hidden="true"
        className="flex h-[160px] w-full items-center justify-center rounded-lg bg-brand-soft"
      >
        <Shirt size={64} className="text-brand" />
      </span>
      <h3 className="m-0 text-body font-extrabold leading-tight text-ink">{label}</h3>

      <fieldset className="m-0 flex w-full flex-row gap-2.5 border-0 p-0">
        <legend id={legendId} className="sr-only">
          {t('doorstep.choiceLegend', { label })}
        </legend>
        {([true, false] as const).map((isKeep) => {
          const active = kept === isKeep;
          return (
            <label
              key={String(isKeep)}
              className={cn(
                'relative flex h-12 flex-1 cursor-pointer items-center justify-center rounded-pill',
                'text-body-sm font-bold transition-colors',
                'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand',
                active ? 'bg-brand text-on-cta' : 'bg-surface2 text-ink hover:bg-line',
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={groupName}
                checked={active}
                onChange={() => {
                  onChange(isKeep);
                }}
              />
              {isKeep ? t('doorstep.keep') : t('doorstep.return')}
            </label>
          );
        })}
      </fieldset>
    </article>
  );
}

export interface DoorstepConfirmPanelProps {
  keptSizes: readonly string[];
  returnedSizes: readonly string[];
  charge: number;
  submitting: boolean;
  onConfirm: () => void;
}

/** The 380 panel: kept / returned, the card line, "Təsdiqlə". */
export function DoorstepConfirmPanel({
  keptSizes,
  returnedSizes,
  charge,
  submitting,
  onConfirm,
}: DoorstepConfirmPanelProps) {
  const t = useTranslations('courier_shop');
  const { money } = useFormat();
  const titleId = useId();
  const sizeList = (sizes: readonly string[]) =>
    sizes.length === 0
      ? t('common.none')
      : sizes.map((size) => t('fit.sizes.label', { size })).join(', ');

  return (
    <ShopCard aria-labelledby={titleId}>
      <ShopCardTitle id={titleId}>{t('doorstep.panel.title')}</ShopCardTitle>
      <SummaryRow label={t('doorstep.panel.kept')} value={sizeList(keptSizes)} />
      <SummaryRow label={t('doorstep.panel.returned')} value={sizeList(returnedSizes)} />

      <p
        className={cn(
          'm-0 w-full rounded-[16px] p-4 text-body-sm font-extrabold',
          keptSizes.length === 0 ? 'bg-surface2 text-ink2' : 'bg-brand-soft text-brand',
        )}
      >
        {keptSizes.length === 0
          ? t('doorstep.panel.nothingKept')
          : t('doorstep.panel.charge', { amount: money(charge) })}
      </p>

      {keptSizes.length > 1 ? (
        <p className="m-0 text-caption text-ink2">{t('doorstep.panel.bothKept')}</p>
      ) : null}

      <Button variant="brand" size="2xl" loading={submitting} onClick={onConfirm}>
        {t('common.confirm')}
      </Button>
      <p className="m-0 text-caption text-ink3">{t('demo.noCharge')}</p>
    </ShopCard>
  );
}

export interface DoorstepConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keptSizes: readonly string[];
  returnedSizes: readonly string[];
  charge: number;
  submitting: boolean;
  onConfirm: () => void;
}

/** `qapida-sinaq-tesdiq-modali.html` — "Seçimi təsdiqləyirsən?". */
export function DoorstepConfirmModal({
  open,
  onOpenChange,
  keptSizes,
  returnedSizes,
  charge,
  submitting,
  onConfirm,
}: DoorstepConfirmModalProps) {
  const t = useTranslations('courier_shop');
  const { money } = useFormat();
  const list = (sizes: readonly string[]) =>
    sizes.map((size) => t('fit.sizes.label', { size })).join(', ');

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="m"
      title={t('doorstep.modal.title')}
      description={
        keptSizes.length === 0
          ? t('doorstep.modal.bodyNone', { returned: list(returnedSizes) })
          : t('doorstep.modal.body', {
              kept: list(keptSizes),
              returned: returnedSizes.length === 0 ? t('common.none') : list(returnedSizes),
              amount: money(charge),
            })
      }
      closeLabel={t('common.close')}
      footer={
        <>
          <Button
            variant="soft"
            size="lg"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {t('common.back')}
          </Button>
          <Button
            variant="brand"
            size="lg"
            className="flex-1"
            loading={submitting}
            onClick={onConfirm}
          >
            {t('common.confirm')}
          </Button>
        </>
      }
    >
      <p className="m-0 text-caption text-ink3">{t('demo.noCharge')}</p>
    </Modal>
  );
}

/** `qapida-sinaq-netice.html` — the settled session: what was kept and what was taken. */
export function DoorstepResult({ result, action }: { result: FitResult; action?: ReactNode }) {
  const t = useTranslations('courier_shop');
  const { money } = useFormat();
  const kept = result.keptSizes.map((size) => t('fit.sizes.label', { size })).join(', ');

  return (
    <section className="flex w-full flex-col items-center gap-3 rounded-bento bg-success-soft px-6 py-12 text-center md:p-12">
      <span
        aria-hidden="true"
        className="flex size-[88px] shrink-0 items-center justify-center rounded-lg bg-success"
      >
        <CircleCheck size={44} className="text-white" />
      </span>
      <h2 className="m-0 text-h2 font-extrabold text-ink">{t('doorstep.result.title')}</h2>
      <p className="m-0 max-w-[520px] text-body leading-6 text-ink2">
        {result.keptSizes.length === 0
          ? t('doorstep.result.bodyNone')
          : t('doorstep.result.body', { kept, amount: money(result.charged) })}
      </p>
      {result.simulated ? (
        <p className="m-0 text-caption text-ink3">{t('demo.noCharge')}</p>
      ) : null}
      {action}
    </section>
  );
}
