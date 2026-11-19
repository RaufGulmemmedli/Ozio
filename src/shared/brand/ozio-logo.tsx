/**
 * Ozio wordmark — the ONLY way the logo may be rendered (BUILD-CONTRACT rule 10).
 *
 * Source: `public/logo.svg` (281x122, 11 shapes: 5 rect bars + 1 rotated bar,
 * 4 plus-mark paths, 2 "o" rings). Transcribed inline with `fill="currentColor"`
 * so Ink / Brand / White are CSS-driven (design-system/assets.md §Logo,
 * components.md §1).
 *
 * Sizes: XL 281x122 · M 121x52 · S 84x37 (aspect 2.303:1, min height 32).
 * Never render the word "ozio" as text.
 */
import { cn } from '@/core/lib/cn';

export type OzioLogoSize = 'xl' | 'm' | 's';
export type OzioLogoTone = 'ink' | 'brand' | 'white';

const SIZES: Record<OzioLogoSize, { width: number; height: number }> = {
  xl: { width: 281, height: 122 },
  m: { width: 121, height: 52 },
  s: { width: 84, height: 37 },
};

/** `ink` auto-inverts in dark (token `--oz-ink` is cream there) — assets.md §Logo. */
const TONES: Record<OzioLogoTone, string> = {
  ink: 'text-ink',
  brand: 'text-brand',
  white: 'text-white',
};

export interface OzioLogoProps {
  /** XL 281x122 · M 121x52 · S 84x37. Default `m` (landing nav, app sidebar). */
  size?: OzioLogoSize;
  /** Ink on `bg`/`surface`/`yellow`, Brand on `bg`/`surface`, White on `brand`/`block`. */
  tone?: OzioLogoTone;
  /** Accessible name. Defaults to "Ozio". */
  label?: string;
  /**
   * `true` when the logo sits inside a link/button that already carries the
   * name — the svg then becomes `aria-hidden` (components.md §1).
   */
  decorative?: boolean;
  className?: string;
}

export function OzioLogo({
  size = 'm',
  tone = 'ink',
  label = 'Ozio',
  decorative = false,
  className,
}: OzioLogoProps) {
  const { width, height } = SIZES[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 281 122"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
      className={cn('shrink-0', TONES[tone], className)}
    >
      {/* 6 bars (the "i" stem + dot, the two "z" strokes, the rotated diagonal) */}
      <rect x="131" y="56" width="19" height="61" rx="9.5" />
      <rect x="131" y="34" width="19" height="19" rx="9.5" />
      <rect x="70.0807" y="98.2456" width="57.1444" height="19" rx="9.5" />
      <rect x="72.0807" y="56.2456" width="57.1444" height="19" rx="9.5" />
      <rect
        x="119.707"
        y="53.2035"
        width="18.2804"
        height="76.2461"
        rx="9.14021"
        transform="rotate(44.4477 119.707 53.2035)"
      />
      {/* 4 plus-mark pieces */}
      <path d="M206 29.5C206 24.8056 209.806 21 214.5 21H232.5C237.194 21 241 24.8056 241 29.5V38H214.5C209.806 38 206 34.1944 206 29.5V29.5Z" />
      <path d="M250.5 3C255.194 3 259 6.80558 259 11.5V29.5C259 34.1944 255.194 38 250.5 38H242V11.5C242 6.80558 245.806 3 250.5 3V3Z" />
      <path d="M277 47.5C277 52.1944 273.194 56 268.5 56L250.5 56C245.806 56 242 52.1944 242 47.5V39L268.5 39C273.194 39 277 42.8056 277 47.5V47.5Z" />
      <path d="M232.5 74C227.806 74 224 70.1944 224 65.5V47.5C224 42.8056 227.806 39 232.5 39H241V65.5C241 70.1944 237.194 74 232.5 74V74Z" />
      {/* the two "o" rings */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M38.5 56C57.0015 56 72 69.8792 72 87C72 104.121 57.0015 118 38.5 118C19.9985 118 5 104.121 5 87C5 69.8792 19.9985 56 38.5 56ZM38.5 75C31.5964 75 26 80.5964 26 87.5C26 94.4036 31.5964 100 38.5 100C45.4036 100 51 94.4036 51 87.5C51 80.5964 45.4036 75 38.5 75Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M186.5 56C205.002 56 220 69.8792 220 87C220 104.121 205.002 118 186.5 118C167.998 118 153 104.121 153 87C153 69.8792 167.998 56 186.5 56ZM186.5 75C179.596 75 174 80.5964 174 87.5C174 94.4036 179.596 100 186.5 100C193.404 100 199 94.4036 199 87.5C199 80.5964 193.404 75 186.5 75Z"
      />
    </svg>
  );
}
