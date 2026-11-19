import { getTranslations } from 'next-intl/server';

import { NotificationsSkeleton } from '@/modules/home';

/** Route-level fallback for `/notifications`: bone rows mirroring the inbox list. */
export default async function NotificationsLoading() {
  const t = await getTranslations('notifications');
  return <NotificationsSkeleton label={t('loading')} />;
}
