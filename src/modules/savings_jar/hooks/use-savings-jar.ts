'use client';

/**
 * The savings jar: one read and two writes.
 *
 * `?preview=` support comes from `useScreenQuery`; the module-specific `?preview=claim` is passed
 * to the handler as `?state=claim`, so the "Bonus hazırdır" banner is a real server answer rather
 * than a client-side fake.
 */
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, usePreview, useScreenQuery } from '@/core/query';

import { savingsJarRepository, type JarClaimResult } from '../data/savings_jar.repository';
import {
  DEFAULT_JAR_SETTINGS,
  type JarSettings,
  type SavingsJar,
} from '../data/models/savings-jar';
import { savingsJarKeys } from '../savings_jar.query-keys';

const EMPTY_JAR: SavingsJar = {
  balance: 0,
  daysLeft: 0,
  bonusCredited: 0,
  projectedBonus: 0,
  contributions: [],
  members: [],
  settings: DEFAULT_JAR_SETTINGS,
};

/** `?preview=` values this module forwards to the handler. */
const SERVER_STATES: ReadonlySet<string> = new Set(['claim']);

export function useJarMockState(): string | undefined {
  const preview = usePreview();
  return preview !== null && SERVER_STATES.has(preview) ? preview : undefined;
}

/** `/savings-jar/settings?preview=save-error` makes the next save fail, deterministically. */
export function useForceSaveError(): boolean {
  return usePreview() === 'save-error';
}

export function useSavingsJar(): UseQueryResult<SavingsJar, Failure> {
  const state = useJarMockState();

  return useScreenQuery<SavingsJar>(
    {
      queryKey: [...savingsJarKeys.jar, state ?? null],
      queryFn: async ({ signal }) => unwrap(await savingsJarRepository.jar(signal, state)),
      ...CACHE.profile,
    },
    { empty: EMPTY_JAR },
  );
}

export function useSaveJarSettings(): UseMutationResult<SavingsJar, Failure, JarSettings> {
  const client = useQueryClient();

  return useMutation<SavingsJar, Failure, JarSettings>({
    mutationFn: async (settings) => unwrap(await savingsJarRepository.saveSettings(settings)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: savingsJarKeys.jar });
    },
  });
}

export function useClaimJar(): UseMutationResult<JarClaimResult, Failure, void> {
  const client = useQueryClient();

  return useMutation<JarClaimResult, Failure, void>({
    mutationFn: async () => unwrap(await savingsJarRepository.claim()),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: savingsJarKeys.jar });
    },
  });
}
