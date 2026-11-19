'use client';

/**
 * GB5a `Dialog · Qrup tamamlandı` and GB5b `Dialog · Gözləyirik` (board `AZf7h`).
 *
 * Which one shows is the source's answer (`JoinResult.completed`), not a client guess. GB5b's
 * copy carries the live remaining time, still derived from `deal.closesAt`; when the window
 * elapses with the dialog open the countdown settles to "Vaxt bitdi" and the caller's refetch
 * moves the screen to the expired panel.
 */
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { Button, Modal } from '@/shared/ui';

import type { JoinResult } from '../data/models/join-result';
import { useCountdown } from '../hooks/use-countdown';
import { useDurationText } from './countdown-text';
import { useHref } from '../lib/use-href';

export interface JoinResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: JoinResult;
  /** Opens the share dialog from GB5b's `Dəvət et`. */
  onInvite: () => void;
  /** Fired when the window elapses while this dialog is open. */
  onElapsed?: () => void;
}

export function JoinResultDialog({
  open,
  onOpenChange,
  result,
  onInvite,
  onElapsed,
}: JoinResultDialogProps) {
  const t = useTranslations('group_buy');
  const href = useHref();
  const cd = useCountdown(result.deal.closesAt, onElapsed);
  const remaining = useDurationText(cd);

  const completed = result.completed;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={completed ? t('complete.title') : t('waiting.title')}
      description={
        completed
          ? t('complete.body')
          : t('waiting.body', { count: result.deal.missing, time: remaining })
      }
      size="s"
      closeLabel={t('close')}
      footer={
        <>
          {completed ? (
            <Button as="a" href={href(paths.orders)} variant="primary" fullWidth>
              {t('complete.track')}
            </Button>
          ) : (
            <Button variant="primary" fullWidth onClick={onInvite}>
              {t('detail.invite')}
            </Button>
          )}
          <Button variant="soft" fullWidth onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
        </>
      }
    >
      {null}
    </Modal>
  );
}
