'use client';

/**
 * "Bağlamanı təsdiqlə" (`zAw1D` → `baglama-yeni-tesdiq-modali.html`).
 *
 * Route summary (from / to with contacts), the bag spec line, the payment line and the total,
 * then "Geri" / "Təsdiqlə və göndər". `<Modal>` supplies the scrim, the focus trap, Esc and the
 * bottom-sheet form under 768 (components.md §overlays).
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { ArrowRight, MapPin } from '@/shared/lucide';
import { Button, Modal } from '@/shared/ui';

import {
  PRESET_CODE,
  presetForSpec,
  type ParcelDraft,
  type ParcelQuote,
  type ParcelRules,
} from '../data/models/parcel';

export interface ParcelConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ParcelDraft;
  quote?: ParcelQuote;
  rules?: ParcelRules;
  onConfirm: () => void;
  submitting?: boolean;
}

export function ParcelConfirmModal({
  open,
  onOpenChange,
  draft,
  quote,
  rules,
  onConfirm,
  submitting = false,
}: ParcelConfirmModalProps) {
  const t = useTranslations('parcel');
  const { money, number } = useFormat();

  const preset = rules ? presetForSpec(draft.spec, rules.presets) : undefined;
  const presetCode = preset ? preset.code : PRESET_CODE.large;
  const kg = number(draft.spec.weightKg, { maximumFractionDigits: 1 });
  const specLine = draft.spec.fragile
    ? t('confirm.specFragile', { preset: presetCode, kg })
    : t('confirm.spec', { preset: presetCode, kg });

  const method =
    draft.paymentMethod === 'card'
      ? `${t('new.methodCard')} ${rules?.savedCards.find((c) => c.id === draft.cardId)?.mask ?? ''}`.trim()
      : draft.paymentMethod === 'ozioBalance'
        ? t('new.methodBalance')
        : t('new.methodCash');
  const paymentLine =
    draft.payer === 'sender'
      ? t('confirm.paymentBySender', { method })
      : t('confirm.paymentByRecipient', { method });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('confirm.title')}
      size="m"
      closeLabel={t('confirm.close')}
      footer={
        <>
          <Button variant="soft" size="lg" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('confirm.back')}
          </Button>
          <Button variant="brand" size="lg" loading={submitting} onClick={onConfirm}>
            {t('confirm.submit')}
          </Button>
        </>
      }
    >
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-col gap-3 rounded-lg bg-surface2 p-4">
          <RoutePoint
            address={draft.pickup.address}
            contact={draft.pickup.contactName}
            first
          />
          <RoutePoint address={draft.dropoff.address} contact={draft.dropoff.contactName} />
        </div>

        <dl className="m-0 flex w-full flex-col gap-3">
          <SummaryRow label={t('confirm.parcel')} value={specLine} />
          <SummaryRow label={t('confirm.payment')} value={paymentLine} />
        </dl>

        <div className="flex w-full flex-row items-center justify-between border-t border-line pt-4">
          <span className="text-body font-bold text-ink">{t('confirm.total')}</span>
          <span className="text-h4 font-extrabold tabular-nums text-ink">
            {quote ? money(quote.price) : '—'}
          </span>
        </div>
      </div>
    </Modal>
  );
}

function RoutePoint({
  address,
  contact,
  first = false,
}: {
  address: string;
  contact: string;
  first?: boolean;
}) {
  const Icon = first ? MapPin : ArrowRight;
  return (
    <div className="flex w-full flex-row items-start gap-3">
      <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink3" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-label font-bold text-ink">{address}</span>
        <span className="text-caption text-ink2">{contact}</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full flex-row items-start justify-between gap-4">
      <dt className="shrink-0 text-label text-ink2">{label}</dt>
      <dd className="m-0 min-w-0 text-right text-label font-semibold text-ink">{value}</dd>
    </div>
  );
}
