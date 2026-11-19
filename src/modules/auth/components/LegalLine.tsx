'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n';
import { paths } from '@/core/routes';

const LINK =
  'font-semibold text-ink underline decoration-line underline-offset-2 ' +
  'transition-colors duration-[var(--oz-dur-fast)] hover:decoration-ink ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

/**
 * "Davam etməklə İstifadə şərtləri və Məxfilik siyasəti ilə razılaşırsan."
 * (`giris.html` `q1dQq`: 13/400 `ink3`, line-height 20, centred.)
 *
 * next-intl's `t.rich` keeps the two links inside one translatable sentence, so ru/en can put
 * them anywhere in the clause.
 */
export function LegalLine({ className }: { className?: string }) {
  const t = useTranslations('auth');

  return (
    <p className={`w-full text-center text-caption font-normal leading-5 text-ink3 ${className ?? ''}`}>
      {t.rich('login.legal', {
        terms: (chunks) => (
          <Link href={paths.terms} className={LINK}>
            {chunks}
          </Link>
        ),
        privacy: (chunks) => (
          <Link href={paths.privacy} className={LINK}>
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}
