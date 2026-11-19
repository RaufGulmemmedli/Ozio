'use client';

/**
 * The login-flow carrier: the phone number typed on `/login`, read again on `/otp`.
 *
 * **The phone is never in the URL.** It lives in this store for the duration of the flow and is
 * mirrored into `sessionStorage` so a reload of `/otp` does not lose it (and so the tab, not the
 * browser profile, is the lifetime — nothing survives closing the tab). It is cleared the moment
 * the flow finishes.
 */
import { useEffect } from 'react';
import { create } from 'zustand';

import { DEFAULT_COUNTRY } from '../auth.constants';

const STORAGE_KEY = 'ozio.auth.flow';

export interface AuthFlowState {
  /** Dial code of the chosen country, e.g. `+994`. */
  dialCode: string;
  /** National digits only, unformatted (`501234567`). Empty until `/login` is submitted. */
  digits: string;
  /** `+994501234567`, or `null` while nothing has been submitted. */
  e164: string | null;
  /** True once the store has read `sessionStorage` (so `/otp` knows to redirect or wait). */
  hydrated: boolean;

  setPhone(input: { dialCode: string; digits: string; e164: string | null }): void;
  clear(): void;
  hydrate(): void;
}

function persist(state: Pick<AuthFlowState, 'dialCode' | 'digits' | 'e164'>): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / disabled storage: the in-memory value still carries the flow.
  }
}

export const useAuthFlow = create<AuthFlowState>((set, get) => ({
  dialCode: DEFAULT_COUNTRY.dialCode,
  digits: '',
  e164: null,
  hydrated: false,

  setPhone: ({ dialCode, digits, e164 }) => {
    persist({ dialCode, digits, e164 });
    set({ dialCode, digits, e164 });
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // nothing to do — the in-memory reset below is what matters
      }
    }
    set({ dialCode: DEFAULT_COUNTRY.dialCode, digits: '', e164: null });
  },

  hydrate: () => {
    if (get().hydrated) return;
    if (typeof window === 'undefined') return;
    let next: Partial<AuthFlowState> = {};
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === 'object') {
          const o = parsed as Record<string, unknown>;
          next = {
            dialCode: typeof o.dialCode === 'string' ? o.dialCode : DEFAULT_COUNTRY.dialCode,
            digits: typeof o.digits === 'string' ? o.digits.replace(/\D+/g, '') : '',
            e164: typeof o.e164 === 'string' ? o.e164 : null,
          };
        }
      }
    } catch {
      next = {};
    }
    set({ ...next, hydrated: true });
  },
}));

/** Reads `sessionStorage` once on mount (never during render, so SSR and hydration agree). */
export function useHydratedAuthFlow(): AuthFlowState {
  const state = useAuthFlow();
  useEffect(() => {
    state.hydrate();
    // `hydrate()` is idempotent and reads a stable store action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

export const authFlowState = () => useAuthFlow.getState();
