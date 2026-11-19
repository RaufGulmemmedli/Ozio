/**
 * The savings-jar repository — the only thing the hooks import.
 *
 * Mirrors `SavingsJarRepository` from `mock-contracts.ts` (`jar()`, `saveSettings()`, `claim()`),
 * so a real backend slots in behind the same three methods.
 */
import { asObj, mapResult, money, type Result } from '@/core/network';

import { savingsJarRemote } from './savings_jar.remote';
import { parseSavingsJar, type JarSettings, type SavingsJar } from './models/savings-jar';

export interface JarClaimResult {
  /** AZN credited to the Ozio balance. */
  bonus: number;
  /** The jar after the reset, so the screen never has to guess. */
  jar: SavingsJar;
}

export const savingsJarRepository = {
  jar: async (signal?: AbortSignal, state?: string): Promise<Result<SavingsJar>> =>
    mapResult(await savingsJarRemote.jar(signal, state), (envelope) =>
      parseSavingsJar(envelope.data),
    ),

  saveSettings: async (settings: JarSettings): Promise<Result<SavingsJar>> =>
    mapResult(
      await savingsJarRemote.saveSettings({
        enabled: settings.enabled,
        step_cents: settings.stepCents,
        monthly_cap: settings.monthlyCap,
      }),
      (envelope) => parseSavingsJar(envelope.data),
    ),

  claim: async (): Promise<Result<JarClaimResult>> =>
    mapResult(await savingsJarRemote.claim(), (envelope) => {
      const data = asObj(envelope.data);
      return {
        bonus: money(data.bonus),
        jar: parseSavingsJar(data.jar),
      };
    }),
} as const;

export type SavingsJarRepository = typeof savingsJarRepository;
