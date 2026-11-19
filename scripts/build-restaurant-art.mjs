/**
 * Generates `public/restaurants/*.svg` — the artwork behind the demo restaurants and their menus.
 *
 * Why generated rather than downloaded: assets.md forbids shipping remote image URLs, the demo
 * restaurants have no photography of their own, and fabricating brand logos for real companies is
 * not something this repo should do. So each cuisine and each menu section gets a flat vector
 * illustration drawn here from plain geometry — no external asset, no third-party mark, no network.
 *
 * One file per key, 640x400, with the subject centred so the SAME file reads correctly both as a
 * wide restaurant cover and as a square dish tile under `object-cover`.
 *
 * Run: `node scripts/build-restaurant-art.mjs` (the output is committed; this only has to run
 * again when a drawing changes).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'restaurants');

const W = 640;
const H = 400;
const CX = 320;
const CY = 200;

/** `[background from, background to, ink, accent]` */
const PALETTE = {
  burger: ['#FFF1E0', '#FFDCB8', '#C2410C', '#F59E0B'],
  chicken: ['#FFF4E5', '#FFE1BC', '#B45309', '#F97316'],
  pizza: ['#FFEFE6', '#FFD6BC', '#DC2626', '#F59E0B'],
  sushi: ['#E8F4FF', '#CBE4FF', '#0369A1', '#F43F5E'],
  national: ['#FDEDE8', '#F6D6C8', '#9A3412', '#EA580C'],
  sides: ['#FFF9E0', '#FFEDAF', '#CA8A04', '#DC2626'],
  soup: ['#FFF2E8', '#FFDFC9', '#C2410C', '#F59E0B'],
  dessert: ['#FFEAF2', '#FFD2E4', '#BE185D', '#F472B6'],
  drinks: ['#E9F7F3', '#C9EADF', '#0F766E', '#F59E0B'],
  breakfast: ['#FFF7E2', '#FFEABC', '#B45309', '#F59E0B'],
  coffee: ['#F2EBE4', '#DFD0C2', '#78350F', '#B45309'],
};

/** Each drawing is centred on (320, 200) and stays inside a 400x300 box. */
const GLYPH = {
  // stacked bun / lettuce / patty / bun
  burger: (ink, accent) => `
    <path d="M180 170a140 95 0 0 1 280 0z" fill="${accent}"/>
    <circle cx="265" cy="128" r="7" fill="#FFFFFF" opacity=".75"/>
    <circle cx="320" cy="112" r="7" fill="#FFFFFF" opacity=".75"/>
    <circle cx="375" cy="128" r="7" fill="#FFFFFF" opacity=".75"/>
    <path d="M176 176h288a10 10 0 0 1 0 20H176a10 10 0 0 1 0-20z" fill="#65A30D"/>
    <rect x="178" y="200" width="284" height="34" rx="14" fill="${ink}"/>
    <path d="M180 240h280a92 60 0 0 1-280 0z" fill="${accent}"/>`,

  // drumstick
  chicken: (ink, accent) => `
    <rect x="268" y="96" width="104" height="150" rx="52" fill="${accent}" transform="rotate(-18 320 170)"/>
    <path d="M300 236c-26 0-46 18-46 40s20 38 46 38 46-16 46-38-20-40-46-40z" fill="${ink}" opacity=".15"/>
    <rect x="296" y="236" width="20" height="74" rx="10" fill="#F5E7D5" transform="rotate(-18 306 273)"/>
    <circle cx="288" cy="312" r="24" fill="#F5E7D5"/>
    <circle cx="330" cy="300" r="20" fill="#F5E7D5"/>
    <circle cx="300" cy="150" r="12" fill="#FFFFFF" opacity=".45"/>`,

  // slice
  pizza: (ink, accent) => `
    <path d="M320 80 190 300h260z" fill="#FDE68A"/>
    <path d="M320 80 190 300h260z" fill="none" stroke="${accent}" stroke-width="14" stroke-linejoin="round"/>
    <circle cx="320" cy="170" r="16" fill="${ink}"/>
    <circle cx="272" cy="240" r="16" fill="${ink}"/>
    <circle cx="364" cy="246" r="16" fill="${ink}"/>
    <circle cx="320" cy="262" r="10" fill="${ink}" opacity=".6"/>`,

  // two maki rolls
  sushi: (ink, accent) => `
    <rect x="156" y="150" width="140" height="140" rx="36" fill="${ink}"/>
    <rect x="178" y="172" width="96" height="96" rx="26" fill="#FFFFFF"/>
    <circle cx="226" cy="220" r="26" fill="${accent}"/>
    <rect x="344" y="150" width="140" height="140" rx="36" fill="${ink}"/>
    <rect x="366" y="172" width="96" height="96" rx="26" fill="#FFFFFF"/>
    <circle cx="414" cy="220" r="26" fill="${accent}"/>
    <rect x="196" y="110" width="248" height="16" rx="8" fill="${ink}" opacity=".25"/>`,

  // skewer
  national: (ink, accent) => `
    <rect x="150" y="192" width="340" height="12" rx="6" fill="#9CA3AF"/>
    <ellipse cx="238" cy="198" rx="54" ry="42" fill="${ink}"/>
    <ellipse cx="320" cy="198" rx="54" ry="42" fill="${accent}"/>
    <ellipse cx="402" cy="198" rx="54" ry="42" fill="${ink}"/>
    <path d="M196 274h248" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity=".45"/>
    <path d="M214 300h212" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity=".25"/>`,

  // fries carton
  sides: (ink, accent) => `
    <rect x="276" y="96" width="24" height="120" rx="12" fill="#FDE68A" transform="rotate(-14 288 156)"/>
    <rect x="308" y="84" width="24" height="132" rx="12" fill="#FDE68A"/>
    <rect x="340" y="96" width="24" height="120" rx="12" fill="#FDE68A" transform="rotate(14 352 156)"/>
    <path d="M238 196h164l-20 124H258z" fill="${accent}"/>
    <path d="M250 240h140" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" opacity=".7"/>
    <path d="M238 196h164l-20 124H258z" fill="none" stroke="${ink}" stroke-width="10" stroke-linejoin="round" opacity=".25"/>`,

  // bowl
  soup: (ink, accent) => `
    <path d="M168 198h304c0 74-68 122-152 122S168 272 168 198z" fill="${accent}"/>
    <ellipse cx="320" cy="198" rx="152" ry="30" fill="${ink}" opacity=".18"/>
    <rect x="150" y="186" width="340" height="22" rx="11" fill="${ink}"/>
    <path d="M276 140c0-22 24-22 24-44M320 136c0-22 24-22 24-44M364 140c0-22 24-22 24-44"
      stroke="${ink}" stroke-width="12" stroke-linecap="round" fill="none" opacity=".45"/>`,

  // cone
  dessert: (ink, accent) => `
    <path d="M250 212h140l-70 148z" fill="#E8A75C"/>
    <path d="M268 240l104 0M280 266l80 0M292 292l56 0" stroke="#C07C2C" stroke-width="8" stroke-linecap="round"/>
    <circle cx="282" cy="186" r="48" fill="${accent}"/>
    <circle cx="358" cy="186" r="48" fill="#FFFFFF"/>
    <circle cx="320" cy="140" r="48" fill="${ink}"/>
    <circle cx="320" cy="92" r="12" fill="${accent}"/>`,

  // cup with straw
  drinks: (ink, accent) => `
    <rect x="352" y="80" width="18" height="120" rx="9" fill="${accent}" transform="rotate(14 361 140)"/>
    <path d="M232 160h176l-22 180H254z" fill="${ink}"/>
    <rect x="218" y="140" width="204" height="30" rx="15" fill="${ink}"/>
    <path d="M258 220h124" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" opacity=".5"/>
    <path d="M264 266h112" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" opacity=".3"/>`,

  // toast + egg
  breakfast: (ink, accent) => `
    <path d="M196 170c0-30 26-54 58-54h132c32 0 58 24 58 54v120c0 16-14 30-32 30H228c-18 0-32-14-32-30z" fill="#F7D9A0"/>
    <path d="M196 170c0-30 26-54 58-54h132c32 0 58 24 58 54v120c0 16-14 30-32 30H228c-18 0-32-14-32-30z" fill="none" stroke="${accent}" stroke-width="12"/>
    <ellipse cx="320" cy="230" rx="84" ry="62" fill="#FFFFFF"/>
    <circle cx="320" cy="230" r="32" fill="${accent}"/>`,

  // cup + saucer
  coffee: (ink, accent) => `
    <path d="M276 108c0-18 20-18 20-36M320 104c0-18 20-18 20-36M364 108c0-18 20-18 20-36"
      stroke="${ink}" stroke-width="12" stroke-linecap="round" fill="none" opacity=".4"/>
    <path d="M206 150h228v70c0 50-40 86-114 86s-114-36-114-86z" fill="${ink}"/>
    <path d="M434 170h22c26 0 44 18 44 42s-18 42-44 42h-22" fill="none" stroke="${ink}" stroke-width="20" stroke-linecap="round"/>
    <ellipse cx="320" cy="326" rx="160" ry="24" fill="${accent}" opacity=".55"/>
    <ellipse cx="320" cy="150" rx="114" ry="22" fill="#FFFFFF" opacity=".25"/>`,
};

function svg(key) {
  const [from, to, ink, accent] = PALETTE[key];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${CX - 230}" cy="${CY - 140}" r="110" fill="#FFFFFF" opacity=".28"/>
  <circle cx="${CX + 250}" cy="${CY + 160}" r="140" fill="#FFFFFF" opacity=".22"/>
  ${GLYPH[key](ink, accent).trim()}
</svg>
`;
}

await mkdir(OUT, { recursive: true });
for (const key of Object.keys(PALETTE)) {
  await writeFile(join(OUT, `${key}.svg`), svg(key), 'utf8');
}
console.log(`restaurant art: wrote ${Object.keys(PALETTE).length} files to public/restaurants/`);
