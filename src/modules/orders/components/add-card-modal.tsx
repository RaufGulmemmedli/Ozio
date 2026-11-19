'use client';

/**
 * `/checkout/add-card` as an intercepted modal (layout `modal` in ROUTES.md). Closing it goes back
 * to `/checkout/payment` and re-reads the cards list, because the bank page may have added one.
 */
import { useTranslations } from 'next-intl';
import { useRouter } from '@/core/i18n';
import { Modal } from '@/shared/ui';
import { useRefreshCards } from '../hooks/use-saved-cards';
import { AddCardView } from '../view/AddCardView';

export function AddCardModal() {
  const t = useTranslations('payment');
  const router = useRouter();
  const refresh = useRefreshCards();

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (open) return;
        refresh();
        router.back();
      }}
      size="l"
      title={t('newCard.title')}
      description={t('newCard.subtitle')}
      closeLabel={t('newCard.close')}
    >
      <AddCardView inModal />
    </Modal>
  );
}
