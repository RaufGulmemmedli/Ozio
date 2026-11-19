/**
 * The twelve glyphs the viral export uses that `@/shared/lucide` does not re-export yet.
 *
 * TODO(core): add `TrendingDown`, `Radio`, `Tv`, `Watch`, `CookingPot`, `Bot`, `Link`, `Send`,
 * `HandCoins`, `PartyPopper`, `Hourglass` and `HeartHandshake` to `src/shared/lucide.ts` and
 * delete this file. Hard rule 9 allows `lucide-react` in exactly one place, so these are
 * hand-drawn in the same 24×24 / stroke-2 / round-cap geometry. Every other icon on these screens
 * comes from `@/shared/lucide`.
 *
 * They are `forwardRef` components typed with `LucideProps`, which makes each one structurally a
 * `LucideIcon` — so `<EmptyState icon={PartyPopper}>` type-checks exactly as it does with a real
 * lucide glyph and the swap above is a pure deletion.
 */
import { forwardRef, type ReactNode } from 'react';

import type { LucideIcon, LucideProps } from '@/shared/lucide';

function glyph(name: string, paths: ReactNode): LucideIcon {
  const Icon = forwardRef<SVGSVGElement, LucideProps>(function Icon(
    { size = 24, strokeWidth = 2, absoluteStrokeWidth, ...rest },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={
          absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth
        }
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {paths}
      </svg>
    );
  });
  Icon.displayName = name;
  return Icon;
}

/** `trending-down` — the price-drop game's mark. */
export const TrendingDown = glyph(
  'TrendingDown',
  <>
    <path d="M16 17h6v-6" />
    <path d="m22 17-8.5-8.5-5 5L2 7" />
  </>,
);

/** `radio` — the "Canlı" pill. */
export const Radio = glyph(
  'Radio',
  <>
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
    <circle cx="12" cy="12" r="2" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
  </>,
);

/** `tv` — the 55" television auction. */
export const Tv = glyph(
  'Tv',
  <>
    <path d="m17 2-5 5-5-5" />
    <rect width="20" height="15" x="2" y="7" rx="2" />
  </>,
);

/** `watch` — the smart-watch auction. */
export const Watch = glyph(
  'Watch',
  <>
    <circle cx="12" cy="12" r="6" />
    <path d="M12 10v2l1.5 1.5" />
    <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83" />
    <path d="M7.49 6.65l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83" />
  </>,
);

/** `cooking-pot` — the blender-set auction. */
export const CookingPot = glyph(
  'CookingPot',
  <>
    <path d="M2 12h20" />
    <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
    <path d="m4 8 16-4" />
    <path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8" />
  </>,
);

/** `bot` — the robot-vacuum gift. */
export const Bot = glyph(
  'Bot',
  <>
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </>,
);

/** `link` — the share link field. */
export const Link2 = glyph(
  'Link2',
  <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </>,
);

/** `send` — "WhatsApp-da paylaş". */
export const Send = glyph(
  'Send',
  <>
    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
    <path d="m21.854 2.147-10.94 10.939" />
  </>,
);

/** `hand-coins` — "İştirak et". */
export const HandCoins = glyph(
  'HandCoins',
  <>
    <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
    <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
    <path d="m2 16 6 6" />
    <circle cx="16" cy="9" r="2.9" />
    <circle cx="6" cy="5" r="3" />
  </>,
);

/** `party-popper` — the "Hədiyyə tam yığıldı" state. */
export const PartyPopper = glyph(
  'PartyPopper',
  <>
    <path d="M5.8 11.3 2 22l10.7-3.79" />
    <path d="M4 3h.01" />
    <path d="M22 8h.01" />
    <path d="M15 2h.01" />
    <path d="M22 20h.01" />
    <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 11" />
    <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H16" />
    <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7" />
    <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />
  </>,
);

/** `hourglass` — the "Qaçırdın" state. */
export const Hourglass = glyph(
  'Hourglass',
  <>
    <path d="M5 22h14" />
    <path d="M5 2h14" />
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
  </>,
);

/** `heart-handshake` — the thank-you dialog. */
export const HeartHandshake = glyph(
  'HeartHandshake',
  <>
    <path d="M13.5 19.5 12 21l-7-7a5.5 5.5 0 0 1 7-8.4 5.5 5.5 0 0 1 7 8.4l-1 1" />
    <path d="m12 5.4-1.6 1.6a2 2 0 0 0 0 2.8l.5.5a2 2 0 0 0 2.8 0l1.6-1.6 3 3a2 2 0 0 1 0 2.8l-.6.6a2 2 0 0 1-2.8 0l-1.6-1.6" />
    <path d="m15.5 15.5 1.5 1.5" />
  </>,
);
