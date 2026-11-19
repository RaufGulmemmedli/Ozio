'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { MapPinOff } from '@/shared/lucide';

import { minutesToClock, type Branch } from '../data/models/partner';
import { distanceKm } from '../lib/geo';
import { PartnerLogo } from './PartnerLogo';

export interface BranchRowProps {
  branch: Branch;
  /** Brand name, for the logo tile's tint and initials. */
  brandName: string;
  /** Metres from the reference point; `null` when either side has no coordinate. */
  distanceMeters?: number | null;
  /** `null` when the branch hours are unknown — then no status pill is drawn. */
  openNow?: boolean | null;
  /** `card` = the stand-alone 24-radius card (map list); `list` = the divided table row. */
  variant?: 'card' | 'list';
  selected?: boolean;
  onSelect?: (branchId: string) => void;
  className?: string;
}

/**
 * A branch row.
 *
 * `card` mirrors `Branch Row · …` in `app-partnyorlar-xerite.html` (`surface` r24, padding 14,
 * gap 14, logo 60 r16, name 16/700, address 13/400 `ink2`, meta 12/600, cashback pill 14/800);
 * the selected row inverts to `cta`. `list` mirrors `Branch Row` in `app-partnyor-detali.html`
 * (44 logo, 16/700 + 13/400, distance 14/600, status pill 12/700, 1px `line` divider).
 *
 * **Coordinates are the exception, not the rule** on live data: when a branch has no point the
 * row says so instead of pretending a distance.
 */
export function BranchRow({
  branch,
  brandName,
  distanceMeters = null,
  openNow = null,
  variant = 'card',
  selected = false,
  onSelect,
  className,
}: BranchRowProps) {
  const t = useTranslations('partners');
  const { number, percentPoints } = useFormat();

  const distance = distanceMeters === null ? null : distanceKm(distanceMeters);
  const card = variant === 'card';
  const invert = card && selected;

  const statusLabel =
    openNow === null
      ? null
      : openNow
        ? branch.closeMinutes === null
          ? t('branch.open')
          : t('branch.openUntil', { time: minutesToClock(branch.closeMinutes) })
        : branch.openMinutes === null
          ? t('branch.closed')
          : t('branch.opensAt', { time: minutesToClock(branch.openMinutes) });

  const content = (
    <>
      <PartnerLogo
        name={branch.name || brandName}
        src={branch.imageUrl}
        size={card ? 60 : 44}
        radius={card ? 16 : 999}
        fontSize={card ? 22 : 16}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className={cn('m-0 truncate text-body font-bold', invert ? 'text-on-cta' : 'text-ink')}>
          {branch.name || brandName}
        </p>
        <p
          className={cn(
            'm-0 truncate text-caption',
            invert ? 'text-on-cta/75' : branch.address ? 'text-ink2' : 'text-ink3',
          )}
        >
          {branch.address ?? t('branch.noAddress')}
        </p>
        {card ? (
          <span
            className={cn(
              'flex flex-row items-center gap-2.5 text-micro font-semibold',
              invert ? 'text-on-cta/75' : 'text-ink2',
            )}
          >
            {distance ? (
              <span>
                {t('branch.distanceKm', {
                  value: number(distance.value, { maximumFractionDigits: distance.fractionDigits }),
                })}
              </span>
            ) : (
              <span className="flex flex-row items-center gap-1">
                <MapPinOff size={12} aria-hidden="true" />
                {t('branch.noLocation')}
              </span>
            )}
            {statusLabel ? <span>{statusLabel}</span> : null}
          </span>
        ) : null}
      </div>

      {!card && distance ? (
        <span className="shrink-0 text-label font-semibold text-ink2">
          {t('branch.distanceKm', {
            value: number(distance.value, { maximumFractionDigits: distance.fractionDigits }),
          })}
        </span>
      ) : null}

      {!card && statusLabel ? (
        <span
          className={cn(
            'shrink-0 rounded-pill px-3 py-[5px] text-micro font-bold',
            openNow ? 'bg-success-soft text-success' : 'bg-surface2 text-ink2',
          )}
        >
          {statusLabel}
        </span>
      ) : null}

      {card && branch.cashbackPercent !== null && branch.cashbackPercent > 0 ? (
        <span
          className={cn(
            'shrink-0 rounded-pill px-3 py-1.5 text-label font-extrabold',
            invert ? 'bg-yellow text-on-yellow' : 'bg-brand-soft text-brand-dark',
          )}
        >
          {percentPoints(branch.cashbackPercent)}
        </span>
      ) : null}
    </>
  );

  const shell = cn(
    'flex w-full flex-row items-center text-left',
    card
      ? cn(
          'gap-[14px] rounded-card p-[14px] transition-colors duration-[var(--oz-dur-fast)]',
          invert ? 'bg-cta' : 'bg-surface hover:bg-surface2',
        )
      : 'gap-4 border-b border-line px-1 py-4 last:border-b-0',
    className,
  );

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(branch.id)} aria-pressed={selected} className={shell}>
        {content}
      </button>
    );
  }
  return <li className={cn('list-none', shell)}>{content}</li>;
}
