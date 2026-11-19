'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import { useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ChevronRight, Percent } from '@/shared/lucide';

import { PartnerLogo } from './PartnerLogo';

export interface PartnerCardProps {
  /** Brand id (or the name slug when the row carries no id). */
  id: string;
  name: string;
  /** Second line — the category name ("Market", "Aptek"). */
  subtitle?: string | null;
  imageUrl?: string | null;
  /** Per-brand cashback when the API gives one; the live brand rows do **not**. */
  cashbackPercent?: number | null;
  /** Carried into the link as `?category=` so the detail page resolves the brand in one request. */
  categoryId?: string | null;
  /** Overrides the destination (the map screen selects in place instead of navigating). */
  href?: string;
  onSelect?: (id: string) => void;
  selected?: boolean;
  className?: string;
}

/**
 * The partner grid card (`Partner Card · …`, `app-partnyorlar.html`):
 * `surface` r24, padding 12, gap 14 — tinted logo tile 116 high r16, name 16/700 + category
 * 13/400 `ink2` (padding-inline 4, gap 2), footer row with the cashback pill
 * (`brand-soft` / `brand-dark`, 13/700, padding 6/12) and an 18px chevron.
 */
export function PartnerCard({
  id,
  name,
  subtitle,
  imageUrl,
  cashbackPercent,
  categoryId,
  href,
  onSelect,
  selected = false,
  className,
}: PartnerCardProps) {
  const t = useTranslations('partners');
  const { percentPoints } = useFormat();

  const body = (
    <>
      <PartnerLogo name={name} src={imageUrl} size="fill" radius={16} />

      <div className="flex w-full flex-col gap-0.5 px-1">
        <p className="m-0 truncate text-body font-bold text-ink">{name}</p>
        {subtitle ? <p className="m-0 truncate text-caption text-ink2">{subtitle}</p> : null}
      </div>

      <div className="flex w-full flex-row items-center justify-between gap-2 px-1 pb-1">
        {typeof cashbackPercent === 'number' && cashbackPercent > 0 ? (
          <span className="flex flex-row items-center gap-1.5 rounded-pill bg-brand-soft px-3 py-1.5 text-caption font-bold text-brand-dark">
            <Percent size={14} aria-hidden="true" className="shrink-0" />
            {t('cashbackTag', { rate: percentPoints(cashbackPercent) })}
          </span>
        ) : (
          <span className="text-caption text-ink3">{t('cashbackUnknown')}</span>
        )}
        <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ink3" />
      </div>
    </>
  );

  const shell = cn(
    'flex w-full flex-col items-start gap-[14px] rounded-card bg-surface p-3 text-left',
    'transition-[background-color,transform] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
    'active:scale-[.99] hover:bg-surface2',
    selected && 'outline outline-2 outline-offset-2 outline-brand',
    className,
  );

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(id)} aria-pressed={selected} className={shell}>
        {body}
      </button>
    );
  }

  const target = href ?? paths.marketPartner(id);
  return (
    <Link
      href={categoryId ? `${target}?category=${encodeURIComponent(categoryId)}` : target}
      className={shell}
    >
      {body}
    </Link>
  );
}
