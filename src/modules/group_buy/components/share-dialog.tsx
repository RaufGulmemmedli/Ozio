'use client';

/**
 * The invite / share dialog behind GB2's `Dəvət et`, plus the
 * `Snackbar · Link kopyalandı` confirmation from `gb-states.html`.
 *
 * `navigator.share` first (phones), `navigator.clipboard` as the fallback — both through
 * `shareOrCopy()` in `@/core/lib/clipboard`, which also handles insecure origins. The result is
 * announced with a toast carrying the drawn copy, "Dəvət linki kopyalandı · <link>".
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { shareOrCopy } from '@/core/lib/clipboard';
import { Copy, Share2 } from '@/shared/lucide';
import { Button, Modal, toast } from '@/shared/ui';

import type { GroupDeal } from '../data/models/group-deal';

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: GroupDeal;
}

/**
 * `shareOrCopy()` + the drawn snackbar copy. Also used by the page header's `Dəvət et`, which
 * exists before the deal has loaded — hence a plain string rather than a deal.
 */
export function useShareInvite(inviteLink: string): {
  share: () => Promise<void>;
  busy: boolean;
} {
  const t = useTranslations('group_buy');
  const [busy, setBusy] = useState(false);

  const share = async () => {
    if (!inviteLink) return;
    setBusy(true);
    try {
      const outcome = await shareOrCopy({
        title: t('share.title'),
        text: t('share.body'),
        url: inviteLink,
      });
      if (outcome === 'copied') {
        toast.success({ title: t('share.copied', { link: inviteLink }) });
      } else if (outcome === 'shared') {
        toast.success({ title: t('share.shared') });
      } else {
        toast.error({ title: t('share.failed') });
      }
    } finally {
      setBusy(false);
    }
  };

  return { share, busy };
}

export function ShareDialog({ open, onOpenChange, deal }: ShareDialogProps) {
  const t = useTranslations('group_buy');
  const { share, busy } = useShareInvite(deal.inviteLink);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('share.title')}
      description={t('share.body')}
      size="s"
      closeLabel={t('close')}
      footer={
        <>
          <Button
            variant="primary"
            fullWidth
            loading={busy}
            leadingIcon={<Share2 size={20} aria-hidden="true" />}
            onClick={() => {
              void share().then(() => onOpenChange(false));
            }}
          >
            {t('share.copy')}
          </Button>
          <Button variant="soft" fullWidth onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
        </>
      }
    >
      <p className="flex items-center gap-2 break-all rounded-[16px] bg-surface2 px-4 py-3 text-caption text-ink2">
        <Copy size={16} aria-hidden="true" className="shrink-0" />
        <span>
          <span className="sr-only">{t('join.link')}: </span>
          {deal.inviteLink}
        </span>
      </p>
    </Modal>
  );
}
