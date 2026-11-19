'use client';

/**
 * The intercepted `(.)coupons/[id]` route: the same detail view inside a modal L (760)
 * at ≥768, and the shared `<Modal>` renders itself as a full-width bottom sheet below
 * that — which is the "modal ≥768 / full" rule for this screen.
 *
 * Closing goes `router.back()` so the list underneath keeps its scroll position; a
 * direct hit never reaches here (`@modal/default.tsx` renders `null`).
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useRouter } from '@/core/i18n/navigation';
import { Modal } from '@/shared/ui';

import { CouponDetailView } from './CouponDetailView';

export function CouponModal({ id }: { id: string }) {
  const t = useTranslations('coupons');
  const tc = useTranslations('common');
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) router.back();
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      size="l"
      title={t('detail.title')}
      titleHidden
      closeLabel={tc('close')}
      bodyClassName="p-0"
    >
      <CouponDetailView id={id} variant="modal" />
    </Modal>
  );
}
