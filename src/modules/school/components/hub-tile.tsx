'use client';

/**
 * One of SC1's three tiles.
 *
 * Measured from `sc1-school-hub.html`: radius 36 (`rounded-bento`), fixed 340 high at ≥1200,
 * padding 32, gap 16, a 64×64 `#FFFFFF33` icon chip at radius 20, title 28/800, body 15/400,
 * a 15/800 meta line and a 48×48 white circle with `arrow-right` pinned bottom-right.
 *
 * The three fills are `brand` / `yellow` / `block`, so the tile only needs a tone name; the
 * foreground token pairs come from `globals.css` and are therefore correct in both themes.
 */
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { ArrowRight, type LucideIcon } from '@/shared/lucide';

export type HubTileTone = 'brand' | 'yellow' | 'block';

const TONE: Record<HubTileTone, { card: string; text: string; sub: string; arrow: string }> = {
  brand: { card: 'bg-brand', text: 'text-white', sub: 'text-white/85', arrow: 'text-brand' },
  yellow: {
    card: 'bg-yellow',
    text: 'text-on-yellow',
    sub: 'text-on-yellow/80',
    arrow: 'text-on-yellow',
  },
  block: {
    card: 'bg-block',
    text: 'text-on-block',
    sub: 'text-on-block2',
    arrow: 'text-block',
  },
};

export interface HubTileProps {
  href: string;
  tone: HubTileTone;
  icon: LucideIcon;
  title: string;
  body: string;
  /** The 15/800 status line — "52 xal", "1 siyahı", "Bağlı deyil". */
  meta: string;
}

export function HubTile({ href, tone, icon: Icon, title, body, meta }: HubTileProps) {
  const t = useTranslations('school');
  const palette = TONE[tone];

  return (
    <Link
      href={href}
      className={cn(
        'group flex min-h-[260px] flex-col justify-between gap-4 rounded-bento p-8 lg:min-h-[340px]',
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
