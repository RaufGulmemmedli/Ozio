'use client';

/**
 * One inbox row (`ask-inbox.html` → `Request Row N`): 44 `brand-soft` initial avatar, title
 * `<Ad> · N məhsul` 16/700, the note 14/400 `ink2`, the relative time 14/400 `ink3`, the total
 * 17/700 right-aligned in an 80 column, the status chip in a 120 column and a 20px chevron.
 * Row height 88, card padding 8/28.
 *
 * The whole row is one link, so the accessible name carries everything a sighted reader sees.
 */
import { useTranslations } from 'next-intl';

import { useFormat, Link } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ChevronRight } from '@/shared/lucide';

import { AskStatusChip } from './ask-status-chip';
import { useAskTime } from './ask-time';
import type { AskRequest } from '../data/models/ask-request';

export interface AskRequestRowProps {
  request: AskRequest;
  /** Which name heads the row: the asker for a parent, the asked-for a child. */
  counterpartName: string;
}

export function AskRequestRow({ request, counterpartName }: AskRequestRowProps) {
  const t = useTranslations('ask_to_buy');
  const { money } = useFormat();
  const askTime = useAskTime();

  const initial = counterpartName.trim().charAt(0).toLocaleUpperCase('az');
  const title = t('row.title', { name: counterpartName, count: request.itemCount });
  const time = askTime(request.createdAt);

  return (
    <Link
      href={paths.askToBuyRequest(request.id)}
      aria-label={t('row.aria', {
        title,
        total: money(request.total),
        status: t(`status.${request.status}`),
      })}
      className="group flex min-h-[88px] w-full flex-row items-center gap-4 rounded-card py-4 transition-colors hover:bg-bg focus-visible:bg-bg sm:gap-4"
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-body-l font-bold text-brand"
      >
        {initial}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate text-body font-bold text-ink">{title}</span>
        {request.note ? (
          <span className="truncate text-label text-ink2">{request.note}</span>
        ) : null}
        <span className="text-label text-ink3 lg:hidden">{time}</span>
      </span>

      <span className="hidden shrink-0 text-label text-ink3 lg:block">{time}</span>

      <span className="shrink-0 text-end text-[17px] font-bold text-ink lg:w-20">
        {money(request.total)}
      </span>

      <span className="flex shrink-0 flex-row justify-end lg:w-[120px]">
        <AskStatusChip status={request.status} />
      </span>

      <ChevronRight
        aria-hidden="true"
        size={20}
        className="hidden shrink-0 text-ink3 transition-transform group-hover:translate-x-0.5 sm:block"
      />
    </Link>
  );
}
