'use client';

/**
 * The "Dəvət etdiklərin" card on `/invite` (`referral.html` → `Invited`).
 *
 * Measured: `surface` card, radius 28, padding 28, gap 16, 380 wide (full width below `lg`); the
 * head row is 20/700 on the left and a 20/800 `brand` count on the right; each row is gap 12 with
 * a 44 `sky-soft` avatar holding a 16/800 `sky` initial, a 15/700 name and a 13/500 status —
 * `success` for "3,00 ₼ qazandın", `ink3` for "İlk alış gözlənilir".
 *
 * **This whole list is mock.** There is no referral API, and the screen spec says the invited list
 * and the reward are placeholders. The demo banner above it states that.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';

import type { InvitedFriend } from '../data/models/referral';

export interface ReferralInvitedListProps {
  invited: readonly InvitedFriend[];
  className?: string;
}

export function ReferralInvitedList({ invited, className }: ReferralInvitedListProps) {
  const t = useTranslations('referral');
  const { money } = useFormat();

  return (
    <section
      aria-label={t('invited.title')}
      className={cn(
        'flex w-full shrink-0 flex-col items-start gap-4 rounded-xl bg-surface p-5 md:p-7',
        'lg:w-[380px]',
        className,
      )}
    >
      <div className="flex w-full flex-row items-center justify-between gap-3">
        <h2 className="text-h4 font-bold text-ink">{t('invited.title')}</h2>
        <p
          className="text-h4 font-extrabold text-brand tabular-nums"
          aria-label={t('invited.countAria', { count: invited.length })}
        >
          {invited.length}
        </p>
      </div>

      {invited.length === 0 ? (
        <p className="text-body-sm text-ink3">{t('invited.empty')}</p>
      ) : (
        <ul className="flex w-full flex-col gap-4">
          {invited.map((friend) => (
            <li key={friend.id} className="flex w-full flex-row items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-sky-soft text-body font-extrabold text-sky"
              >
                {friend.initial}
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span className="truncate text-body-sm font-bold text-ink">{friend.name}</span>
                <span
                  className={cn(
                    'text-caption font-medium',
                    friend.status === 'rewarded' ? 'text-success' : 'text-ink3',
                  )}
                >
                  {friend.status === 'rewarded'
                    ? t('invited.earned', { reward: money(friend.reward) })
                    : t('invited.pending')}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
