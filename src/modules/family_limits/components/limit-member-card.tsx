'use client';

/**
 * One member card in the 3-column grid (`limits-list.html` → `Member *`).
 *
 * Two shapes, both drawn:
 *  - **with a limit**: `surface` card (radius 28, padding 28) — or `brand-soft` when the limit is
 *    full — holding a 52 avatar + name 18/700 + `role · age` 14/400, the spend 28/800 beside
 *    `/ N ₼ period` 14/400, the 10px progress bar, then "Qalıb …" 14/600 and, when full, the
 *    `brand` "Limit dolub" pill;
 *  - **without one**: the same header, a `surface2` "Limit yoxdur" pill and one explanatory line.
 *
 * The whole card is a link to the member page.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Link, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ChevronRight } from '@/shared/lucide';

import { LimitProgress } from './limit-progress';
import { hasNoLimit, type LimitMember } from '../data/models/limit-member';

export interface LimitMemberCardProps {
  member: LimitMember;
}

export function LimitMemberCard({ member }: LimitMemberCardProps) {
  const t = useTranslations('family_limits');
  const { money, number } = useFormat();

  const noLimit = hasNoLimit(member);
  const subtitle =
    member.age === null
      ? member.role
      : t('card.roleAge', { role: member.role, age: number(member.age) });
  const periodLabel = t(`period.${member.period}`);

  return (
    <Link
      href={paths.familyLimit(member.id)}
      className={cn(
        'group flex w-full flex-col items-start gap-4 rounded-xl p-7 transition-[background-color,box-shadow]',
        member.exhausted ? 'bg-brand-soft' : 'bg-surface hover:bg-surface2',
      )}
    >
      <span className="flex w-full flex-row items-center gap-[14px]">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-13 shrink-0 items-center justify-center rounded-pill text-[21px] font-bold',
            member.exhausted ? 'bg-brand text-white' : 'bg-surface2 text-ink',
          )}
        >
          {member.name.trim().charAt(0).toLocaleUpperCase('az')}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[18px] font-bold text-ink">{member.name}</span>
          <span className="truncate text-label text-ink2">{subtitle}</span>
        </span>
        <ChevronRight
          aria-hidden="true"
          size={20}
          className="shrink-0 text-ink3 transition-transform group-hover:translate-x-0.5"
        />
      </span>

      {noLimit ? (
        <>
          <span className="inline-flex h-7 items-center rounded-pill bg-surface2 px-3 text-caption font-bold text-ink2">
            {t('card.noLimit')}
          </span>
          <span className="text-label text-ink2">{t('card.noLimitBody')}</span>
        </>
      ) : (
        <>
          <span className="flex w-full flex-row items-end justify-between gap-3">
            <span className="text-h3 font-extrabold text-ink">{money(member.spent)}</span>
            <span className="text-label text-ink2">
              {t('card.of', { limit: number(member.limit), period: periodLabel })}
            </span>
          </span>

          <LimitProgress
            value={member.progress}
            exhausted={member.exhausted}
            height={10}
            label={t('card.progressLabel', { name: member.name, period: periodLabel })}
            valueText={t('card.progressValue', {
              spent: money(member.spent),
              limit: number(member.limit),
            })}
          />

          <span className="flex w-full flex-row items-center justify-between gap-3">
            <span className="text-label font-semibold text-ink">
              {t('card.remaining', { amount: money(member.remaining) })}
            </span>
            {member.exhausted ? (
              <span className="inline-flex h-7 shrink-0 items-center rounded-pill bg-brand px-3 text-caption font-bold text-white">
                {t('card.full')}
              </span>
            ) : null}
          </span>
        </>
      )}
    </Link>
  );
}
