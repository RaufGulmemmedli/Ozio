/** Public surface of the onboarding module. */
export { onboardingRoutes, type OnboardingRouteId } from './onboarding.routes';
export {
  INTRO_SLIDES,
  ONBOARDING_STEPS,
  SPLASH_MIN_MS,
  parseStep,
  type IntroSlide,
  type OnboardingStep,
} from './onboarding.constants';

export {
  useLocationPermission,
  useNotificationPermission,
  type BrowserPermission,
  type PermissionState,
} from './hooks/use-browser-permission';
export { useOnboardingFlow, withNext } from './hooks/use-onboarding-flow';

export { SplashView } from './view/SplashView';
export { IntroView } from './view/IntroView';
export { NotificationsPermissionView } from './view/NotificationsPermissionView';
export { LocationPermissionView } from './view/LocationPermissionView';
export { OnboardingFallback } from './view/OnboardingFallback';
