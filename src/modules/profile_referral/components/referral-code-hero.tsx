'use client';

/**
 * The pink code hero on `/invite` (`referral.html` → `Code Hero`).
 *
 * Measured: `brand` fill, radius 36 (`rounded-bento`), padding 40, gap 20; the label is 15/600
 * white at 85% opacity; the code is 56/800 with 2px letter-spacing; the actions are two 52-high
 * pills — "Kopyala" is white with `brand` text, "Paylaş" is `#00000033` with white text.
 *
 * The code itself is read-only text, never an input: there is nothing to type here.
 * Share uses `navigator.share` and falls back to a clipboard copy plus a toast.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Check, Copy, Share2 } from '@/shared/lucide';

export interface ReferralCodeHeroProps {
  code: string;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  className?: string;
}

export function ReferralCodeHero({
  code,
  copied,
  onCopy,
  onShare,
  className,
}: ReferralCodeHeroProps) {
  const t = useTranslations('referral');

  return (
    <section
      className={cn(
        'flex w-full shrink-0 flex-col items-start gap-5 rounded-bento bg-brand p-6 md:p-10',
        className,
      )}
    >
      <p className="text-body-sm font-semibold text-white opacity-85">{t('code.label')}</p>

      {/* The code is the screen's headline; `aria-label` spells it out so it is not read as one
          run-together word. */}
      <p
        aria-label={t('code.aria', { code })}
        className="w-full break-all text-h2 font-extrabold tracking-[2px] text-white md:text-[56px]"
      >
        {code}
      </p>

      <div className="flex w-full flex-col items-stretch gap-3 sm:w-fit sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onCopy}
          className={cn(
            'flex h-[52px] flex-row items-center justify-center gap-[10px] rounded-pill bg-white px-7',
            'text-body-sm font-bold text-brand transition-transform duration-[var(--oz-dur-fast)] ease-out',
            'active:scale-[.98]',
          )}
        >
          {copied ? (
            <Check aria-hidden="true" size={18} className="shrink-0" />
          ) : (
            <Copy aria-hidden="true" size={18} className="shrink-0" />
          )}
          {copied ? t('code.copied') : t('code.copy')}
        </button>

        <button
          type="button"
          onClick={onShare}
          aria-label={t('code.shareAria')}
          className={cn(
            // The export paints this `#00000033`; `block` is the design's darkest token in both themes.
            'flex h-[52px] flex-row items-center justify-center gap-[10px] rounded-pill bg-block/20 px-7',
            'text-body-sm font-bold text-white transition-[background-color,transform] duration-[var(--oz-dur-fast)] ease-out',
            'hover:bg-block/30 active:scale-[.98]',
          )}
        >
          <Share2 aria-hidden="true" size={18} className="shrink-0" />
          {t('code.share')}
        </button>
      </div>
    </section>
  );
}
