/**
 * Demo fixtures for the recognition mock.
 *
 * `mock-modules.md` §6 is explicit: the mock **rotates through 3 fixed sample sets regardless of
 * the photo** and waits ~2.2 s. The sets below are those three, with the `ru`/`en` label text
 * added so the chips read correctly in every locale (BUILD-CONTRACT: fixtures carry az/ru/en).
 *
 * Nothing here is derived from the uploaded image — that is the whole point of the demo notice.
 */

export type FixtureLocale = 'az' | 'ru' | 'en';

export interface FixtureLabel {
  confidence: number;
  name: Record<FixtureLocale, string>;
}

/** The three rotating sample sets, confidences straight from `IMAGE_SEARCH_SAMPLES`. */
export const RECOGNITION_SAMPLES: readonly (readonly FixtureLabel[])[] = [
  [
    { confidence: 0.94, name: { az: 'süd', ru: 'молоко', en: 'milk' } },
    { confidence: 0.71, name: { az: 'kefir', ru: 'кефир', en: 'kefir' } },
    { confidence: 0.58, name: { az: 'ayran', ru: 'айран', en: 'ayran' } },
    { confidence: 0.42, name: { az: 'qatıq', ru: 'катык', en: 'yoghurt' } },
  ],
  [
    { confidence: 0.91, name: { az: 'banan', ru: 'банан', en: 'banana' } },
    { confidence: 0.63, name: { az: 'alma', ru: 'яблоко', en: 'apple' } },
    { confidence: 0.47, name: { az: 'meyvə', ru: 'фрукты', en: 'fruit' } },
  ],
  [
    { confidence: 0.88, name: { az: 'çörək', ru: 'хлеб', en: 'bread' } },
    { confidence: 0.66, name: { az: 'lavaş', ru: 'лаваш', en: 'lavash' } },
    { confidence: 0.39, name: { az: 'un', ru: 'мука', en: 'flour' } },
  ],
] as const;

/**
 * The 4th outcome the screens need and the Flutter mock has no sample for: an image the model
 * cannot label at all (`labels: []` → the "Məhsulu tanıya bilmədik" screen). It is reachable from
 * the UI through `?preview=not-recognized` and from the mock through `?outcome=none`.
 */
export const RECOGNITION_NONE: readonly FixtureLabel[] = [] as const;

export const localizeLabel = (label: FixtureLabel, locale: string): string =>
  label.name[(locale as FixtureLocale) in label.name ? (locale as FixtureLocale) : 'az'];

/** `mock-contracts.ts` `MOCK_LATENCY_MS.imageRecognize`. */
export const RECOGNIZE_LATENCY_MS = 2_200;

/** The client-side size cap from the screen spec (`screens/…` §2): 10 MB. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Longest edge the captured frame is downscaled to before it is handed to the recogniser. */
export const DOWNSCALE_MAX_EDGE = 1024;

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
