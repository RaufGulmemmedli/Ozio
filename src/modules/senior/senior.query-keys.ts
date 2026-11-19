/**
 * Query keys for the senior module. The first element is always the module name so sign-out can
 * drop everything user-bound in one invalidation (04-data-layer.md).
 *
 * "Sadə rejim" prefs are **not** here: they are a device preference in `localStorage`, not data.
 */
import { moduleKeys } from '@/core/query';

export const seniorKeys = {
  ...moduleKeys('senior'),
  /** "Pensiya günü": the payday, the pension figure and the essentials basket. */
  plan: () => ['senior', 'plan'] as const,
  /** "Qonşu nəvə": both sides of the neighbour board plus the earned-bonus block. */
  help: () => ['senior', 'help'] as const,
} as const;
