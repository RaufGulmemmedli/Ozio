'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Modal } from '@/shared/ui';
import { AddressFormView } from '@/modules/address/view/AddressFormView';

/**
 * The modal shell for `/addresses/new`. Closing it calls `router.back()`, so the URL returns to
 * whatever was underneath (normally `/addresses`).
 */
export function AddressNewModal() {
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
      title={t('new')}
      description={t('form.modalDescription')}
      size="m"
      closeLabel={t('closeModal')}
    >
      <AddressFormView inModal onClose={close} />
    </Modal>
  );
}
