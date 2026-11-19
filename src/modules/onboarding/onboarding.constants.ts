/** Constants for the onboarding module. */

/** Minimum splash display time, so a warm boot does not flash the animation. */
export const SPLASH_MIN_MS = 1_200;

/** `/onboarding?step=1..3` — Kart · Lotereya · Çatdırılma. */
export const ONBOARDING_STEPS = [1, 2, 3] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** The three slides, in order. The copy lives in `messages/parts/onboarding.json`. */
export const INTRO_SLIDES = ['card', 'lottery', 'delivery'] as const;
export type IntroSlide = (typeof INTRO_SLIDES)[number];

/** `?step=` → a valid step, defaulting to 1. */
export function parseStep(raw: string | null | undefined): OnboardingStep {
  const n = Number(raw);
  return n === 2 || n === 3 ? n : 1;
}
