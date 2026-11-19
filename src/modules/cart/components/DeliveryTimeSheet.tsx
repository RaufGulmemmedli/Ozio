'use client';

/**
 * `?sheet=time` — the delivery-time sheet (OD4, export `app-orders/app-delivery-time.html`).
 *
 * ⚠ **No backend.** There is no slots endpoint, no capacity, no cut-off and no documented field on
 * `POST v2/orders` for a chosen slot, so the whole model is the client-side one in
 * `data/models/delivery-time.ts` and the choice is kept in the cart selection store only — it is
 * deliberately **not** sent to `orders/checkout`, because adding an undocumented field to a
 * verified call is how a 422 happens. The sheet says so in one line (`time.noBackend`).
 *
 * Export values: dialog `surface` radius 32 padding 32 gap 20 (600 wide); a `surface2` pill switch
 * for today/tomorrow (52 high, 44-high segments); the ASAP card `brand-soft` radius 20, 76 high,
 * 2px `brand` outline, `zap` 24 and a 26px check circle; slots three per row, 52 high, radius 14 —
 * `surface2`/`ink3` when full, `block` when selected, `surface` + 1px `line` otherwise.
 */
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Check, Info, Zap } from '@/shared/lucide';
import { Button, Modal } from '@/shared/ui';

import {
  ASAP,
  dayDate,
  deliverySlots,
  isSameChoice,
  slotLabel,
  type DeliveryDay,
  type DeliveryTimeChoice,
} from '../data/models/delivery-time';
import type { StoreDeliveryEstimate } from '../data/models/delivery';
import { useCartSelection } from '../hooks/use-cart-selection';

/** The value the summary row prints for the current choice. */
export function DeliveryTimeValue({
  choice,
  estimate,
}: {
  choice: DeliveryTimeChoice;
  estimate: StoreDeliveryEstimate | null;
}) {
  const t = useTranslations('cart');

  if (choice.kind === 'slot') {
    return <>{slotLabel({ startHour: choice.startHour, endHour: choice.startHour + 1 })}</>;
  }
  // `delivery_time_min` from `stores/search` is the only server estimate available here; the
  // export's "30–45 dəq" range has no upper-bound field, so only the minimum is shown.
  return (
    <>
      {estimate?.minutesMin
        ? t('summary.time.asapEstimate', { minutes: estimate.minutesMin })
        : t('summary.time.asap')}
    </>
  );
}

export interface DeliveryTimeSheetProps {
  open: boolean;
  onClose: () => void;
  estimate: StoreDeliveryEstimate | null;
}

export function DeliveryTimeSheet({ open, onClose, estimate }: DeliveryTimeSheetProps) {
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const { date } = useFormat();
  const committed = useCartSelection((state) => state.deliveryTime);
  const setDeliveryTime = useCartSelection((state) => state.setDeliveryTime);

  const [draft, setDraft] = useState<DeliveryTimeChoice>(committed);
  const [day, setDay] = useState<DeliveryDay>(
    committed.kind === 'slot' ? committed.day : 'today',
  );
  // Read once per open, so the grid does not shift under the user mid-interaction.
  const [now, setNow] = useState(() => new Date());

  // Reopening starts from the committed choice and a fresh clock. Adjusting state during render on
  // a prop change is React's own pattern for this; an effect would re-render twice.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setNow(new Date());
      setDraft(committed);
      setDay(committed.kind === 'slot' ? committed.day : 'today');
    }
  }

  const slots = useMemo(() => deliverySlots(day, now), [day, now]);

  function confirm() {
    setDeliveryTime(draft);
    onClose();
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('time.title')}
      description={t('time.subtitle')}
      size="m"
      closeLabel={tc('close')}
      footer={
        <Button variant="primary" size="lg" fullWidth onClick={confirm}>
          {t('time.confirm')}
        </Button>
      }
    >
      <div className="flex w-full flex-col gap-5">
        {/* day switch */}
        <div
          role="tablist"
          aria-label={t('time.title')}
          className="flex h-[52px] w-full flex-row items-center gap-1 rounded-pill bg-surface2 p-1"
        >
          {(['today', 'tomorrow'] as const).map((value) => {
            const active = day === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setDay(value)}
                className={cn(
                  'h-11 flex-1 rounded-pill text-body-sm font-bold',
                  'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
                  active ? 'bg-block text-on-block' : 'text-ink2 hover:text-ink',
                )}
              >
                {t(value === 'today' ? 'time.today' : 'time.tomorrow', {
                  date: date(dayDate(value, now), 'dayMonth'),
                })}
              </button>
            );
          })}
        </div>

        {/* ASAP */}
        <button
          type="button"
          onClick={() => setDraft(ASAP)}
          aria-pressed={draft.kind === 'asap'}
          className={cn(
            'flex h-[76px] w-full flex-row items-center gap-[14px] rounded-lg px-5 text-left',
            'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
            draft.kind === 'asap'
              ? 'bg-brand-soft outline outline-2 -outline-offset-1 outline-brand'
              : 'bg-bg outline outline-1 -outline-offset-[0.5px] outline-line',
          )}
        >
          <Zap size={24} aria-hidden="true" className="shrink-0 text-brand" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-body font-bold text-ink">{t('time.asapTitle')}</span>
            <span className="text-label text-ink2">
              {estimate?.minutesMin
                ? t('time.asapBody', { minutes: estimate.minutesMin })
                : t('time.asapBodyUnknown')}
            </span>
          </span>
          {draft.kind === 'asap' ? (
            <span
              aria-hidden="true"
              className="grid size-[26px] shrink-0 place-items-center rounded-pill bg-brand text-on-cta"
            >
              <Check size={16} />
            </span>
          ) : null}
        </button>

        <p className="text-label font-bold text-ink2">{t('time.orPick')}</p>

        <div className="grid w-full grid-cols-3 gap-[10px]">
          {slots.map((slot) => {
            const choice: DeliveryTimeChoice = {
              kind: 'slot',
              day: slot.day,
              startHour: slot.startHour,
            };
            const selected = isSameChoice(draft, choice);
            return (
              <button
                key={`${slot.day}-${slot.startHour}`}
                type="button"
                disabled={!slot.available}
                aria-pressed={selected}
                onClick={() => setDraft(choice)}
                className={cn(
                  'h-[52px] rounded-md text-label font-medium',
                  'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
                  !slot.available && 'cursor-not-allowed bg-surface2 text-ink3',
                  slot.available && selected && 'bg-block font-bold text-on-block',
                  slot.available &&
                    !selected &&
                    'bg-surface text-ink outline outline-1 -outline-offset-[0.5px] outline-line hover:bg-surface2',
                )}
              >
                {t('time.slot', {
                  from: `${String(slot.startHour).padStart(2, '0')}:00`,
                  to: `${String(slot.endHour).padStart(2, '0')}:00`,
                })}
              </button>
            );
          })}
        </div>

        <p className="flex w-full flex-row items-start gap-[10px] text-caption text-ink3">
          <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            {t('time.hint')} {t('time.noBackend')}
          </span>
        </p>
      </div>
    </Modal>
  );
}
