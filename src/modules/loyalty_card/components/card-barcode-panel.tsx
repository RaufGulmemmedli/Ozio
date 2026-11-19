'use client';

/**
 * The barcode plate under the card — node `XYm9S` in `app-card-bonus.html`:
 * constant white (in both themes, so the scanner always sees high contrast),
 * `rounded-xl` (28), padding 28, gap 14, bars 84 high; the card number below in
 * 16/600 with +3px tracking, then the "Kassada göstər" row (13/400 `ink2`).
 *
 * The symbol is a **real Code 128** from `<Barcode>` / `code128Bars`, not an
 * image and not a row of divs, so it actually scans. The number is rendered as
 * selectable text as well, and the `<svg>` is `role="img"` with the number as
 * its accessible name (both handled inside `<Barcode>`).
 *
 * "Kassada göstər" opens the `fullscreen` variant in a modal with the
 * brightness hint — the web platform cannot raise screen brightness itself.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Sun } from '@/shared/lucide';
import { Barcode } from '@/shared/media';
import { Modal } from '@/shared/ui';

import type { OzioCardModel } from '../data/models/card';

export interface CardBarcodePanelProps {
  card: OzioCardModel;
  /** Extra line under the number — the offline screen puts its hint here. */
  hint?: string;
  className?: string;
}

export function CardBarcodePanel({ card, hint, className }: CardBarcodePanelProps) {
  const t = useTranslations('loyalty_card');
  const [open, setOpen] = useState(false);

  if (!card.cardNumber) return null;

  const label = t('card.barcodeAlt', { number: card.formattedNumber });

  return (
    <>
      <div className={cn('flex w-full flex-col items-stretch gap-[14px]', className)}>
        {/* <Barcode> paints the white plate, the bars (84 high) and the number in
            16/600 with +3px tracking — nodes XYm9S / F3ZY7 / uRwVd. */}
        <Barcode
          value={card.cardNumber}
          display={card.formattedNumber}
          label={label}
          height={84}
          caption={
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-sm px-2 py-1 text-caption font-medium text-on-block3 underline-offset-4 hover:underline"
            >
              {t('card.showAtCashier')}
            </button>
          }
        />

        {hint ? <p className="m-0 text-caption text-ink2">{hint}</p> : null}
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={t('cashier.title')}
        size="l"
        closeLabel={t('cashier.close')}
      >
        <div className="flex w-full flex-col items-center gap-5">
          <Barcode
            value={card.cardNumber}
            display={card.formattedNumber}
            label={label}
            fullscreen
            caption={
              <span className="flex items-center justify-center gap-2 text-center">
                <Sun size={16} aria-hidden="true" className="shrink-0" />
                {t('cashier.hint')}
              </span>
            }
          />
        </div>
      </Modal>
    </>
  );
}
