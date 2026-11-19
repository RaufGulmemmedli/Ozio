'use client';

/**
 * "Apple Wallet-a əlavə et" / "Google Wallet-a əlavə et" — node `Idaf2` in
 * `app-card-bonus.html`: a row of two `cta`-filled pills, `flex: 1 1 0`,
 * height 52, gap 12, 18px `wallet` glyph + 14/600 label.
 *
 * What the API actually supports (api/payment.md):
 *  - **Google**: `GET v1/wallet/google` (verified) answers a bare `{ url }`; the
 *    url is a `pay.google.com` save link and is only usable on a phone, so the
 *    button appears on Android / iOS only.
 *  - **Apple**: no endpoint exists. The button appears on Apple platforms and
 *    points at the mobile app; nothing here fabricates a `.pkpass`.
 *
 * On a desktop browser neither wallet can hold the pass, so the row collapses
 * to a single honest link to the app.
 */
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { Link, useFailureMessage } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Wallet } from '@/shared/lucide';
import { Button, toast } from '@/shared/ui';

import { useWalletLink } from '../hooks/use-wallet-link';

export interface WalletButtonsProps {
  className?: string;
}

export function WalletButtons({ className }: WalletButtonsProps) {
  const t = useTranslations('loyalty_card');
  const failureMessage = useFailureMessage();
  const { canGoogle, canApple, appleHref, openGoogleWallet, isPending, error } = useWalletLink();

  useEffect(() => {
    if (!error) return;
    toast.error({
      id: 'loyalty-wallet-error',
      title: t('wallet.googleError'),
      body: failureMessage(error),
    });
    // `failureMessage`/`t` are stable per locale; the toast fires once per failure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return (
    <div className={cn('flex w-full flex-row flex-wrap gap-3', className)}>
      {canApple ? (
        <Button
          as="a"
          href={appleHref}
          variant="primary"
          size="xl"
          className="flex-1 basis-[200px]"
          leadingIcon={<Wallet size={18} aria-hidden="true" />}
        >
          {t('wallet.apple')}
        </Button>
      ) : null}

      {canGoogle ? (
        <Button
          variant="primary"
          size="xl"
          className="flex-1 basis-[200px]"
          loading={isPending}
          onClick={openGoogleWallet}
          leadingIcon={<Wallet size={18} aria-hidden="true" />}
        >
          {t('wallet.google')}
        </Button>
      ) : null}

      {!canApple && !canGoogle ? (
        <div className="flex w-full flex-col gap-2 rounded-xl border border-line bg-surface p-5">
          <p className="m-0 text-body font-bold text-ink">{t('wallet.appleInApp.title')}</p>
          <p className="m-0 text-body-sm text-ink2">{t('wallet.appleInApp.body')}</p>
          <Link
            href={appleHref}
            className="w-fit rounded-sm text-body-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            {t('wallet.appleInApp.cta')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
