'use client';

/**
 * The hub's three service tiles (`kuryer-xidmetleri-hub.html`): dark / brand / white, radius 36,
 * padding 32, 64 icon tile, 26/800 title, 15/400 one-liner, a 48 pill CTA pinned to the bottom.
 *
 * `<CourierServicesEntry>` is the small version other modules place to reach the hub; it is
 * exported from this module's `index.ts` so nobody has to reach inside.
 */
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ArrowRight, type LucideIcon } from '@/shared/lucide';

import { useCourierShopEnabled } from '../courier_shop.flags';
import { SERVICE_ICON } from './icons';

export type ServiceTone = 'block' | 'brand' | 'surface';

const TONE: Record<ServiceTone, { card: string; title: string; body: string; chip: string; glyph: string }> = {
  block: {
    card: 'bg-block',
    title: 'text-on-block',
    body: 'text-on-block/80',
    chip: 'bg-white/[0.12]',
    glyph: 'text-on-block',
  },
  brand: {
    card: 'bg-brand',
    title: 'text-white',
    body: 'text-white/80',
    chip: 'bg-white/[0.12]',
    glyph: 'text-white',
  },
  surface: {
    card: 'bg-surface',
    title: 'text-ink',
    body: 'text-ink2',
    chip: 'bg-brand-soft',
    glyph: 'text-brand',
  },
};

/** The CTA pill: brand on the dark/white tiles, `cta` on the brand tile (as drawn). */
const CTA: Record<ServiceTone, string> = {
  block: 'bg-brand text-on-cta hover:bg-brand-dark',
  brand: 'bg-cta text-on-cta hover:opacity-90',
  surface: 'bg-brand text-on-cta hover:bg-brand-dark',
};

export interface ServiceTileProps {
  icon: LucideIcon;
  title: string;
  body: string;
  cta: string;
  href: string;
  tone?: ServiceTone;
  /** Renders a non-interactive tile (a package that is not built / flagged off). */
  disabled?: boolean;
  disabledNote?: ReactNode;
}

export function ServiceTile({
  icon: Icon,
  title,
  body,
  cta,
  href,
  tone = 'block',
  disabled = false,
  disabledNote,
}: ServiceTileProps) {
  const look = TONE[tone];

  return (
    <div
      className={cn(
        'flex w-full flex-1 flex-col items-start gap-4 rounded-bento p-8',
        look.card,
        disabled && 'opacity-60',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('flex size-16 shrink-0 items-center justify-center rounded-lg', look.chip)}
      >
        <Icon size={30} className={look.glyph} />
      </span>
      <h3 className={cn('m-0 text-[26px] font-extrabold leading-tight', look.title)}>{title}</h3>
      <p className={cn('m-0 text-body-sm leading-[23px]', look.body)}>{body}</p>
      <div className="flex-1" />
      {disabled ? (
        <span
          className={cn(
            'inline-flex h-12 cursor-not-allowed items-center gap-2 rounded-pill px-6 text-body-sm font-bold',
            CTA[tone],
          )}
          aria-disabled="true"
        >
          {cta}
        </span>
      ) : (
        <Link
          href={href}
          className={cn(
            'inline-flex h-12 items-center gap-2 rounded-pill px-6 text-body-sm font-bold transition-colors',
            CTA[tone],
          )}
        >
          {cta}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      )}
      {disabledNote}
    </div>
  );
}

/**
 * The entry tile another module places to reach `/courier-services`.
 *
 * Renders nothing when `courierShop` is off, so a caller needs no flag check of its own.
 */
export function CourierServicesEntry({ className }: { className?: string }) {
  const enabled = useCourierShopEnabled();
  const t = useTranslations('courier_shop');

  if (!enabled) return null;

  return (
    <Link
      href={paths.courierServices}
      className={cn(
        'flex w-full flex-row items-center gap-4 rounded-card bg-block p-5 text-on-block',
        'transition-opacity hover:opacity-95',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-md bg-white/[0.12]"
      >
        <SERVICE_ICON.bag size={24} className="text-on-block" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body font-extrabold">{t('hub.title')}</span>
        <span className="text-label text-on-block/75">{t('entry.body')}</span>
      </span>
      <ArrowRight size={20} aria-hidden="true" className="shrink-0 text-on-block" />
    </Link>
  );
}
