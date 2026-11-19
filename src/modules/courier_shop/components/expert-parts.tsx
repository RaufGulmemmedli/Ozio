'use client';

/**
 * "Kuryer-Ekspert" parts (`kuryer-ekspert-xidmet-secimi.html`, `-rezerv-tesdiqi.html`).
 *
 * Product, service and slot are three single-select groups, each a real `<fieldset>` + `<legend>`
 * with native radios (`sr-only`) behind the drawn tiles, chips and pills.
 *
 * The summary shows the selected service's own `price` and `minutes` — nothing is added up.
 */
import { useId, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Badge, Button } from '@/shared/ui';
import { Calendar, Check, CircleCheck, ShieldCheck } from '@/shared/lucide';

import {
  pick,
  type ExpertBooking,
  type ExpertProduct,
  type ExpertProductKind,
  type ExpertService,
  type ExpertSlot,
} from '../data/models';
import { EXPERT_PRODUCT_ICON } from './icons';
import { ShopCard, ShopCardTitle, ShopPanel, SummaryRow } from './shop-chrome';

/** `Bu gün 18:00` / `Sabah 10:00` — the day is a key, the time is Baku wall-clock. */
export function useSlotLabel(): (slot: ExpertSlot | undefined) => string {
  const t = useTranslations('courier_shop');
  return (slot) => (slot ? t(`expert.slot.${slot.day}`, { time: slot.time }) : '');
}

export interface ExpertProductPickerProps {
  products: readonly ExpertProduct[];
  value: ExpertProductKind;
  onChange: (kind: ExpertProductKind) => void;
}

export function ExpertProductPicker({ products, value, onChange }: ExpertProductPickerProps) {
  const t = useTranslations('courier_shop');
  const locale = useLocale();
  const titleId = useId();

  return (
    <ShopCard>
      <fieldset className="m-0 flex w-full flex-col gap-4 border-0 p-0">
        <legend id={titleId} className="p-0">
          <ShopCardTitle>{t('expert.product.title')}</ShopCardTitle>
        </legend>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          {products.map((product) => {
            const Icon = EXPERT_PRODUCT_ICON[product.kind];
            const active = product.kind === value;
            return (
              <label
                key={product.kind}
                className={cn(
                  'flex flex-1 cursor-pointer flex-row items-center gap-3 rounded-lg p-4 outline outline-2 -outline-offset-1',
                  'transition-colors focus-within:outline-brand',
                  active
                    ? 'bg-brand-soft outline-brand'
                    : 'bg-surface2 outline-transparent hover:bg-line',
                )}
              >
                <input
                  type="radio"
                  name="expert-product"
                  className="sr-only"
                  checked={active}
                  onChange={() => {
                    onChange(product.kind);
                  }}
                />
                <Icon size={24} aria-hidden="true" className={active ? 'text-brand' : 'text-ink2'} />
                <span className="min-w-0 text-body-sm font-bold text-ink">
                  {pick(product.name, locale)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </ShopCard>
  );
}

export interface ExpertServicePickerProps {
  services: readonly ExpertService[];
  value: string | null;
  onChange: (service: ExpertService) => void;
}

export function ExpertServicePicker({ services, value, onChange }: ExpertServicePickerProps) {
  const t = useTranslations('courier_shop');
  const locale = useLocale();
  const { money } = useFormat();
  const titleId = useId();

  return (
    <ShopCard>
      <fieldset className="m-0 flex w-full flex-col gap-4 border-0 p-0">
        <legend id={titleId} className="p-0">
          <ShopCardTitle>{t('expert.service.title')}</ShopCardTitle>
        </legend>
        {services.map((service) => {
          const active = service.kind === value;
          return (
            <label
              key={service.kind}
              className={cn(
                'flex w-full cursor-pointer flex-col gap-3 rounded-lg p-[18px] outline outline-2 -outline-offset-1',
                'transition-colors focus-within:outline-brand sm:flex-row sm:items-center sm:gap-[14px]',
                active
                  ? 'bg-brand-soft outline-brand'
                  : 'bg-surface2 outline-transparent hover:bg-line',
              )}
            >
              <input
                type="radio"
                name="expert-service"
                className="sr-only"
                checked={active}
                onChange={() => {
                  onChange(service);
                }}
              />
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-xs',
                  active ? 'bg-brand text-on-cta' : 'bg-surface',
                )}
              >
                {active ? <Check size={16} /> : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body font-bold text-ink">{pick(service.name, locale)}</span>
                <span className="text-caption text-ink2">{pick(service.description, locale)}</span>
              </span>
              <Badge tone="neutral">{t('expert.minutes', { count: service.minutes })}</Badge>
              <span className="shrink-0 text-body font-extrabold text-ink">
                {money(service.price)}
              </span>
            </label>
          );
        })}
      </fieldset>
    </ShopCard>
  );
}

export interface ExpertSlotPickerProps {
  slots: readonly ExpertSlot[];
  value: string | null;
  onChange: (slot: ExpertSlot) => void;
}

export function ExpertSlotPicker({ slots, value, onChange }: ExpertSlotPickerProps) {
  const t = useTranslations('courier_shop');
  const titleId = useId();
  const slotLabel = useSlotLabel();

  return (
    <ShopCard>
      <fieldset className="m-0 flex w-full flex-col gap-4 border-0 p-0">
        <legend id={titleId} className="p-0">
          <ShopCardTitle>{t('expert.slot.title')}</ShopCardTitle>
        </legend>
        <div className="flex w-full flex-row flex-wrap gap-2.5">
          {slots.map((slot) => {
            const active = slot.id === value;
            return (
              <label
                key={slot.id}
                className={cn(
                  'flex h-11 cursor-pointer items-center rounded-pill px-[18px] text-label transition-colors',
                  'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand',
                  active
                    ? 'bg-cta font-bold text-on-cta'
                    : 'bg-surface2 font-medium text-ink2 hover:bg-line',
                )}
              >
                <input
                  type="radio"
                  name="expert-slot"
                  className="sr-only"
                  checked={active}
                  onChange={() => {
                    onChange(slot);
                  }}
                />
                {slotLabel(slot)}
              </label>
            );
          })}
        </div>
      </fieldset>
    </ShopCard>
  );
}

export interface ExpertBookingSummaryProps {
  product: ExpertProduct | undefined;
  service: ExpertService | null;
  slot: ExpertSlot | null;
  submitting: boolean;
  onBook: () => void;
}

/** The dark 380 panel: product · service, slot, duration, fee, "Rezerv et". */
export function ExpertBookingSummary({
  product,
  service,
  slot,
  submitting,
  onBook,
}: ExpertBookingSummaryProps) {
  const t = useTranslations('courier_shop');
  const locale = useLocale();
  const { money } = useFormat();
  const slotLabel = useSlotLabel();
  const ready = Boolean(service && slot);
  const dash = '—';

  return (
    <ShopPanel>
      <p className="m-0 text-label font-bold text-on-block/70">{t('expert.summary.title')}</p>
      <p className="m-0 text-[20px] font-extrabold leading-tight text-on-block">
        {product && service
          ? `${pick(product.name, locale)} · ${pick(service.name, locale)}`
          : t('expert.summary.placeholder')}
      </p>
      <SummaryRow
        onBlock
        divider
        label={t('expert.summary.slot')}
        value={slot ? slotLabel(slot) : dash}
      />
      <SummaryRow
        onBlock
        divider
        label={t('expert.summary.duration')}
        value={service ? t('expert.approxMinutes', { count: service.minutes }) : dash}
      />
      <SummaryRow
        onBlock
        divider
        label={t('expert.summary.fee')}
        value={service ? money(service.price) : dash}
      />
      <Button
        variant="brand"
        size="2xl"
        disabled={!ready}
        loading={submitting}
        onClick={onBook}
        leadingIcon={<Calendar size={18} aria-hidden="true" />}
      >
        {t('expert.summary.cta')}
      </Button>
      <p className="m-0 text-caption text-on-block/70">{t('demo.noCharge')}</p>
    </ShopPanel>
  );
}

/** `kuryer-ekspert-rezerv-tesdiqi.html` — the confirmation card. */
export function ExpertBookingCard({
  booking,
  action,
}: {
  booking: ExpertBooking;
  action?: ReactNode;
}) {
  const t = useTranslations('courier_shop');
  const locale = useLocale();
  const { money } = useFormat();
  const slotLabel = useSlotLabel();

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-card bg-surface px-6 py-12 text-center md:p-14">
      <span
        aria-hidden="true"
        className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-success"
      >
        <CircleCheck size={48} className="text-white" />
      </span>
      <h2 className="m-0 text-[28px] font-extrabold leading-tight text-ink">
        {t('expert.booking.heading')}
      </h2>
      <p className="m-0 flex max-w-[520px] flex-row items-center justify-center gap-2 text-body text-ink2">
        <ShieldCheck size={18} aria-hidden="true" className="shrink-0 text-success" />
        {booking.certified
          ? t('expert.booking.bodyCertified', {
              name: booking.expertName,
              slot: slotLabel(booking.slot),
            })
          : t('expert.booking.body', {
              name: booking.expertName,
              slot: slotLabel(booking.slot),
            })}
      </p>

      <div className="flex w-full max-w-[420px] flex-col gap-3 rounded-lg bg-surface2 p-5 text-left">
        <SummaryRow
          label={t('expert.booking.product')}
          value={pick(booking.product.name, locale)}
        />
        <SummaryRow
          label={t('expert.booking.service')}
          value={pick(booking.service.name, locale)}
        />
        <SummaryRow label={t('expert.booking.slot')} value={slotLabel(booking.slot)} />
        <SummaryRow label={t('expert.booking.fee')} value={money(booking.service.price)} emphasis />
      </div>

      {booking.simulated ? (
        <p className="m-0 text-caption text-ink3">{t('demo.noCharge')}</p>
      ) : null}
      {action}
    </section>
  );
}
