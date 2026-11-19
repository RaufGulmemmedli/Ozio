'use client';

/**
 * "Ödənişi təsdiq et" (`ask-dialog-pay.html`): a 520-wide modal with a radio list of cards
 * (selected row `brand-soft`, the rest `bg`), the amount, and Ləğv et / Təsdiq et və ödə.
 *
 * **Nothing is charged.** The confirm only moves the mock row to `approved` and stamps the chosen
 * card's label on it — the demo banner on the page behind says so, and the dialog repeats it.
 *
 * Focus is trapped and restored by `<Modal>` (Radix); the radio group is a real
 * `role="radiogroup"` so arrow keys move between cards.
 */
import * as RadioGroup from '@radix-ui/react-radio-group';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/core/lib/cn';
import { useFailureMessage, useFormat } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { CreditCard } from '@/shared/lucide';
import { Button, Modal } from '@/shared/ui';

import type { AskCard } from '../data/models/ask-request';

export interface AskPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: AskCard[];
  /** Who asked — the body reads "<Ad>-in N məhsulluq sorğusunu ödəyirsən." */
  childName: string;
  itemCount: number;
  total: number;
  submitting: boolean;
  failure?: Failure | null;
  onConfirm: (cardId: string) => void;
}

export function AskPayDialog({
  open,
  onOpenChange,
  cards,
  childName,
  itemCount,
  total,
  submitting,
  failure,
  onConfirm,
}: AskPayDialogProps) {
  const t = useTranslations('ask_to_buy');
  const tc = useTranslations('common');
  const { money } = useFormat();
  const failureMessage = useFailureMessage();

  const [picked, setPicked] = useState('');

  // Derived rather than seeded in an effect: the first card is the default, a pick wins while it
  // still exists, and a card that disappeared from the list silently falls back to the first.
  const cardId = cards.some((c) => c.id === picked) ? picked : (cards[0]?.id ?? '');

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('pay.title')}
      size="m"
      className="[--oz-modal-w:520px]"
      closeLabel={tc('close')}
      footer={
        <>
          <Button variant="soft" size="xl" onClick={() => onOpenChange(false)} disabled={submitting}>
            {tc('cancel')}
          </Button>
          <Button
            variant="brand"
            size="xl"
            loading={submitting}
            disabled={cardId.length === 0}
            onClick={() => onConfirm(cardId)}
          >
            {t('pay.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-body-sm text-ink2">{t('pay.body', { name: childName, count: itemCount })}</p>

        <RadioGroup.Root
          value={cardId}
          onValueChange={setPicked}
          aria-label={t('pay.cardsLabel')}
          className="flex flex-col gap-3"
        >
          {cards.map((card) => {
            const selected = card.id === cardId;
            return (
              <RadioGroup.Item
                key={card.id}
                value={card.id}
                className={cn(
                  'flex min-h-14 w-full flex-row items-center gap-[14px] rounded-[16px] p-[18px] text-start',
                  'transition-colors duration-[var(--oz-dur-fast)]',
                  selected ? 'bg-brand-soft' : 'bg-bg',
                )}
              >
                <CreditCard
                  aria-hidden="true"
                  size={22}
                  className={cn('shrink-0', selected ? 'text-brand' : 'text-ink2')}
                />
                <span className="min-w-0 flex-1 truncate text-body font-semibold text-ink">
                  {card.label}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-[22px] shrink-0 items-center justify-center rounded-pill border-2',
                    selected ? 'border-brand' : 'border-line',
                  )}
                >
                  {selected ? <span className="size-[10px] rounded-pill bg-brand" /> : null}
                </span>
              </RadioGroup.Item>
            );
          })}
        </RadioGroup.Root>

        {failure ? (
          <p role="alert" className="text-label font-semibold text-brand">
            {failureMessage(failure)}
          </p>
        ) : null}

        <div className="flex flex-row items-center justify-between gap-4">
          <span className="text-body-sm text-ink2">{t('pay.amount')}</span>
          <span className="text-h3 font-extrabold text-ink">{money(total)}</span>
        </div>

        <p className="text-caption text-ink3">{t('pay.demoNote')}</p>
      </div>
    </Modal>
  );
}
