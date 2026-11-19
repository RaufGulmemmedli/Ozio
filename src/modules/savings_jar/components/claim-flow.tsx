'use client';

/**
 * The 3-step claim flow: the yellow banner on the page, the confirm modal
 * (`savings-jar-claim-modal.html`) and the brand success modal
 * (`savings-jar-claim-success.html`).
 *
 * Focus: both steps are Radix dialogs via `<Modal>`, so focus is trapped while they are open and
 * restored to the trigger when they close. The success modal takes over from the confirm modal in
 * the same flow, which is why the confirm closes first and the success opens from the mutation's
 * `onSuccess`.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Gift, Trophy } from '@/shared/lucide';
import { Button } from '@/shared/ui';
import { Modal } from '@/shared/ui';

export interface ClaimBannerProps {
  balance: number;
  bonus: number;
  onClaim: () => void;
  busy: boolean;
}

export function ClaimBanner({ balance, bonus, onClaim, busy }: ClaimBannerProps) {
  const t = useTranslations('savings_jar');
  const format = useFormat();

  return (
    <section className="flex w-full flex-col items-start gap-5 rounded-bento bg-yellow p-6 md:flex-row md:items-center md:p-7">
      <span
        aria-hidden="true"
        className="flex size-[72px] shrink-0 items-center justify-center rounded-pill bg-block text-on-block"
      >
        <Gift size={34} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-h3 font-extrabold text-on-yellow md:text-[26px]">
          {t('claim.banner.title')}
        </h2>
        <p className="text-body-sm text-on-yellow">
          {t('claim.banner.body', {
            balance: format.money(balance),
            bonus: `+${format.money(bonus)}`,
          })}
        </p>
      </div>

      <button
        type="button"
        onClick={onClaim}
        disabled={busy}
        className={cn(
          'flex h-14 w-full shrink-0 items-center justify-center rounded-pill bg-block px-8',
          'text-body font-extrabold text-on-block disabled:opacity-70 md:w-fit',
        )}
      >
        {t('claim.banner.cta')}
      </button>
    </section>
  );
}

export interface ClaimConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bonus: number;
  onConfirm: () => void;
  busy: boolean;
  /** Shown under the body when the claim failed. */
  error?: string | null;
}

export function ClaimConfirmModal({
  open,
  onOpenChange,
  bonus,
  onConfirm,
  busy,
  error,
}: ClaimConfirmModalProps) {
  const t = useTranslations('savings_jar');
  const format = useFormat();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('claim.modal.title')}
      titleHidden
      hideClose
      size="s"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="flex size-[88px] items-center justify-center rounded-pill bg-yellow"
        >
          <Gift size={40} className="text-on-yellow" />
        </span>

        <p className="text-h2 font-extrabold text-ink">{t('claim.modal.title')}</p>
        <p className="max-w-[408px] text-body-sm text-ink2">
          {t('claim.modal.body', { bonus: `+${format.money(bonus)}` })}
        </p>

        {error ? (
          <p role="alert" className="text-caption text-brand">
            {error}
          </p>
        ) : null}

        <Button variant="primary" size="2xl" fullWidth loading={busy} onClick={onConfirm}>
          {t('claim.modal.confirm')}
        </Button>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={busy}
          className="flex h-11 w-full items-center justify-center text-body-sm font-bold text-ink2 hover:text-ink disabled:opacity-60"
        >
          {t('claim.modal.cancel')}
        </button>
      </div>
    </Modal>
  );
}

export interface ClaimSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bonus: number;
}

export function ClaimSuccessModal({ open, onOpenChange, bonus }: ClaimSuccessModalProps) {
  const t = useTranslations('savings_jar');
  const format = useFormat();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('claim.success.title')}
      titleHidden
      hideClose
      size="s"
      className="bg-brand"
    >
      {/*
        `.modalPanel` paints `--oz-surface`; this layer paints the brand panel underneath the
        content instead of relying on which stylesheet wins. It is positioned against the fixed
        panel, so it covers the panel's own padding too.
      */}
      <span
        aria-hidden="true"
        className="absolute inset-0 z-0 rounded-t-xl bg-brand md:rounded-modal"
      />

      <div className="relative z-10 flex flex-col items-center gap-3.5 py-2 text-center">
        <span
          aria-hidden="true"
          className="flex size-24 items-center justify-center rounded-pill bg-yellow"
        >
          <Trophy size={44} className="text-on-yellow" />
        </span>

        <p className="text-h2 font-extrabold text-white">{t('claim.success.title')}</p>
        <p
          aria-live="polite"
          className="text-[48px] font-extrabold leading-none tracking-[-0.04em] text-white md:text-[64px]"
        >
          +{format.money(bonus)}
        </p>
        <p className="max-w-[400px] text-body-sm text-white">
          {t('claim.success.body', { bonus: format.money(bonus) })}
        </p>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="mt-1 flex h-14 w-full items-center justify-center rounded-pill bg-white text-body font-extrabold text-brand-dark"
        >
          {t('claim.success.ok')}
        </button>
      </div>
    </Modal>
  );
}
