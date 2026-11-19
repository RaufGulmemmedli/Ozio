/**
 * QR tile — generated at runtime (assets.md §Imagery: "QR: generate at runtime
 * (app download link) 200x200 white tile, radius 28"), with the "Skan et"
 * 14/600 caption slot (components.md §11 Download block).
 *
 * The matrix comes from `@/core/lib/qr` (agent F5) — byte mode, level M.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { buildQrMatrix, qrToPath } from '@/core/lib/qr';

/** Quiet zone in modules; the spec asks for 4. */
const QUIET_ZONE = 4;

export interface QrCodeViewProps {
  /** What the QR encodes (an app download link, a coupon code, …). */
  value: string;
  /** Accessible name — the raw `value` is rarely useful to a screen reader. */
  label: string;
  /** Tile side in px. Default 200 (the measured download-block card). */
  size?: number;
  /** Caption under the matrix — "Skan et" 14/600. */
  caption?: ReactNode;
  className?: string;
}

export function QrCodeView({ value, label, size = 200, caption, className }: QrCodeViewProps) {
  const matrix = buildQrMatrix(value);
  const span = matrix.size + QUIET_ZONE * 2;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-[14px] rounded-xl bg-white p-[14px]',
        className,
      )}
      style={{ width: size }}
    >
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${span} ${span}`}
        shapeRendering="crispEdges"
        // `block` is the darkest token in both themes — the tile is constant white.
        className="h-auto w-full text-block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={qrToPath(matrix, QUIET_ZONE)} fill="currentColor" />
      </svg>
      {caption ? <div className="text-label font-semibold text-block">{caption}</div> : null}
    </div>
  );
}
