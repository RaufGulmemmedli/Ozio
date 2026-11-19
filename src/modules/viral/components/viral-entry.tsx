'use client';

/**
 * The module's **entry points for other modules**.
 *
 * `08-feature-flags-mocks.md` / the screen spec put viral behind an Əsas (home) strip and a Profil
 * row, so both are exported from `index.ts` and are the only viral components another module
 * should render. Neither reaches into `view/` or `hooks/` from outside.
 *
 * Both hide themselves when the flag is off (entry-level gating, the counterpart to the route
 * guard) and both carry the compact "Demo rejim" chip, so the strip is honest before it is tapped.
 */
import { useTranslations } from 'next-intl';

import { FeatureFlags } from '@/core/config';
import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ChevronRight, Gift } from '@/shared/lucide';
import { DemoBanner } from '@/shared/states';

import { useAuctions } from '../hooks/use-auctions';
import { GiftThumb } from './gift-thumb';
import { Radio, TrendingDown } from './icons';

/** Profil → "Daha çox" row. */
export function ViralProfileEntry({ className }: { className?: string }) {
  const t = useTranslations('viral');
  if (!FeatureFlags.viral) return null;

  return (
    <Link
      href={paths.viral}
      className={cn(
        'flex w-full flex-row items-center gap-4 rounded-card bg-surface px-5 py-4 transition-colors duration-[var(--oz-dur-fast)] hover:bg-surface2',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-soft"
      >
        <Gift size={22} className="text-brand" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body font-bold text-ink">{t('hub.title')}</span>
        <span className="text-caption text-ink2">{t('hub.subtitle')}</span>
      </span>
      <DemoBanner module="viral" compact />
      <ChevronRight size={20} aria-hidden="true" className="shrink-0 text-ink3" />
    </Link>
  );
}

/**
 * The home strip: the **live auction tile** the home screen places.
 *
 * It reads this module's own hook, so the host screen needs no query of its own, and it renders
 * nothing at all when there is no live auction — a home screen should not show a dead tile. The
 * price it shows is the server's; it is never ticked locally here (the tile is a link, and the
 * live screen is where the clock belongs).
 */
export function ViralLiveAuctionTile({ className }: { className?: string }) {
  const t = useTranslations('viral');
  const { money } = useFormat();
  const auctions = useAuctions();

  if (!FeatureFlags.viral) return null;

  const live = auctions.items.find((auction) => auction.status === 'live');
  if (!live) return null;

  return (
    <Link
      href={paths.viralAuction(live.id)}
      className={cn(
        'flex w-full flex-row items-center gap-5 rounded-bento bg-yellow p-6',
        'transition-transform duration-[var(--oz-dur-fast)] ease-out hover:-translate-y-0.5',
        className,
      )}
    >
      <GiftThumb icon={live.icon} size={64} tone="white" radiusClassName="rounded-card" />

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-row items-center gap-2">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-pill bg-brand-soft px-2 text-nano font-bold text-brand">
            <Radio size={12} aria-hidden="true" />
            {t('auctions.live')}
          </span>
          <span className="text-caption font-bold text-on-yellow/80">{t('hub.game.title')}</span>
        </span>
        <span className="truncate text-body font-extrabold text-on-yellow">{live.title}</span>
        <span className="text-caption text-on-yellow/80">
          {t('auction.tileMeta', {
            price: money(live.currentPrice),
            stock: live.stockLeft,
          })}
        </span>
      </span>

      <TrendingDown size={24} aria-hidden="true" className="shrink-0 text-on-yellow" />
      <DemoBanner module="viral" compact />
    </Link>
  );
}
