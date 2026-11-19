/**
 * Code 128 encoder — dependency-free, no canvas, no image.
 *
 * The loyalty card screen shows a real, scannable barcode of the card number, so this returns the
 * actual module widths and `<Barcode>` renders them as `<rect>`s in an SVG. That keeps the barcode
 * crisp at any size and correct in both themes (bars use `fill-ink`, the quiet zone is the card
 * surface).
 *
 * Supported: Code 128 **B** (every printable ASCII character, 32–126) and Code 128 **C** (pairs of
 * digits, half the width — what a numeric card number uses). `encodeCode128` picks C for an
 * all-digit value of even length and B otherwise.
 *
 * Output: `widths`, the run lengths in modules, alternating **bar, space, bar, space, …** starting
 * with a bar. Every value is 1–4. Add a quiet zone of at least 10 modules on each side.
 */

/**
 * The 107 Code 128 symbols. Each is six digits: the widths of bar, space, bar, space, bar, space.
 * Index 106 is the stop symbol and has seven (it ends with an extra bar).
 */
const PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

const START_B = 104;
const START_C = 105;
const STOP = 106;
/** Switch from Code C to Code B mid-symbol (unused by the two paths below, kept for clarity). */
const CODE_B = 100;

export interface Barcode128 {
  /** The value actually encoded (unsupported characters removed). */
  value: string;
  /** Run lengths in modules, alternating bar, space, bar, …, starting with a bar. */
  widths: number[];
  /** `widths` summed — the barcode's width in modules, excluding the quiet zone. */
  totalModules: number;
  /** Which Code 128 subset was used. */
  subset: 'B' | 'C';
}

/** Only the dark runs, as x offsets and widths in modules — ready for `<rect>`. */
export interface Bar {
  x: number;
  width: number;
}

const isDigits = (s: string): boolean => s.length > 0 && /^\d+$/.test(s);

/** Drops anything Code 128 B cannot carry (control characters, non-Latin letters). */
const sanitize = (value: string): string =>
  [...value].filter((c) => {
    const code = c.charCodeAt(0);
    return code >= 32 && code <= 126;
  }).join('');

function symbolsFor(value: string): { codes: number[]; subset: 'B' | 'C' } {
  if (isDigits(value) && value.length % 2 === 0) {
    const codes = [START_C];
    for (let i = 0; i < value.length; i += 2) codes.push(Number(value.slice(i, i + 2)));
    return { codes, subset: 'C' };
  }
  const codes = [START_B];
  for (const c of value) codes.push(c.charCodeAt(0) - 32);
  return { codes, subset: 'B' };
}

/** Modulo-103 weighted sum: start value + Σ (position × symbol value). */
function checksum(codes: readonly number[]): number {
  let sum = codes[0] ?? START_B;
  for (let i = 1; i < codes.length; i++) sum += i * (codes[i] as number);
  return sum % 103;
}

export function encodeCode128(raw: string): Barcode128 {
  const value = sanitize(raw);
  if (value.length === 0) {
    return { value: '', widths: [], totalModules: 0, subset: 'B' };
  }

  const { codes, subset } = symbolsFor(value);
  codes.push(checksum(codes));
  codes.push(STOP);

  const widths: number[] = [];
  for (const code of codes) {
    const pattern = PATTERNS[code];
    if (pattern === undefined) continue;
    for (const digit of pattern) widths.push(Number(digit));
  }

  return {
    value,
    widths,
    totalModules: widths.reduce((n, w) => n + w, 0),
    subset,
  };
}

/**
 * The dark bars of `value`, as `{ x, width }` in modules.
 *
 * ```tsx
 * const { bars, totalModules } = code128Bars(cardNumber);
 * <svg viewBox={`0 0 ${totalModules} 40`} preserveAspectRatio="none">
 *   {bars.map((b, i) => <rect key={i} x={b.x} y={0} width={b.width} height={40} className="fill-ink" />)}
 * </svg>
 * ```
 */
export function code128Bars(value: string): {
  bars: Bar[];
  totalModules: number;
  value: string;
  subset: 'B' | 'C';
} {
  const encoded = encodeCode128(value);
  const bars: Bar[] = [];
  let x = 0;
  encoded.widths.forEach((width, index) => {
    // even index = bar, odd index = space
    if (index % 2 === 0) bars.push({ x, width });
    x += width;
  });
  return { bars, totalModules: encoded.totalModules, value: encoded.value, subset: encoded.subset };
}

/** Quiet zone the spec asks for, in modules, on each side. */
export const CODE128_QUIET_ZONE = 10;

export { CODE_B as CODE128_SWITCH_B };
