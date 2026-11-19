'use client';

/**
 * The four auth mutations. Each one throws its `AuthFailure` into TanStack Query's error channel,
 * so `mutation.error` is a typed `AuthFailure` and the views never touch `fetch`.
 *
 * None of these hooks navigates or touches the session store — the views own that, because the
 * destination depends on `?next=`, the city preference and the onboarding flag.
 */
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { authRepository, type OtpOutcome } from '../data/auth.repository';
import type { AuthFailure } from '../data/auth.remote';
import type { RegistrationDraft } from '../data/models/registration';

/** `POST /api/auth/login` — sends the SMS. Also used by "Yenidən göndər". */
export function useRequestOtp(): UseMutationResult<true, AuthFailure, string> {
  return useMutation<true, AuthFailure, string>({
    mutationKey: ['auth', 'login'],
    mutationFn: async (phone) => {
      const res = await authRepository.requestOtp(phone);
      if (!res.ok) throw res.failure;
      return res.value;
    },
    retry: false,
  });
}

export interface VerifyOtpVars {
  phone: string;
  code: string;
}

/** `POST /api/auth/otp` — cookies are set by the handler; nothing sensitive comes back. */
export function useVerifyOtp(): UseMutationResult<OtpOutcome, AuthFailure, VerifyOtpVars> {
  return useMutation<OtpOutcome, AuthFailure, VerifyOtpVars>({
    mutationKey: ['auth', 'otp'],
    mutationFn: async ({ phone, code }) => {
      const res = await authRepository.verifyOtp(phone, code);
      if (!res.ok) throw res.failure;
      return res.value;
    },
    retry: false,
  });
}

/** `POST /api/auth/register` — body shape per `data/models/registration.ts` (unverified). */
export function useCompleteRegistration(): UseMutationResult<true, AuthFailure, RegistrationDraft> {
  return useMutation<true, AuthFailure, RegistrationDraft>({
    mutationKey: ['auth', 'register'],
    mutationFn: async (draft) => {
      const res = await authRepository.completeRegistration(draft);
      if (!res.ok) throw res.failure;
      return res.value;
    },
    retry: false,
  });
}

/** `POST /api/auth/guest` — AU8 guest mode: a cookie marker, no token, no upstream call. */
export function useContinueAsGuest(): UseMutationResult<true, AuthFailure, void> {
  return useMutation<true, AuthFailure, void>({
    mutationKey: ['auth', 'guest'],
    mutationFn: async () => {
      const res = await authRepository.continueAsGuest();
      if (!res.ok) throw res.failure;
      return res.value;
    },
    retry: false,
  });
}
