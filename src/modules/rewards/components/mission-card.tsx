'use client';

/**
 * `Mission Card` from `missions.html`: 52px icon disc, title 17/800 + description 14/400, a 10px
 * progress track (`$brand`, `$success` once complete) with "n/m" beside it, the yellow reward pill
 * and either the dark "Mükafatı götür" button or the quiet "Davam edir" label.
 *
 * The track is a real `role="progressbar"` with `aria-valuenow`, per the a11y rules.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import {
  Bike,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  type LucideIcon,
} from '@/shared/lucide';
import { Button } from '@/shared/ui';

import {
  missionClaimable,
  missionCompleted,
  missionRatio,
  type Mission,
} from '../data/models/mission';

/**
 * The fixture's lucide keys mapped to the icons `@/shared/lucide` actually exports
 * (`user-plus`, `sofa` and `rotate-cw` are not in the project's icon set — see the report).
 */
const ICONS: Record<string, LucideIcon> = {
  'user-plus': Users,
  users: Users,
  store: Store,
  bike: Bike,
  sofa: ShoppingBag,
  'rotate-cw': Sparkles,
  sparkles: Sparkles,
};

export interface MissionCardProps {
  mission: Mission;
  onClaim: (id: string) => void;
  claiming: boolean;
}

export function MissionCard({ mission, onClaim, claiming }: MissionCardProps) {
  const t = useTranslations('rewards');
  const Icon = ICONS[mission.icon] ?? Sparkles;
  const claimable = missionClaimable(mission);
  const done = missionCompleted(mission);
  const ratio = missionRatio(mission);

  return (
    <article className="flex w-full flex-col gap-[14px] rounded-xl bg-surface p-6">
      <div className="flex w-full flex-row items-center gap-[14px]">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-[52px] shrink-0 items-center justify-center rounded-pill',
            claimable ? 'bg-brand-soft text-brand' : 'bg-surface2 text-ink2',
          )}
        >
          <Icon size={24} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-[17px] font-extrabold leading-[1.25] text-ink">{mission.title}</h3>
          <p className="text-label text-ink2">{mission.description}</p>
        </div>
      </div>

      <div className="flex w-full flex-row items-center gap-3">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={mission.target}
          aria-valuenow={mission.progress}
          aria-label={t('missions.progressLabel', {
            title: mission.title,
            progress: mission.progress,
            target: mission.target,
          })}
          className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-surface2"
        >
          <div
            className={cn('h-full rounded-pill', done ? 'bg-success' : 'bg-brand')}
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
        <span className="shrink-0 text-label font-bold text-ink">
          {t('missions.progress', { progress: mission.progress, target: mission.target })}
        </span>
      </div>

      <div className="flex w-full flex-row items-center justify-between gap-3">
        <span className="w-fit shrink-0 rounded-pill bg-yellow px-[14px] py-1.5 text-label font-extrabold text-on-yellow">
          {mission.rewardLabel}
        </span>

        {claimable ? (
          <Button size="md" variant="primary" loading={claiming} onClick={() => onClaim(mission.id)}>
            {t('missions.claim')}
          </Button>
        ) : (
          <span className="shrink-0 text-caption font-semibold text-ink3">
            {mission.claimed ? t('missions.claimed') : t('missions.inProgress')}
          </span>
        )}
      </div>
    </article>
  );
}
