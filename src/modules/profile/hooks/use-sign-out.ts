'use client';

/**
 * The sign-out confirmation (`app-cixis-tesdiqi.html`) + the sign-out itself.
 *
 * `useSession().signOut()` POSTs `/api/auth/logout` (the BFF route that clears the httpOnly
 * cookies and best-effort calls `POST v1/auth/logout`, which is unverified) and then clears the
 * client session **even if the round trip failed**. The query cache is dropped by the sign-out
 * listener registered in `@/core/query/providers`.
 */
import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { useSession } from '@/core/session';
import { confirmDialog } from '@/shared/ui';

import { maskPhone } from '../data/models/profile';

export interface UseSignOutResult {
  /** Opens the confirm dialog and signs out when it is accepted. */
  signOut(): Promise<void>;
  busy: boolean;
}

export function useSignOut(phone?: string | null): UseSignOutResult {
  const t = useTranslations('profile');
  const router = useRouter();
  const doSignOut = useSession((s) => s.signOut);
  const [busy, setBusy] = useState(false);

  const signOut = useCallback(async () => {
    const masked = maskPhone(phone);
    const confirmed = await confirmDialog({
      title: t('logout.title'),
      body: masked ? t('logout.body', { phone: masked }) : t('logout.bodyNoPhone'),
      confirmLabel: t('logout.confirm'),
      cancelLabel: t('cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await doSignOut();
      router.replace(paths.login);
    } finally {
      setBusy(false);
    }
  }, [doSignOut, phone, router, t]);

  return { signOut, busy };
}
