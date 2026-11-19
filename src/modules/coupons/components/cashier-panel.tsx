'use client';

/**
 * "Kassada göstər" — the right-hand panel of `app-kupon-detali.html`.
 *
 * Measured: `block` fill, radius 36, padding 32, gap 20; title 24/700 `on-block`,
 * sub 14/400 `on-block2` max 300; a 244px white QR tile at radius 28; a 56-high
 * `white/12` code pill with the code at 20/700 and a copy button.
 *
 * `is_qr` decides the tile: `true` → a QR of the code; `false` (all seven live coupons
 * on 2026-11-12) → the code itself, set large, because there is nothing to scan.
 *
 * The export's "Kod 04:52 dəqiqə ərzində etibarlıdır" countdown is **not** rendered:
 * it implies a short-lived redemption token and the API has no such endpoint, so a
 * client-side timer would be inventing server behaviour.
 */
import { useTranslations } from 'next-intl';

import { useCopyToClipboard } from '@/core/lib/clipboard';
import { cn } from '@/core/lib/cn';
import { Check, Copy } from '@/shared/lucide';
import { QrCodeView } from '@/shared/media';
import { toast } from '@/shared/ui';

export interface CashierPanelProps {
  code: string;
  isQr: boolean;
  /** Primary / secondary actions, rendered under the code pill. */
  children?: React.ReactNode;
  className?: string;
}

export function CashierPanel({ code, isQr, children, className }: CashierPanelProps) {
  const t = useTranslations('coupons');
  const tc = useTranslations('common');
  const { copied, copy } = useCopyToClipboard();

  async function handleCopy() {
    const ok = await copy(code);
    if (ok) toast.success(t('detail.codeCopied'));
    else toast.error(t('detail.codeCopyFailed'));
  }

  return (
    <section
      className={cn(
        'flex w-full flex-col items-center gap-5 rounded-bento bg-block p-6 text-center md:p-8',
        className,
      )}
    >
      <h2 className="text-h3 font-bold text-on-block">{t('detail.cashier.title')}</h2>
      <p className="max-w-[300px] text-label text-on-block2">
        {isQr ? t('detail.cashier.bodyQr') : t('detail.cashier.body')}
      </p>

      {code ? (
        isQr ? (
          <QrCodeView
            value={code}
            label={t('detail.qrLabel', { code })}
            size={244}
            className="max-w-full rounded-xl"
          />
        ) : (
          <div className="flex w-full items-center justify-center rounded-xl bg-white px-5 py-10">
            <span className="text-h2 leading-tight font-extrabold tracking-tight text-on-yellow break-all">
              {code}
            </span>
          </div>
        )
      ) : (
        <p className="text-body-sm text-on-block2">{t('detail.noCode')}</p>
      )}

      {code ? (
        <div className="flex h-14 w-full flex-row items-center justify-between gap-3 rounded-pill bg-white/12 px-[22px]">
          <span className="truncate text-h4 font-bold text-on-block">{code}</span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? tc('copied') : tc('copy')}
            className="flex size-11 shrink-0 items-center justify-center rounded-pill text-on-block transition-colors hover:bg-white/12"
          >
            {copied ? <Check size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}
          </button>
        </div>
      ) : null}

      {children ? <div className="flex w-full flex-col gap-3">{children}</div> : null}
    </section>
  );
}
