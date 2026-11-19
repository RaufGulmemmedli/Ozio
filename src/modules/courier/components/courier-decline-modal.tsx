'use client';

/**
 * "Təklifi rədd et" (`C4Tz9d` → `kuryer-teklif-detali-redd-modali.html`), the web replacement for
 * the mobile `decline_sheet.dart`: four radio reasons, then "Geri" / "Rədd et".
 *
 * Declining is destructive (the offer leaves the board), so it always goes through this
 * confirmation — the "Rədd et" button on the detail never acts on its own.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button, Modal, Radio, RadioGroup } from '@/shared/ui';

export type DeclineReason = 'tooFar' | 'vehicle' | 'endingShift' | 'other';

const REASONS: readonly DeclineReason[] = ['tooFar', 'vehicle', 'endingShift', 'other'];

export function CourierDeclineModal({
  open,
  onOpenChange,
  onConfirm,
  submitting = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: DeclineReason) => void;
  submitting?: boolean;
}) {
  const t = useTranslations('courier');
  const [reason, setReason] = useState<DeclineReason>('tooFar');

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('decline.title')}
      description={t('decline.body')}
      size="s"
      closeLabel={t('decline.back')}
      footer={
        <>
          <Button
            variant="soft"
            size="lg"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            {t('decline.back')}
          </Button>
          <Button variant="brand" size="lg" loading={submitting} onClick={() => onConfirm(reason)}>
            {t('decline.confirm')}
          </Button>
        </>
      }
    >
      <RadioGroup
        aria-label={t('decline.reasonLabel')}
        value={reason}
        onValueChange={(v) => setReason(v as DeclineReason)}
      >
        {REASONS.map((id) => (
          <Radio key={id} value={id} label={t(`decline.${id}`)} />
        ))}
      </RadioGroup>
    </Modal>
  );
}
