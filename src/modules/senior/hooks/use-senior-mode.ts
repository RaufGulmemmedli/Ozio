'use client';

/**
 * "Sadə rejim" preferences — the device-side half of the senior module.
 *
 * `SeniorPrefs` in `mock-contracts.ts` (and `api/mock-modules.md` §13a) specifies: `enabled`
 * (default false), `scale` clamped 1.0…1.6 (default 1.3 when switched on), `highContrast`, all
 * client-persisted. They are **preferences, not data**, so they never go near the query layer.
 *
 * TODO(core): the contract says these live beside the other prefs, but `PrefsState` in
 * `@/core/session/prefs-store.ts` has no senior fields and `src/core/**` is off-limits to this
 * module (BUILD-CONTRACT rule 8). This store is therefore a local twin of `usePrefs`: same
 * `zustand/persist` setup, same `skipHydration` + rehydrate-in-an-effect discipline, its own key
 * (`ozio.senior`). Adding `seniorMode`, `seniorScale` and `seniorContrast` to `PrefsState` would
 * let this file shrink to the `<html>` effect below.
 *
 * The flags the stylesheet reacts to are written on `<html>`:
 *   `data-senior="1"`, `data-senior-contrast="1"`, `--oz-senior-pref-scale`.
 * Scoping lives in `senior.module.css`, so `src/app/globals.css` is never edited.
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** `SENIOR_PREFS` in `mock-contracts.ts`. */
export const SENIOR_SCALE = { min: 1, max: 1.6, step: 0.1, defaultOn: 1.3 } as const;

export const SENIOR_STORAGE_KEY = 'ozio.senior';

export interface SeniorPrefsState {
  enabled: boolean;
  /** 1.0…1.6. Meaningful only while `enabled`. */
  scale: number;
  highContrast: boolean;

  setEnabled(enabled: boolean): void;
  setScale(scale: number): void;
  setHighContrast(on: boolean): void;
  reset(): void;
}

const clampScale = (value: number): number => {
  if (!Number.isFinite(value)) return SENIOR_SCALE.defaultOn;
  return Math.min(SENIOR_SCALE.max, Math.max(SENIOR_SCALE.min, Math.round(value * 10) / 10));
};

export const useSeniorPrefs = create<SeniorPrefsState>()(
  persist(
    (set, get) => ({
      enabled: false,
      scale: SENIOR_SCALE.defaultOn,
      highContrast: false,

      setEnabled: (enabled) =>
        set({
          enabled,
          // Switching on with the scale left at 1.0 would do nothing visible, so it starts at 1.3.
          scale: enabled && get().scale <= SENIOR_SCALE.min ? SENIOR_SCALE.defaultOn : get().scale,
        }),
      setScale: (scale) => set({ scale: clampScale(scale) }),
      setHighContrast: (highContrast) => set({ highContrast }),
      reset: () => set({ enabled: false, scale: SENIOR_SCALE.defaultOn, highContrast: false }),
    }),
    {
      name: SENIOR_STORAGE_KEY,
      version: 1,
      // No `window` access during render — `useSeniorMode()` rehydrates in an effect, which keeps
      // the server and the first client render identical (no hydration mismatch).
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ enabled: s.enabled, scale: s.scale, highContrast: s.highContrast }),
    },
  ),
);

/** `effectiveScale = enabled ? scale : 1.0` (`seniorEffectiveScale` in the contract). */
export const seniorEffectiveScale = (s: Pick<SeniorPrefsState, 'enabled' | 'scale'>): number =>
  s.enabled ? clampScale(s.scale) : 1;

export interface SeniorModeState extends Pick<SeniorPrefsState, 'enabled' | 'scale' | 'highContrast'> {
  /** 1 when senior mode is off, the chosen scale when it is on. */
  effectiveScale: number;
  setEnabled: (enabled: boolean) => void;
  setScale: (scale: number) => void;
  setHighContrast: (on: boolean) => void;
}

/**
 * Reads the preferences **and** applies them to `<html>`.
 *
 * Mount it on any senior screen (`<SeniorScreen>` does) or from a module that wants the
 * preference honoured app-wide. The attributes are removed again when senior mode is switched
 * off, never on unmount — turning a page away must not silently undo the person's setting.
 */
export function useSeniorMode(): SeniorModeState {
  const enabled = useSeniorPrefs((s) => s.enabled);
  const scale = useSeniorPrefs((s) => s.scale);
  const highContrast = useSeniorPrefs((s) => s.highContrast);
  const setEnabled = useSeniorPrefs((s) => s.setEnabled);
  const setScale = useSeniorPrefs((s) => s.setScale);
  const setHighContrast = useSeniorPrefs((s) => s.setHighContrast);

  useEffect(() => {
    void rehydrateSeniorPrefs();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (enabled) {
      root.setAttribute('data-senior', '1');
      root.style.setProperty('--oz-senior-pref-scale', String(clampScale(scale)));
    } else {
      root.removeAttribute('data-senior');
      root.style.removeProperty('--oz-senior-pref-scale');
    }

    if (enabled && highContrast) root.setAttribute('data-senior-contrast', '1');
    else root.removeAttribute('data-senior-contrast');
  }, [enabled, scale, highContrast]);

  return {
    enabled,
    scale,
    highContrast,
    effectiveScale: seniorEffectiveScale({ enabled, scale }),
    setEnabled,
    setScale,
    setHighContrast,
  };
}

/** Read `localStorage` into the store. Safe on the server (no-op) and safe to call twice. */
export async function rehydrateSeniorPrefs(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await useSeniorPrefs.persist.rehydrate();
  } catch {
    // Private mode / disabled storage: the defaults are fine.
  }
}
