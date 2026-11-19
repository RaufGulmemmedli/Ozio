'use client';

/**
 * `Dialog · Təşəkkür` from `v-states-dialogs.html`.
 *
 * Measured: 360 wide (`<Modal size="s">`), `bg` fill, radius 32, padding 32, gap 14 — a 72×72
 * `success-soft` circle with `heart-handshake`, title 22/800, a centred 14/400 `ink2` body reading
 * "Payın əlavə olundu: +20 ₼. Linki kopyalandı." and a full-width soft "Bağla".
 *
 * The copy line is true because the dialog is only opened after the share link has been copied, so
 * the caller passes `linkCopied` and the body changes if the copy failed.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Button, Modal } from '@/shared/ui';

import { HeartHandshake } from './icons';

export interface ThanksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The amount the server recorded, not the one the form sent. */
  amount: number;
  linkCopied: boolean;
}

export function ThanksDialog({ open, onOpenChange, amount, linkCopied }: ThanksDialogProps) {
  const t = useTranslations('viral');
  const { money } = useFormat();

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="s" title={t('thanks.title')} titleHidden>
      <div className="flex w-full flex-col items-center gap-[14px] text-center">
        <span
          aria-hidden="true"
          className="flex size-18 items-center justify-center rounded-pill bg-success-soft"
        >
          <HeartHandshake size={32} className="text-success" />
        </span>

        <h2 className="text-h3 font-extrabold text-ink">{t('thanks.title')}</h2>

        <p className="max-w-[260px] text-label text-ink2">
          {linkCopied
            ? t('thanks.bodyCopied', { amount: money(amount) })
            : t('thanks.body', { amount: money(amount) })}
        </p>

        <Button variant="soft" size="lg" fullWidth onClick={() => onOpenChange(false)}>
          {t('thanks.close')}
        </Button>
      </div>
    </Modal>
  );
}
