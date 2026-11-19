/**
 * Auth repository — the only thing the hooks import. Maps handler/envelope answers onto domain
 * values and keeps every unverified wire guess behind this boundary.
 */
import { AZ_COUNTRY_ID } from '../auth.constants';
import { authRemote, type AuthFailure } from './auth.remote';
import { parseCities, type City } from './models/city';
import {
  toCompleteRegistrationBody,
  type RegistrationDraft,
} from './models/registration';
import { mapResult, type Failure, type Result } from '@/core/network';

export interface OtpOutcome {
  /** `is_registered === false` upstream: the registration step is still pending. */
  needsRegistration: boolean;
}

export const authRepository = {
  /** Sends the SMS. The phone may be in any shape the mask produces — the BFF normalises it. */
  async requestOtp(phone: string): Promise<Result<true, AuthFailure>> {
    const res = await authRemote.login(phone);
    return mapResult(res, () => true as const);
  },

  /**
   * Verifies the code. On success the handler has already written `ozio_at` / `ozio_csrf`, so the
   * caller only has to hydrate the session store.
   */
  async verifyOtp(phone: string, code: string): Promise<Result<OtpOutcome, AuthFailure>> {
    const res = await authRemote.verifyOtp(phone, code);
    return mapResult(res, (value) => ({ needsRegistration: value.needsRegistration === true }));
  },

  /**
   * Completes registration. The body shape is **unverified** and lives in exactly one place —
   * `data/models/registration.ts` — so a live correction is a one-line fix.
   */
  async completeRegistration(draft: RegistrationDraft): Promise<Result<true, AuthFailure>> {
    const res = await authRemote.register(toCompleteRegistrationBody(draft));
    return mapResult(res, () => true as const);
  },

  /** Guest mode (AU8): no upstream endpoint exists, the handler just sets `ozio_g=1`. */
  async continueAsGuest(): Promise<Result<true, AuthFailure>> {
    const res = await authRemote.guest();
    return mapResult(res, () => true as const);
  },

  /** The city list, labels already resolved for `locale`. Parsers never throw. */
  async cities(
    locale: string,
    signal?: AbortSignal,
    countryId: number = AZ_COUNTRY_ID,
  ): Promise<Result<City[], Failure>> {
    const res = await authRemote.cities(countryId, signal);
    return mapResult(res, (env) => parseCities(env.data, locale));
  },
};
