'use client';

/**
 * The scannable part of SC4 — a **real Code 128 barcode and a real QR**, not a picture.
 *
 * `<Barcode>` and `<QrCodeView>` come from `@/shared/media` (encoders in `@/core/lib/barcode` and
 * `@/core/lib/qr`). Both render an `<svg role="img">` whose accessible name is the student number,
 * and the number is printed underneath as text as well, so a reader never has to interpret bars.
 *
 * `fullscreen` is the canteen variant: a constant-white plate with 180-high bars, opened from the
 * "Kassada göstər" button and closed with Escape or the close control. The plate is deliberately
 * `bg-white` in both themes — a dark-mode inversion would not scan.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { QrCode, X } from '@/shared/lucide';
import { Barcode, QrCodeView } from '@/shared/media';
import { Button, IconButton, Modal } from '@/shared/ui';

export interface StudentCardPlateProps {
  /** The verified student number, e.g. `TB-204518`. */
  number: string;
}

export function StudentCardPlate({ number }: StudentCardPlateProps) {
  const t = useTranslations('school');
  const [fullscreen, setFullscreen] = useState(false);

  /** What the QR encodes — a verification URL, the same thing the entry scanner would read. */
  const qrValue = `https://ozio10.az/student/${encodeURIComponent(number)}`;

  return (
    <section
      aria-labelledby="student-card-plate"
      className="flex w-full flex-col gap-5 rounded-bento bg-surface p-6 lg:p-7"
    >
      <div className="flex flex-row items-center justify-between gap-4">
        <h2 id="student-card-plate" className="text-h4 font-extrabold text-ink">
          {t('card.scan.title')}
        </h2>
        <Button
          variant="soft"
          size="md"
          leadingIcon={<QrCode size={18} aria-hidden="true" />}
          onClick={() => setFullscreen(true)}
        >
          {t('card.scan.fullscreen')}
        </Button>
      </div>

      <div className="flex w-full flex-col items-center gap-5 lg:flex-row lg:items-stretch">
        <Barcode
          value={number}
          label={t('card.barcode.label', { number })}
          caption={t('card.scan.caption')}
          className="min-w-0 flex-1"
        />
        <QrCodeView
          value={qrValue}
          label={t('card.qr.label', { number })}
          size={180}
          caption={t('card.qr.caption')}
          className="shrink-0 self-center"
        />
      </div>

      <Modal
        open={fullscreen}
        onOpenChange={setFullscreen}
        size="l"
        title={t('card.scan.fullscreen')}
        titleHidden
        hideClose
        bodyClassName="p-0"
      >
        <div className="flex w-full flex-col items-center gap-5">
          <Barcode
            value={number}
            label={t('card.barcode.label', { number })}
            caption={t('card.scan.caption')}
            fullscreen
          />
          <IconButton
            aria-label={t('card.scan.close')}
            tone="surface2"
            onClick={() => setFullscreen(false)}
          >
            <X size={20} aria-hidden="true" />
          </IconButton>
        </div>
      </Modal>
    </section>
  );
}
