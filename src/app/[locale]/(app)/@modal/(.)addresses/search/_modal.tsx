'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Modal } from '@/shared/ui';
import { AddressSearchView } from '@/modules/address/view/AddressSearchView';

export function AddressSearchModal() {
  const t = useTranslations('address');
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    router.back();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title={t('search.title')}
      description={t('search.modalDescription')}
      size="m"
      closeLabel={t('closeModal')}
    >
      <AddressSearchView inModal onClose={close} />
    </Modal>
  );
}
