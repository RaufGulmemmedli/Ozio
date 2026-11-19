'use client';

/**
 * The "Dostunu gətir" entry point, exported from this module's `index.ts` so the profile page
 * (agent M10) and home can place it without reaching inside this module. It hides itself when
 * `NEXT_PUBLIC_FEATURE_REFERRAL` is off, so no caller needs a `<FlagGate>`.
 *
 * `banner` is the brand-pink variant the screen spec calls the profile entry ("entry = profile
 * banner 'Dostunu gətir'"); `tile` is the neutral `surface` row for a menu list.
 */
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ChevronRight, Gift } from '@/shared/lucide';

import { referralEnabled } from '../profile_referral.flags';

export interface ReferralEntryTileProps {
  variant?: 'banner' | 'tile';
  className?: string;
}

export function ReferralEntryTile({ variant = 'banner', className }: ReferralEntryTileProps) {
  const t = useTranslations('referral');

  if (!referralEnabled()) return null;

  const banner = variant === 'banner';

  return (
    <Link
      href={paths.invite}
      className={cn(
        'group flex w-full flex-row items-center gap-4 rounded-card p-5',
        'transition-transform duration-[var(--oz-dur-base)] ease-out hover:-translate-y-0.5',
        banner ? 'bg-brand' : 'bg-surface',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-pill',
          banner ? 'bg-white/20 text-white' : 'bg-brand-soft text-brand',
        )}
      >
        <Gift size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className={cn('text-body font-bold', banner ? 'text-white' : 'text-ink')}>
          {t('tile.title')}
        </span>
        <span className={cn('text-caption', banner ? 'text-white/80' : 'text-ink2')}>
          {t('tile.body')}
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        size={20}
        className={cn('shrink-0', banner ? 'text-white/80' : 'text-ink3 group-hover:text-ink')}
      />
    </Link>
  );
}
