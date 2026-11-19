'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

import { useGuestPrompt, type GuestPromptReason } from '@/core/session/use-session';
import { usePathname } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { Lock, type LucideIcon } from '@/shared/lucide';

import { StateButton } from './inline-notice';

/** `/login?next=<current route>` — the post-login return target. */
function useLoginHref(next?: string) {
  const pathname = usePathname();
  return `/login?next=${encodeURIComponent(next ?? pathname)}`;
}

/**
 * Copy is either a fixed node or a function of the store's `reason`
 * (`cart` | `favorite` | `checkout` | `card` | …), so the single instance
 * mounted in the shell can say why the prompt opened.
 */
export type GuestCopy = ReactNode | ((reason: GuestPromptReason) => ReactNode);

function resolveCopy(copy: GuestCopy, reason: GuestPromptReason): ReactNode {
  return typeof copy === 'function' ? copy(reason) : copy;
}

export type GuestPromptProps = {
  /** Already-localized: "Daxil ol və ya qeydiyyatdan keç". */
  title: GuestCopy;
  /** Already-localized body. */
  body?: GuestCopy;
  /** Already-localized primary label ("Daxil ol"). */
  primaryLabel: GuestCopy;
  /** Already-localized dismiss label ("Sonra"). Omit to hide it. */
  secondaryLabel?: GuestCopy;
  /** Controlled override, for the debug preview states. */
  open?: boolean;
  onClose?: () => void;
  /** Overrides the `next` route (defaults to the current path). */
  next?: string;
  className?: string;
};

/**
 * The modal `requireAuth()` opens when a guest tries an action that needs an
 * account (add to cart, favorite, checkout, card). Driven by the
 * `useGuestPrompt` store in `@/core/session/use-session`.
 *
 * Primary → `/login?next=<current>`; secondary just dismisses — the guest
 * stays exactly where they were.
 */
export function GuestPrompt({
  title,
  body,
  primaryLabel,
  secondaryLabel,
  open,
  onClose,
  next,
  className,
}: GuestPromptProps) {
  const prompt = useGuestPrompt();
  const loginHref = useLoginHref(next);

  const isOpen = open ?? prompt.open;
  const close = onClose ?? prompt.hide;
  const reason = prompt.reason;

  if (!isOpen) return null;

  return (
    <Dialog.Root
      open
      onOpenChange={(value) => {
        if (!value) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <Dialog.Content
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

          <Dialog.Title className="text-h4 font-bold text-ink">
            {resolveCopy(title, reason)}
          </Dialog.Title>

          {body ? (
            <Dialog.Description className="max-w-[360px] text-body-sm text-ink2">
              {resolveCopy(body, reason)}
            </Dialog.Description>
          ) : null}

          <StateButton variant="brand" block href={loginHref}>
            {resolveCopy(primaryLabel, reason)}
          </StateButton>

          {secondaryLabel ? (
            <StateButton variant="soft" block onClick={close}>
              {resolveCopy(secondaryLabel, reason)}
            </StateButton>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export type GuestGateProps = {
  /** Lucide icon for the chip (qr-code for the card, package for orders…). */
  icon?: LucideIcon;
  /** Already-localized title ("Ozio kartı"). */
  title: ReactNode;
  /** Already-localized body. */
  body?: ReactNode;
  /** Already-localized CTA label ("Daxil ol"). */
  actionLabel?: ReactNode;
  /** Replaces the built-in CTA entirely. */
  action?: ReactNode;
  /** Overrides the `next` route (defaults to the current path). */
  next?: string;
  className?: string;
};

/**
 * The whole-screen guest variant: `/card` and `/orders` for a guest show this
 * **locked card**, not an error (states-catalog.md §1.5).
 *
 * `surface` r28 + 1px `line`, padding 28, icon chip 52, title 22/700, a lock
 * glyph on the right and the CTA to `/login?next=<current>`.
 */
export function GuestGate({
  icon: Icon,
  title,
  body,
  actionLabel,
  action,
  next,
  className,
}: GuestGateProps) {
  const loginHref = useLoginHref(next);

  return (
    <section
      className={cn(
        'flex w-full flex-col justify-center gap-3 rounded-xl border border-line bg-surface p-7',
        className,
      )}
    >
      <div className="flex w-full flex-row items-center gap-[14px]">
        {Icon ? (
          <span
            aria-hidden="true"
            className="flex size-[52px] shrink-0 items-center justify-center rounded-[16px] bg-brand-soft"
          >
            <Icon size={24} className="text-brand" />
          </span>
        ) : null}
        <h2 className="min-w-0 flex-1 text-[22px] font-bold text-ink">{title}</h2>
        <Lock aria-hidden="true" size={20} className="shrink-0 text-ink3" />
      </div>

      {body ? <p className="max-w-[420px] text-body-sm text-ink2">{body}</p> : null}

      {action ??
        (actionLabel ? (
          <StateButton variant="primary" size={46} href={loginHref}>
            {actionLabel}
          </StateButton>
        ) : null)}
    </section>
  );
}
