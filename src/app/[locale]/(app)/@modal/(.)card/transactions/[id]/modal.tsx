'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/core/i18n';
import { TransactionDetailView } from '@/modules/loyalty_card';
import { Modal } from '@/shared/ui';

/**
 * The modal shell for the intercepted detail route. Closing it goes back, so
 * the underlying `/card` or `/card/transactions` page is restored rather than
 * re-pushed. Focus trap, Esc and focus restore come from `<Modal>`.
 */
export function TransactionDetailModal({ id }: { id: string }) {
  const t = useTranslations('loyalty_card');
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) router.back();
      }}
      title={t('detail.title')}
      size="l"
      closeLabel={t('cashier.close')}
    >
      <TransactionDetailView id={id} modal />
    </Modal>
  );
}
