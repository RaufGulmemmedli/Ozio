/**
 * Ecosystem bento — node `n0vTGQ` rows `Row 1` / `Row 2` (components.md §5
 * "Bento blocks", layout.md §3).
 *
 * Desktop: two rows 360 high at gap 20; row 1 is Keşbek (640) + Market, row 2 is
 * 10-lar + Endirimlər (640). Card padding 36, radius 36, icon box 56 at r18,
 * kicker 13/700/+1.5, title 32/800/1.15/-0.5, text 16/24.
 * Tablet: two columns, rows 340 high at gap 16.
 * Mobile: stacked 350×171 cards at radius 28, padding 24.
 *
 * Each card is a link (`/cashback`, `/delivery`, `/ten`, `/offers/discounts`) with
 * the hover lift from components.md §5.
 */
import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import type { LucideIcon } from '@/shared/lucide';

import type { BentoTone } from '../content/landing';
import { brandText, typeBentoTitle, typeCardKicker } from './type';

export interface BentoEntry {
  id: string;
  tone: BentoTone;
  icon: LucideIcon;
  href: string;
  wide: boolean;
  kicker: string;
  title: string;
  text: string;
}

export interface BentoGridProps {
  items: BentoEntry[];
  className?: string;
}

const SURFACES: Record<BentoTone, string> = {
  brand: 'bg-brand',
  yellow: 'bg-yellow',
  block: 'bg-block',
  surface: 'bg-surface',
};

const ICON_BOX: Record<BentoTone, string> = {
  brand: 'bg-white/20 text-white',
  yellow: 'bg-on-yellow/12 text-on-yellow',
  block: 'bg-brand text-white',
  surface: `bg-brand-soft ${brandText}`,
};

const KICKER: Record<BentoTone, string> = {
  brand: 'text-white/85',
  yellow: 'text-on-yellow/70',
  block: 'text-on-block2',
  surface: 'text-ink2',
};

const TITLE: Record<BentoTone, string> = {
  brand: 'text-white',
  yellow: 'text-on-yellow',
  block: 'text-on-block',
  surface: 'text-ink',
};

const TEXT: Record<BentoTone, string> = {
  brand: 'text-white/85',
  yellow: 'text-on-yellow/70',
  block: 'text-on-block2',
  surface: 'text-ink2',
};

function BentoCard({ item }: { item: BentoEntry }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch={false}
      className={cn(
        'flex min-h-[171px] flex-col justify-between gap-5 rounded-xl p-6',
        'transition-transform duration-[var(--oz-dur-base)] ease-[var(--oz-ease-out)]',
        'hover:-translate-y-1 active:scale-[.99]',
        'md:min-h-[340px] md:rounded-bento md:p-9',
        'min-[1200px]:min-h-[360px]',
        SURFACES[item.tone],
      )}
    >
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-[14px] md:size-14 md:rounded-[18px]',
          ICON_BOX[item.tone],
        )}
      >
        <Icon size={24} aria-hidden="true" className="md:size-7" />
      </span>

      <span className="flex flex-col gap-2 md:gap-3">
        <span className={cn(typeCardKicker, KICKER[item.tone])}>{item.kicker}</span>
        <span className={cn(typeBentoTitle, TITLE[item.tone])}>{item.title}</span>
        <span className={cn('text-body leading-6', TEXT[item.tone])}>{item.text}</span>
      </span>
    </Link>
  );
}

export function BentoGrid({ items, className }: BentoGridProps) {
  const row1 = items.slice(0, 2);
  const row2 = items.slice(2, 4);

  return (
    <div className={cn('flex flex-col gap-4 min-[1200px]:gap-5', className)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1200px]:grid-cols-[640fr_540fr] min-[1200px]:gap-5">
        {row1.map((item) => (
          <BentoCard key={item.id} item={item} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1200px]:grid-cols-[540fr_640fr] min-[1200px]:gap-5">
        {row2.map((item) => (
          <BentoCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
