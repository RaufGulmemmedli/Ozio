/**
 * QR encoder — dependency-free. Byte mode (UTF-8), error-correction level **M**, versions 1–10
 * (up to 216 bytes), which covers everything the app encodes: referral links, the loyalty card
 * number, a parcel hand-over code, an order reference.
 *
 * `buildQrMatrix(text)` returns the finished module matrix; `<QrCodeView>` renders it as one SVG
 * path so it stays crisp and themeable (`fill-ink` on `bg-surface`).
 *
 * Standards detail, for anyone changing this: data is split into RS blocks per the level-M table,
 * each block gets `ecPerBlock` Reed–Solomon codewords over GF(256) with the primitive polynomial
 * 0x11D, blocks are interleaved, and all 8 data masks are scored with the four penalty rules from
 * the spec so the lowest-penalty one wins. Throws when the text does not fit in version 10.
 */

/** [ecCodewordsPerBlock, blocksInGroup1, dataPerBlock1, blocksInGroup2, dataPerBlock2] for level M. */
const EC_M: Readonly<Record<number, readonly [number, number, number, number, number]>> = {
  1: [10, 1, 16, 0, 0],
  2: [16, 1, 28, 0, 0],
  3: [26, 1, 44, 0, 0],
  4: [18, 2, 32, 0, 0],
  5: [24, 2, 43, 0, 0],
  6: [16, 4, 27, 0, 0],
  7: [18, 4, 31, 0, 0],
  8: [22, 2, 38, 2, 39],
  9: [22, 3, 36, 2, 37],
  10: [26, 4, 43, 1, 44],
};

/** Alignment-pattern centre coordinates per version. */
const ALIGN: Readonly<Record<number, readonly number[]>> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

/** 15-bit format strings for level M, indexed by mask. */
const FORMAT_M = [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0];

/** 18-bit version strings, versions 7+. */
const VERSION_BITS: Readonly<Record<number, number>> = {
  7: 0x07c94,
  8: 0x085bc,
  9: 0x09a99,
  10: 0x0a4d3,
};

const MASKS: ReadonlyArray<(i: number, j: number) => boolean> = [
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (_i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0,
];

/* ---------------------------------------------------------------- GF(256) + Reed–Solomon */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

const gfMul = (a: number, b: number): number => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/** Coefficients of ∏(x − α^i), highest degree first. */
function rsGenerator(degree: number): number[] {
  let g = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      next[j] ^= g[j];
      next[j + 1] ^= gfMul(g[j], EXP[i]);
    }
    g = next;
  }
  return g;
}

function rsEncode(data: readonly number[], ecLength: number): number[] {
  const gen = rsGenerator(ecLength);
  const rest = new Array<number>(ecLength).fill(0);
  for (const byte of data) {
    const factor = byte ^ rest[0];
    rest.shift();
    rest.push(0);
    if (factor !== 0) for (let i = 0; i < ecLength; i++) rest[i] ^= gfMul(gen[i + 1], factor);
  }
  return rest;
}

/* ---------------------------------------------------------------- bit stream */

const dataCodewordsFor = (version: number): number => {
  const [, b1, d1, b2, d2] = EC_M[version];
  return b1 * d1 + b2 * d2;
};

function pickVersion(byteLength: number, minVersion: number): number {
  for (let v = Math.max(1, minVersion); v <= 10; v++) {
    const headerBits = 4 + (v < 10 ? 8 : 16);
    if (headerBits + byteLength * 8 <= dataCodewordsFor(v) * 8) return v;
  }
  throw new Error(`qr: ${byteLength} bytes do not fit in version 10 at level M (max 213)`);
}

function dataCodewords(bytes: Uint8Array, version: number): number[] {
  const capacity = dataCodewordsFor(version);
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };

  push(0b0100, 4); // byte mode
  push(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) push(byte, 8);
  push(0, Math.min(4, capacity * 8 - bits.length)); // terminator
  while (bits.length % 8 !== 0) bits.push(0);

  const words: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    words.push(byte);
  }
  const pad = [0xec, 0x11];
  for (let i = 0; words.length < capacity; i++) words.push(pad[i % 2]);
  return words;
}

/** Splits into RS blocks, encodes each, and interleaves data then EC, as the spec requires. */
function interleave(words: readonly number[], version: number): number[] {
  const [ecPerBlock, b1, d1, b2, d2] = EC_M[version];
  const blocks: Array<{ data: number[]; ec: number[] }> = [];
  let offset = 0;
  for (const [count, size] of [
    [b1, d1],
    [b2, d2],
  ]) {
    for (let i = 0; i < count; i++) {
      const data = words.slice(offset, offset + size);
      offset += size;
      blocks.push({ data, ec: rsEncode(data, ecPerBlock) });
    }
  }
  const out: number[] = [];
  const longest = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < longest; i++) {
    for (const block of blocks) if (i < block.data.length) out.push(block.data[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) for (const block of blocks) out.push(block.ec[i]);
  return out;
}

/* ---------------------------------------------------------------- matrix */

export interface QrMatrix {
  /** Modules per side (21 for version 1, +4 per version). */
  size: number;
  version: number;
  /** `modules[row][col]` — `true` is dark. */
  modules: boolean[][];
  /** The data mask that scored best. */
  mask: number;
}

const grid = (size: number): boolean[][] =>
  Array.from({ length: size }, () => new Array<boolean>(size).fill(false));

export function buildQrMatrix(text: string, opts?: { minVersion?: number }): QrMatrix {
  const bytes = new TextEncoder().encode(text);
  const version = pickVersion(bytes.length, opts?.minVersion ?? 1);
  const size = version * 4 + 17;
  const codewords = interleave(dataCodewords(bytes, version), version);

  const modules = grid(size);
  const isFunction = grid(size);
  const set = (r: number, c: number, dark: boolean) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    modules[r][c] = dark;
    isFunction[r][c] = true;
  };

  // finder patterns (with their separators: distance 4 is always light)
  for (const [fr, fc] of [
    [3, 3],
    [3, size - 4],
    [size - 4, 3],
  ]) {
    for (let dr = -4; dr <= 4; dr++) {
      for (let dc = -4; dc <= 4; dc++) {
        const d = Math.max(Math.abs(dr), Math.abs(dc));
        set(fr + dr, fc + dc, d !== 2 && d !== 4);
      }
    }
  }

  // timing patterns (finders win where they overlap)
  for (let i = 0; i < size; i++) {
    if (!isFunction[6][i]) set(6, i, i % 2 === 0);
    if (!isFunction[i][6]) set(i, 6, i % 2 === 0);
  }

  // alignment patterns, skipping the three that would sit on a finder
  const centres = ALIGN[version];
  const first = centres[0];
  const last = centres[centres.length - 1];
  for (const r of centres) {
    for (const c of centres) {
      if ((r === first && c === first) || (r === first && c === last) || (r === last && c === first)) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
        }
      }
    }
  }

  const drawFormat = (bits: number) => {
    const bit = (i: number) => ((bits >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(i, 8, bit(i));
    set(7, 8, bit(6));
    set(8, 8, bit(7));
    set(8, 7, bit(8));
    for (let i = 9; i < 15; i++) set(8, 14 - i, bit(i));
    for (let i = 0; i < 8; i++) set(8, size - 1 - i, bit(i));
    for (let i = 8; i < 15; i++) set(size - 15 + i, 8, bit(i));
    set(size - 8, 8, true); // the always-dark module
  };

  // Reserve the format area before data placement; the real bits are drawn per mask below.
  drawFormat(0);

  if (version >= 7) {
    const bits = VERSION_BITS[version];
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(b, a, dark);
      set(a, b, dark);
    }
  }

  // data, zig-zagging up and down two columns at a time from the bottom right
  let bitIndex = 0;
  const nextBit = (): boolean => {
    const byte = codewords[bitIndex >> 3];
    const bit = byte === undefined ? false : ((byte >>> (7 - (bitIndex & 7))) & 1) === 1;
    bitIndex++;
    return bit;
  };
  let row = size - 1;
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5; // the vertical timing pattern is not a data column
    for (;;) {
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (!isFunction[row][cc]) modules[row][cc] = nextBit();
      }
      row += up ? -1 : 1;
      if (row < 0 || row >= size) {
        row -= up ? -1 : 1;
        up = !up;
        break;
      }
    }
  }

  // pick the mask with the lowest penalty
  let best = { mask: 0, score: Number.POSITIVE_INFINITY, grid: modules };
  for (let mask = 0; mask < 8; mask++) {
    const candidate = modules.map((r) => [...r]);
    const fn = MASKS[mask];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!isFunction[r][c] && fn(r, c)) candidate[r][c] = !candidate[r][c];
      }
    }
    // the format bits belong to this mask, so they are part of what gets scored
    const target = candidate;
    const write = (r: number, c: number, dark: boolean) => {
      if (r >= 0 && r < size && c >= 0 && c < size) target[r][c] = dark;
    };
    const bits = FORMAT_M[mask];
    const bit = (i: number) => ((bits >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) write(i, 8, bit(i));
    write(7, 8, bit(6));
    write(8, 8, bit(7));
    write(8, 7, bit(8));
    for (let i = 9; i < 15; i++) write(8, 14 - i, bit(i));
    for (let i = 0; i < 8; i++) write(8, size - 1 - i, bit(i));
    for (let i = 8; i < 15; i++) write(size - 15 + i, 8, bit(i));

    const score = penalty(candidate);
    if (score < best.score) best = { mask, score, grid: candidate };
  }

  return { size, version, modules: best.grid, mask: best.mask };
}

/** The four penalty rules from the spec. Lower is better. */
function penalty(g: readonly boolean[][]): number {
  const n = g.length;
  let score = 0;

  // 1 — runs of five or more same-coloured modules in a row or column
  for (const read of [(i: number, j: number) => g[i][j], (i: number, j: number) => g[j][i]]) {
    for (let i = 0; i < n; i++) {
      let run = 1;
      for (let j = 1; j < n; j++) {
        if (read(i, j) === read(i, j - 1)) {
          run++;
        } else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
        }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
  }

  // 2 — every 2x2 block of one colour
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1; j++) {
      const v = g[i][j];
      if (v === g[i][j + 1] && v === g[i + 1][j] && v === g[i + 1][j + 1]) score += 3;
    }
  }

  // 3 — the finder-like 1:1:3:1:1 sequence with four light modules on either side
  const pattern = [true, false, true, true, true, false, true];
  for (let i = 0; i < n; i++) {
    for (const horizontal of [true, false]) {
      const at = (k: number) => (k < 0 || k >= n ? false : horizontal ? g[i][k] : g[k][i]);
      for (let j = 0; j <= n - 7; j++) {
        if (!pattern.every((p, k) => at(j + k) === p)) continue;
        const before = [-4, -3, -2, -1].every((d) => !at(j + d));
        const after = [7, 8, 9, 10].every((d) => !at(j + d));
        if (before || after) score += 40;
      }
    }
  }

  // 4 — deviation from a 50 % dark ratio, in 5 % steps
  let dark = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (g[i][j]) dark++;
  score += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;

  return score;
}

/**
 * The dark modules as one SVG path, for `<QrCodeView>`:
 *
 * ```tsx
 * const qr = buildQrMatrix(url);
 * <svg viewBox={`0 0 ${qr.size + 8} ${qr.size + 8}`} shapeRendering="crispEdges">
 *   <path d={qrToPath(qr, 4)} className="fill-ink" />
 * </svg>
 * ```
 *
 * `quietZone` is in modules (the spec asks for 4) and shifts the path, so the viewBox is
 * `size + 2 * quietZone`.
 */
export function qrToPath(qr: QrMatrix, quietZone = 4): string {
  const parts: string[] = [];
  for (let r = 0; r < qr.size; r++) {
    let c = 0;
    while (c < qr.size) {
      if (!qr.modules[r][c]) {
        c++;
        continue;
      }
      let run = 1;
      while (c + run < qr.size && qr.modules[r][c + run]) run++;
      parts.push(`M${c + quietZone} ${r + quietZone}h${run}v1h-${run}z`);
      c += run;
    }
  }
  return parts.join('');
}

/** Largest byte length that fits at level M, version 10 (216 codewords − a 20-bit header). */
export const QR_MAX_BYTES = 213;
