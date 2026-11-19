/**
 * Weekly missions (N2). `mock-modules.md` §7 — alt keys kept so a future `v1/missions` drops in.
 */
import { asList, asObj, bool, int, money, str } from '@/core/network';

import { pickText, type Localized } from './localized';

export interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  /** AZN, 0 when the reward is not money (a ticket, a coupon multiplier). */
  reward: number;
  /** Already-worded reward pill, e.g. "+3 ₼" / "+1 bilet" / "2x kupon". */
  rewardLabel: string;
  /** lucide key from the fixture — mapped to a component by the view. */
  icon: string;
  claimed: boolean;
}

export interface MissionsBoard {
  missions: Mission[];
  /** Sum the server says can still be earned this week. */
  canEarn: number;
  daysLeft: number;
}

export function parseMission(json: unknown, locale = 'az'): Mission {
  const o = asObj(json);
  const target = int(o.target ?? o.goal ?? o.total, 0);
  return {
    id: str(o.id ?? o.mission_id),
    title: pickText((o.title ?? o.name) as Localized, locale),
    description: pickText((o.description ?? o.subtitle) as Localized, locale),
    progress: Math.max(0, int(o.progress ?? o.current ?? o.completed_count, 0)),
    target: target > 0 ? target : 1,
    reward: money(o.reward ?? o.bonus ?? o.reward_amount),
    rewardLabel: pickText((o.rewardLabel ?? o.reward_text) as Localized, locale),
    icon: str(o.icon ?? o.type) || 'sparkles',
    claimed: bool(o.claimed ?? o.is_claimed),
  };
}

export function parseMissionsBoard(json: unknown, locale = 'az'): MissionsBoard {
  const o = asObj(json);
  const rows = asList(o.missions ?? o.items);
  const missions = (rows.length > 0 ? rows : asList(json)).map((row) => parseMission(row, locale));
  return {
    missions,
    canEarn: money(o.can_earn ?? o.canEarn),
    daysLeft: Math.max(0, int(o.days_left ?? o.daysLeft, 0)),
  };
}

export const missionRatio = (m: Mission): number =>
  m.target <= 0 ? 0 : Math.min(1, Math.max(0, m.progress / m.target));

export const missionCompleted = (m: Mission): boolean => m.progress >= m.target;

export const missionClaimable = (m: Mission): boolean => missionCompleted(m) && !m.claimed;

export const missionsDoneCount = (rows: readonly Mission[]): number =>
  rows.filter(missionCompleted).length;
