/**
 * The five transport glyphs of the route form (`I6kivj`): footprints · train-front · bus · car ·
 * bike.
 *
 * `@/shared/lucide` only re-exports `Bike` of the five, and BUILD-CONTRACT rule 9 says
 * `lucide-react` may not be imported anywhere else, so the other four are drawn here as local,
 * lucide-shaped strokes (24 grid, `stroke-width: 2`, `currentColor`).
 *
 * // TODO(core): add `Footprints`, `TrainFront`, `Bus` and `Car` to `@/shared/lucide` and delete
 * // the four inline paths below (the design export names those exact lucide icons).
 */
import type { ReactElement, SVGProps } from 'react';

import { Bike } from '@/shared/lucide';

import type { CpTransport } from '../data/models/courier-plus';

type GlyphProps = Omit<SVGProps<SVGSVGElement>, 'ref'> & { size?: number | string };

function Glyph({ size = 24, children, ...rest }: GlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

function FootprintsGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 16v-2.38c0-.62-.15-1.23-.43-1.78C2.69 10.48 2 8.74 2 7a3 3 0 0 1 6 0c0 1.74-.69 3.48-1.57 4.84-.28.55-.43 1.16-.43 1.78V16" />
      <path d="M4 20h2" />
      <path d="M18 16v-2.38c0-.62-.15-1.23-.43-1.78C16.69 10.48 16 8.74 16 7a3 3 0 0 1 6 0c0 1.74-.69 3.48-1.57 4.84-.28.55-.43 1.16-.43 1.78V16" />
      <path d="M18 20h2" />
    </Glyph>
  );
}

function TrainFrontGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M8 3.1V7a4 4 0 0 0 8 0V3.1" />
      <rect x="4" y="3" width="16" height="15" rx="4" />
      <path d="M4 11h16" />
      <path d="M8 18l-2 3" />
      <path d="M16 18l2 3" />
    </Glyph>
  );
}

function BusGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3" y="4" width="18" height="12" rx="3" />
      <path d="M3 10h18" />
      <path d="M12 4v6" />
      <circle cx="7.5" cy="18.5" r="1.5" />
      <circle cx="16.5" cy="18.5" r="1.5" />
      <path d="M6 16v1" />
      <path d="M18 16v1" />
    </Glyph>
  );
}

function CarGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M5 13l1.6-4.3A2 2 0 0 1 8.5 7.4h7a2 2 0 0 1 1.9 1.3L19 13" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1.2" />
      <path d="M5.2 18H4a1 1 0 0 1-1-1v-4" />
      <circle cx="7.5" cy="18" r="2" />
      <circle cx="16.5" cy="18" r="2" />
    </Glyph>
  );
}

function BikeGlyph({ size = 24, className }: GlyphProps) {
  return <Bike size={typeof size === 'number' ? size : 24} className={className} aria-hidden="true" />;
}

/** `walk | metro | bus | car | bike` → the glyph the export draws for it. */
export const CP_TRANSPORT_ICON: Record<CpTransport, (p: GlyphProps) => ReactElement> = {
  walk: FootprintsGlyph,
  metro: TrainFrontGlyph,
  bus: BusGlyph,
  car: CarGlyph,
  bike: BikeGlyph,
};

export interface CpTransportIconProps {
  transport: CpTransport;
  size?: number;
  className?: string;
}

export function CpTransportIcon({ transport, size = 26, className }: CpTransportIconProps) {
  const Icon = CP_TRANSPORT_ICON[transport];
  return <Icon size={size} className={className} aria-hidden="true" />;
}
