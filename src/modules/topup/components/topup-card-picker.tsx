'use client';

/**
 * The saved-cards radio list on `/topup/card` (`topup-card.html` → `Cards`).
 *
 * Measured: `surface` card, radius 28, padding 28, gap 14; label 14/600 `ink2`. Each row is radius
 * 20, padding 16/20, gap 16 — selected rows get `brand-soft` + a 2px `brand` outline, the rest
 * `bg` + a 1px `line` outline. The 24 radio dot is a 2px ring (`brand` when selected, `ink3`
 * otherwise) with a 12 `brand` dot inside. Title 16/700, meta 13/400 `ink3`, and an expired card's
 * meta turns `brand`: "Kartın müddəti bitib". The add-card link is 15/700 `brand` with an 18 plus.
 *
 * **No card data is ever collected here.** The design has no PAN / expiry / CVV field and the
 * contract forbids one: "Yeni kart əlavə et" is a link to `/checkout/add-card`, which hands off to
 * the bank's own page (`POST v1/payment/save-card`, owned by the cart module).
 *
 * Native radios inside labels, so the whole row is the hit target and arrow-key navigation,
 * grouping and the expired-card `disabled` state all come from the platform.
 */
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { CreditCard, Plus } from '@/shared/lucide';

import { savedCardLabel, type SavedCard } from '../data/models/saved-card';

export interface TopupCardPickerProps {
  cards: readonly SavedCard[];
  /** The selected card id, or 0. */
  selectedId: number;
  onSelect: (id: number) => void;
  /** Shown under the group when the form has no card selected. */
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function TopupCardPicker({
  cards,
  selectedId,
  onSelect,
  error,
  disabled = false,
  className,
}: TopupCardPickerProps) {
  const t = useTranslations('topup');
  const groupId = useId();
  const errorId = `${groupId}-error`;

  return (
    <section
      className={cn(
        'flex w-full shrink-0 flex-col items-start gap-[14px] rounded-xl bg-surface p-5 md:p-7',
        className,
      )}
    >
      <p id={groupId} className="text-label font-semibold text-ink2">
        {t('cards.label')}
      </p>

      <div
        role="radiogroup"
        aria-labelledby={groupId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className="flex w-full flex-col gap-[14px]"
      >
        {cards.map((card) => {
          const selected = card.id === selectedId;
          const unusable = card.expired || disabled;
          return (
            <label
              key={card.id}
              className={cn(
                'flex w-full flex-row items-center gap-4 rounded-lg px-5 py-4',
                'outline -outline-offset-1',
                selected
                  ? 'bg-brand-soft outline-2 outline-brand'
                  : 'bg-bg outline-1 outline-line',
                card.expired
                  ? 'cursor-not-allowed opacity-70'
                  : 'cursor-pointer hover:outline-ink3',
                'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-brand',
              )}
            >
              <input
                type="radio"
                name="topup-card"
                value={String(card.id)}
                checked={selected}
                disabled={unusable}
                onChange={() => onSelect(card.id)}
                className="peer sr-only"
              />

              <span
                aria-hidden="true"
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-pill',
                  'outline-2 -outline-offset-1',
                  selected ? 'outline-brand' : 'outline-ink3',
                )}
              >
                {selected ? <span className="size-3 rounded-pill bg-brand" /> : null}
              </span>

              <CreditCard
                aria-hidden="true"
                size={22}
                className={cn('shrink-0', selected ? 'text-brand' : 'text-ink3')}
              />

              <span className="flex min-w-0 flex-1 flex-col items-start gap-[3px]">
                <span className="text-body font-bold text-ink">{savedCardLabel(card)}</span>
                <span className={cn('text-caption', card.expired ? 'text-brand' : 'text-ink3')}>
                  {card.expired
                    ? t('cards.expired')
                    : card.expiry
                      ? t('cards.validUntil', { date: card.expiry })
                      : t('cards.saved')}
                </span>
              </span>

              <span className="hidden shrink-0 text-caption text-ink3 sm:block">
                {t('cards.saved')}
              </span>
            </label>
          );
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-caption font-medium text-brand">
          {error}
        </p>
      ) : null}

      {/* The hand-off. Card details are typed on the bank's page, never here. */}
      <Link
        href={paths.checkoutAddCard}
        className="flex w-fit flex-row items-center gap-[10px] rounded-sm px-1 py-1.5 text-body-sm font-bold text-brand hover:text-brand-dark"
      >
        <Plus aria-hidden="true" size={18} className="shrink-0" />
        {t('cards.addCard')}
      </Link>
      <p className="text-caption text-ink3">{t('cards.addCardHint')}</p>
    </section>
  );
}
