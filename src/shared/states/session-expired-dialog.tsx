'use client';

import { useCallback, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';

import { useSession } from '@/core/session';
import { usePathname, useRouter } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { Lock } from '@/shared/lucide';

import { StateButton } from './inline-notice';

export type SessionExpiredDialogProps = {
  /** Overrides `common.sessionExpired.title`. */
  title?: ReactNode;
  /** Overrides `common.sessionExpired.body`. */
  body?: ReactNode;
  /** Overrides `common.signIn` ("Daxil ol"). */
  signInLabel?: ReactNode;
  /**
   * Optional second action from the export ("Qonaq kimi davam et"). Omitted by
   * default: the documented dialog has a single action.
   */
  secondaryAction?: ReactNode;
  /** Controlled override, for the debug preview states. */
  open?: boolean;
  className?: string;
};

/**
 * Blocking modal driven by `useSession().expired` (401 after a failed
 * refresh). It cannot be dismissed — ESC and outside clicks are swallowed —
 * and its single action signs out and sends the user to `/login?next=<here>`
 * so the intended route survives the round trip.
 *
 * This is the one component in the package allowed to read `common.*` keys
 * (`sessionExpired.title`, `sessionExpired.body`, `signIn`).
 */
export function SessionExpiredDialog({
  title,
  body,
  signInLabel,
  secondaryAction,
  open,
  className,
}: SessionExpiredDialogProps) {
  const t = useTranslations('common');
  const { expired, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const isOpen = open ?? expired;

  const handleSignIn = useCallback(async () => {
    setBusy(true);
    try {
      await signOut();
    } catch {
      // Signing out is best-effort — the user must still reach /login.
    }
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router, signOut]);

  if (!isOpen) return null;

  const heading = title ?? (t.has('sessionExpired.title') ? t('sessionExpired.title') : null);
  const text = body ?? (t.has('sessionExpired.body') ? t('sessionExpired.body') : null);
  const cta = signInLabel ?? (t.has('signIn') ? t('signIn') : null);

  return (
    <Dialog.Root open modal>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <Dialog.Content
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex w-[min(460px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2',
            'flex-col items-center gap-4 rounded-bento bg-surface p-10 text-center shadow-modal',
            className,
          )}
        >
          <div
            aria-hidden="true"
            className="flex size-[88px] shrink-0 items-center justify-center rounded-pill bg-brand-soft"
          >
            <Lock size={40} className="text-brand" />
          </div>

          <Dialog.Title className="text-[26px] font-bold leading-tight text-ink">
            {heading}
          </Dialog.Title>

          {text ? (
            <Dialog.Description className="max-w-[360px] text-body-sm text-ink2">
              {text}
            </Dialog.Description>
          ) : null}

          <StateButton variant="primary" block autoFocus loading={busy} onClick={handleSignIn}>
            {cta}
          </StateButton>

          {secondaryAction}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
