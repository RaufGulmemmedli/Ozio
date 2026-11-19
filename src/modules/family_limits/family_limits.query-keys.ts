/**
 * Query keys for the family_limits module. The first element is always the module name so
 * sign-out can drop everything user-bound in one invalidation (04-data-layer.md).
 */
import { moduleKeys } from '@/core/query';

export const familyLimitsKeys = {
  ...moduleKeys('family_limits'),
  /** The member cards + the `block` summary strip. */
  members: () => ['family_limits', 'members'] as const,
  /** One member, with their allowed categories and recent purchases. */
  member: (id: string) => ['family_limits', 'member', id] as const,
} as const;
