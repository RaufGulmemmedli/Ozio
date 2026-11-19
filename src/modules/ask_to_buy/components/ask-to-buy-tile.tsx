'use client';

/**
 * The module's entry point, for another module's screen to place — the home quick-action tile and
 * the cart's "Al deyim" row both resolve to this, so nothing outside has to reach into
 * `src/modules/ask_to_buy/**`.
 *
 * It renders nothing when the `askToBuy` flag is off, which is the "hide the entry point" half of
 * 08-feature-flags-mocks.md (the route redirect is the other half).
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ChevronRight, Gift } from '@/shared/lucide';

import { askToBuyEnabled } from '../ask_to_buy.flags';
import { useAskContext } from '../hooks/use-ask-to-buy';

export interface AskToBuyTileProps {
  /** `card` for the home grid, `row` for a settings/cart list. */
  variant?: 'card' | 'row';
  className?: string;
}

export function AskToBuyTile({ variant = 'card', className }: AskToBuyTileProps) {
  const t = useTranslations('ask_to_buy');
  const context = useAskContext();

  if (!askToBuyEnabled()) return null;

  const pending = context.data?.pendingIncoming ?? 0;

  if (variant === 'row') {
    return (
      <Link
        href={paths.askToBuy}
        className={cn(
          'flex min-h-[64px] w-full flex-row items-center gap-[14px] rounded-card px-4 py-3 transition-colors hover:bg-bg',
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-soft"
        >
          <Gift size={22} className="text-brand" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body font-semibold text-ink">{t('entry.title')}</span>
          <span className="truncate text-label text-ink2">{t('entry.body')}</span>
        </span>
        {pending > 0 ? (
          <span className="flex size-[22px] shrink-0 items-center justify-center rounded-pill bg-brand text-micro font-bold text-white">
            {pending}
            <span className="sr-only"> {t('entry.pending', { count: pending })}</span>
          </span>
        ) : null}
        <ChevronRight aria-hidden="true" size={20} className="shrink-0 text-ink3" />
      </Link>
    );
  }

  return (
    <Link
      href={paths.askToBuy}
      className={cn(
        'flex w-full flex-col items-start gap-3 rounded-xl bg-surface p-6 transition-colors hover:bg-surface2',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-md bg-brand-soft"
      >
        <Gift size={24} className="text-brand" />
      </span>
      <span className="text-h4 font-bold text-ink">{t('entry.title')}</span>
      <span className="text-label text-ink2">{t('entry.body')}</span>
      {pending > 0 ? (
        <span className="inline-flex h-7 items-center rounded-pill bg-yellow px-3 text-caption font-bold text-on-yellow">
          {t('entry.pending', { count: pending })}
        </span>
      ) : null}
    </Link>
  );
}
