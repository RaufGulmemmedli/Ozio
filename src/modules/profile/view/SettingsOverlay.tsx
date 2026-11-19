'use client';

/**
 * `/settings` as the intercepted overlay (`(app)/@modal/(.)settings`): a modal from 768 up, the
 * bottom sheet below it (docs/ROUTES.md — layout "modal (sheet on mobile)").
 *
 * Dismissing goes `router.back()`, which unmounts the intercepted slot and leaves the page the
 * user came from untouched. A direct hit never reaches this component: `@modal/default.tsx`
 * renders `null` and the full page below takes over.
 */
import { useTranslations } from 'next-intl';

import { useIsMobile } from '@/core/lib/use-breakpoint';
import { useRouter } from '@/core/i18n/navigation';
import { Modal, Sheet } from '@/shared/ui';

import { SettingsContent } from './SettingsContent';

export function SettingsOverlay() {
  const t = useTranslations('settings');
  const router = useRouter();
  const isMobile = useIsMobile();

  const close = (open: boolean) => {
    if (!open) router.back();
  };

  const body = <SettingsContent variant="compact" />;

  if (isMobile) {
    return (
      <>
        <Sheet
          open
          onOpenChange={close}
          title={t('title')}
          description={t('subtitle')}
          size="lg"
          closeLabel={t('close')}
          bodyClassName="pb-6"
        >
          {body}
        </Sheet>
      </>
    );
  }

  return (
    <>
      <Modal
        open
        onOpenChange={close}
        title={t('title')}
        description={t('subtitle')}
        size="l"
        closeLabel={t('close')}
      >
        {body}
      </Modal>
    </>
  );
}
