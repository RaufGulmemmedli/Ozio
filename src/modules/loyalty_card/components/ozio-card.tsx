'use client';

/**
 * The Ozio Card — node `hBDTC` in `html/app-core/app-card-bonus.html`.
 *
 * Measured: `brand` fill, `rounded-xl` (28), padding 28, `space-between`;
 * the white `<OzioLogo/>` top-left (121x52), the tier text top-right
 * (14/700, +2px tracking), then the label (14/400 white@80 "Bonus balansı"),
 * the balance (44/800 white) and the masked number (14/500 white@80, +1px
 * tracking). In dark the fill is the lighter `brand` (#FF4D7D) — the token
 * already does that, so no variant is needed.
 *
 * Sizes (the `size` prop):
 *  - `lg`   480x300 — the default, and what `/home` renders;
 *  - `sm`   350x260 — mobile;
 *  - `fill` 100% x 340 — what the `/card` export actually draws inside its
 *    560-wide left column.
 *
 * `flippable` turns the card into a keyboard-operable flip: the back carries a
 * real QR code of the card number (`<QrCodeView>`), announced through a live
 * region. The scannable **Code 128** barcode lives in `<CardBarcodePanel>`
 * below the card, as the export draws it.
 */
import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { OzioLogo } from '@/shared/brand';
import { ScanLine, Wallet } from '@/shared/lucide';
import { QrCodeView } from '@/shared/media';

import type { OzioCardModel } from '../data/models/card';

export type OzioCardSize = 'lg' | 'sm' | 'fill';

const SIZE_CLASS: Record<OzioCardSize, string> = {
  lg: 'w-full max-w-[480px] h-[300px]',
  sm: 'w-full max-w-[350px] h-[260px]',
  fill: 'w-full h-[340px]',
};

const BALANCE_CLASS: Record<OzioCardSize, string> = {
  lg: 'text-[44px]',
  sm: 'text-[36px]',
  fill: 'text-[44px]',
};

/** `m` is the export's 121x52; the mobile card gets the `s` wordmark. */
const LOGO_SIZE: Record<OzioCardSize, 'm' | 's'> = { lg: 'm', sm: 's', fill: 'm' };

export interface OzioCardProps {
  /** `null` while loading — render `<OzioCardSkeleton>` instead. */
  card: OzioCardModel;
  /** 480x300 by default (`/home`, `/card`), 350x260 on mobile. */
  size?: OzioCardSize;
  /**
   * Tier name for the top-right corner. The API sends no tier, so this is
   * either a fixture-backed tier name (behind `flag:loyaltyTiers`) or the
   * "PLUS" wordmark from the export.
   */
  tier?: string;
  /** Adds the flip affordance and the QR back face. */
  flippable?: boolean;
  className?: string;
}

export function OzioCard({
  card,
  size = 'lg',
  tier,
  flippable = false,
  className,
}: OzioCardProps) {
  const t = useTranslations('loyalty_card');
  const { money } = useFormat();
  const [flipped, setFlipped] = useState(false);
  const statusId = useId();

  const tierLabel = tier?.trim() || t('card.tierFallback');

  const front = (
    <div
      className={cn(
        'flex h-full w-full flex-col justify-between rounded-xl bg-brand p-7',
        'absolute inset-0 [backface-visibility:hidden]',
      )}
    >
      <div className="flex w-full flex-row items-center justify-between">
        <OzioLogo tone="white" size={LOGO_SIZE[size]} />
        <span className="text-label font-bold tracking-[2px] text-white">{tierLabel}</span>
      </div>

      <div className="flex w-full flex-col gap-0.5">
        <span className="text-label text-white/80">{t('card.balanceLabel')}</span>
        <span className={cn('oz-num font-extrabold leading-[1.1] text-white', BALANCE_CLASS[size])}>
          {money(card.balance)}
        </span>
        {/* Selectable, per the a11y note: the cashier may read it out. */}
        <span className="oz-num select-text text-label font-medium tracking-[1px] text-white/80">
          {card.maskedNumber}
        </span>
      </div>
    </div>
  );

  const back = (
    <div
      className={cn(
        'absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-4',
        'rounded-xl bg-brand p-7 [backface-visibility:hidden]',
      )}
      style={{ transform: 'rotateY(180deg)' }}
    >
      <QrCodeView
        value={card.cardNumber}
        label={t('card.qrAlt', { number: card.formattedNumber })}
        size={size === 'sm' ? 150 : 180}
      />
      <span className="oz-num select-text text-label font-medium tracking-[1px] text-white/80">
        {card.formattedNumber}
      </span>
    </div>
  );

  if (!flippable) {
    return (
      <div className={cn('relative shrink-0', SIZE_CLASS[size], className)}>{front}</div>
    );
  }

  return (
    <div className={cn('relative shrink-0', SIZE_CLASS[size], className)}>
      <div
        className="relative h-full w-full transition-transform duration-[var(--oz-dur-slow)] ease-[var(--oz-ease-out)] motion-reduce:transition-none"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {front}
        {back}
      </div>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        aria-pressed={flipped}
        aria-describedby={statusId}
        aria-label={flipped ? t('card.flipToFront') : t('card.flipToBack')}
        className={cn(
          'absolute bottom-7 end-7 z-10 flex size-11 items-center justify-center rounded-pill',
          'bg-white/20 text-white transition-colors hover:bg-white/30',
        )}
      >
        {flipped ? <Wallet size={20} aria-hidden="true" /> : <ScanLine size={20} aria-hidden="true" />}
      </button>

      {/* The flip is a visual change only, so it is announced. */}
      <span id={statusId} aria-live="polite" className="sr-only">
        {flipped ? t('card.flippedToBack') : t('card.flippedToFront')}
      </span>
    </div>
  );
}
