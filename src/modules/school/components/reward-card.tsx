'use client';

/**
 * One "Mükafatlar" card on SC2.
 *
 * Measured: white card radius 28, padding 24, gap 14, a 48×48 yellow chip at radius 16 with
 * `percent`, title 16/700, cost 20/800, then either a 44-high dark "Dəyiş" pill or the
 * `surface2` "Xal çatmır" pill.
 *
 * `affordable` comes from the mock — this component never compares the balance with the cost.
 */
import { useTranslations } from 'next-intl';

import { Percent } from '@/shared/lucide';
import { Button } from '@/shared/ui';

import type { SchoolReward } from '../data/models/grade';

export interface RewardCardProps {
  reward: SchoolReward;
  onRedeem: (reward: SchoolReward) => void;
  busy?: boolean;
}

export function RewardCard({ reward, onRedeem, busy = false }: RewardCardProps) {
  const t = useTranslations('school');

  return (
    <div className="flex w-full flex-col gap-[14px] rounded-xl bg-surface p-6">
      <div className="flex flex-row items-center gap-[14px]">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-md bg-yellow"
        >
          <Percent size={22} className="text-on-yellow" />
        </span>
        <p className="min-w-0 flex-1 text-body font-bold text-ink">{reward.title}</p>
      </div>

      <p className="text-h4 font-extrabold text-ink">{t('rewards.cost', { count: reward.cost })}</p>

      {reward.affordable ? (
        <Button variant="primary" size="md" loading={busy} onClick={() => onRedeem(reward)}>
          {t('rewards.redeem')}
        </Button>
      ) : (
        <span className="inline-flex h-7 w-fit items-center rounded-pill bg-surface2 px-2.5 text-micro font-bold text-ink2">
          {t('rewards.notEnough')}
        </span>
      )}
    </div>
  );
}
