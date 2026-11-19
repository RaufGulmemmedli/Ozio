'use client';

/**
 * "Sorğudan imtina edilsin?" (`ask-dialog-decline.html`): a 480-wide modal led by a 64
 * `brand-soft` disc with a ban glyph, the question 24/800, one explanatory line, then
 * Geri qayıt / İmtina et (brand).
 *
 * The title is hidden visually and re-rendered inside the body so the drawn layout (disc above
 * the question) survives while `<Modal>` keeps its accessible name and focus trap.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import type { Failure } from '@/core/network';
import { CircleX } from '@/shared/lucide';
import { Button, Modal } from '@/shared/ui';

export interface AskDeclineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Who gets told — the body reads "<Ad>-ə sorğunun imtina edildiyi bildiriləcək." */
  childName: string;
  submitting: boolean;
  failure?: Failure | null;
  onConfirm: () => void;
}

export function AskDeclineDialog({
  open,
  onOpenChange,
  childName,
  submitting,
  failure,
  onConfirm,
}: AskDeclineDialogProps) {
  const t = useTranslations('ask_to_buy');
  const tc = useTranslations('common');
  const failureMessage = useFailureMessage();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('decline.title')}
      titleHidden
      hideClose
      size="s"
      className="[--oz-modal-w:480px]"
      footer={
        <>
          <Button variant="soft" size="xl" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('decline.back')}
          </Button>
          <Button variant="brand" size="xl" loading={submitting} onClick={onConfirm}>
            {t('decline.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-start gap-5">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-modal bg-brand-soft"
        >
          <CircleX size={30} className="text-brand" />
        </span>
        <p className="text-h3 font-extrabold text-ink">{t('decline.title')}</p>
        <p className="text-body-sm text-ink2">{t('decline.body', { name: childName })}</p>
        {failure ? (
          <p role="alert" className="text-label font-semibold text-brand">
            {failureMessage(failure)}
          </p>
        ) : null}
        <p className="text-caption text-ink3">{tc('demo.title')} · {t('decline.demoNote')}</p>
      </div>
    </Modal>
  );
}
