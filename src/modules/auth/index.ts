/**
 * Public surface of the auth module. Other modules import from here and nothing else.
 */
export { authRoutes, type AuthRouteId } from './auth.routes';
export { authKeys } from './auth.query-keys';
export {
  COUNTRIES,
  DEFAULT_COUNTRY,
  OTP_LENGTH,
  RESEND_COOLDOWN_SECONDS,
  AZ_COUNTRY_ID,
  LEGACY_CARD_LENGTH,
  countryByIso,
  type CountryOption,
} from './auth.constants';

export { authRepository, type OtpOutcome } from './data/auth.repository';
export type { AuthFailure, AuthFailureKind } from './data/auth.remote';
export {
  matchesCityQuery,
  parseCities,
  parseCity,
  type City,
} from './data/models/city';
export {
  parseBirthDate,
  toCompleteRegistrationBody,
  type RegistrationDraft,
} from './data/models/registration';

export { useCities } from './hooks/use-cities';
export {
  useCompleteRegistration,
  useContinueAsGuest,
  useRequestOtp,
  useVerifyOtp,
  type VerifyOtpVars,
} from './hooks/use-auth-mutations';
export { useAuthFlow, useHydratedAuthFlow, authFlowState } from './hooks/use-auth-flow';
export { useAuthDestination, withNext } from './hooks/use-auth-destination';
export { useResendCooldown, formatCountdown } from './hooks/use-resend-cooldown';

export { LoginView } from './view/LoginView';
export { OtpView } from './view/OtpView';
export { RegisterView } from './view/RegisterView';
export { CitySelectView } from './view/CitySelectView';
export { WelcomeView } from './view/WelcomeView';
export { AuthPageFallback } from './view/AuthPageFallback';
export { CitySelectSkeleton } from './view/CitySelectSkeleton';
export { RegisterSkeleton } from './view/RegisterSkeleton';
export { MergeCardStep, formatCardNumber } from './components/MergeCardStep';
