'use client';

/**
 * One of V1's three feature tiles (`v1-viral-hub.html`).
 *
 * Measured: radius 36, 360 high at ≥1200, padding 32, a 64×64 `#FFFFFF33` chip at radius 20, title
 * 28/800, body 15/400, a 15/800 counter line and a 48×48 white circle with `arrow-right`.
 * Fills: `brand` (gift wishlists) / `yellow` (price-drop game) / `block` (receipt scanner).
 */
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { ArrowRight, type LucideIcon } from '@/shared/lucide';

export type FeatureTileTone = 'brand' | 'yellow' | 'block';

const TONE: Record<FeatureTileTone, { card: string; text: string; sub: string; arrow: string }> = {
  brand: { card: 'bg-brand', text: 'text-white', sub: 'text-white/85', arrow: 'text-brand' },
  yellow: {
    card: 'bg-yellow',
    text: 'text-on-yellow',
    sub: 'text-on-yellow/80',
    arrow: 'text-on-yellow',
  },
  block: { card: 'bg-block', text: 'text-on-block', sub: 'text-on-block2', arrow: 'text-block' },
};

export interface FeatureTileProps {
  href: string;
  tone: FeatureTileTone;
  icon: LucideIcon;
  title: string;
  body: string;
  /** The counter line — "2 kampaniya", "3 canlı", "Skan et". */
  meta: string;
}

export function FeatureTile({ href, tone, icon: Icon, title, body, meta }: FeatureTileProps) {
  const t = useTranslations('viral');
  const palette = TONE[tone];

  return (
    <Link
      href={href}
      className={cn(
        'group flex min-h-[280px] flex-col justify-between gap-5 rounded-bento p-8 lg:min-h-[360px]',
        'transition-transform duration-[var(--oz-dur-fast)] ease-out hover:-translate-y-0.5',
        palette.card,
      )}
    >
      <div className="flex w-full flex-col gap-4">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-white/20"
        >
          <Icon size={32} className={palette.text} />
        </span>
        <span className={cn('text-h3 font-extrabold lg:text-[28px]', palette.text)}>{title}</span>
        <span className={cn('text-body-sm', palette.sub)}>{body}</span>
      </div>

      <div className="flex w-full flex-row items-center justify-between gap-4">
        <span className={cn('text-body-sm font-extrabold', palette.text)}>{meta}</span>
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-white"
        >
          <ArrowRight size={20} className={palette.arrow} />
        </span>
        <span className="sr-only">{t('hub.open')}</span>
      </div>
    </Link>
  );
}
