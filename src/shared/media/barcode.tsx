/**
 * Loyalty-card barcode — a real **Code 128** symbol, rendered as SVG.
 *
 * Measured from `html/app-core/app-card-bonus.html` (node `XYm9S`): white plate,
 * radius 28, padding 28, gap 14, bars 84 high; card number beneath in 16/600
 * with 3 px letter-spacing. The `fullscreen` variant backs "Kassada göstər"
 * (app-core.md §5) with much larger bars on a full white field.
 *
 * The encoder is `@/core/lib/barcode` (agent F5) — never a second copy.
 */
import type { ReactNode } from 'react';

import { CODE128_QUIET_ZONE, code128Bars } from '@/core/lib/barcode';
import { cn } from '@/core/lib/cn';

export interface BarcodeProps {
  /** The card number the cashier scans. */
  value: string;
  /** Text under the bars. Defaults to `value`; pass `false` to hide it. */
  display?: string | false;
  /** Bar height in px. Default 84 (the card block), 180 in `fullscreen`. */
  height?: number;
  /** "Kassada göstər" variant: large bars on a full white field. */
  fullscreen?: boolean;
  /** Accessible name for the symbol. Defaults to `value`. */
  label?: string;
  /** Hint under the number — e.g. the max-brightness note. */
  caption?: ReactNode;
  className?: string;
}

export function Barcode({
  value,
  display,
  height,
  fullscreen = false,
  label,
  caption,
  className,
}: BarcodeProps) {
  const { bars, totalModules } = code128Bars(value);
  const span = totalModules + CODE128_QUIET_ZONE * 2;
  const barHeight = height ?? (fullscreen ? 180 : 84);
  const text = display === false ? null : (display ?? value);

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center bg-white',
        fullscreen ? 'gap-5 rounded-modal p-8' : 'gap-[14px] rounded-xl p-7',
        className,
      )}
      // The cashier screen asks for maximum brightness; the web platform cannot
      // set it, so the plate stays pure white and the hint is the `caption`.
      data-fullscreen={fullscreen || undefined}
    >
      <svg
        role="img"
        aria-label={label ?? value}
        viewBox={`0 0 ${span} 100`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        style={{ height: barHeight }}
        // `block` is the darkest token in both themes (#111 / #2A2724), so the
        // symbol stays scannable on the constant white plate.
        className="w-full text-block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {bars.map((bar) => (
          <rect
            key={`${bar.x}-${bar.width}`}
            x={bar.x + CODE128_QUIET_ZONE}
            y={0}
            width={bar.width}
            height={100}
            fill="currentColor"
          />
        ))}
      </svg>

      {text ? (
        <p
          className={cn(
            // `block` / `on-block3` rather than `ink`: the plate is constant white.
            'oz-num m-0 text-block',
            fullscreen ? 'text-h4 font-bold' : 'text-body font-semibold',
          )}
          style={{ letterSpacing: '3px' }}
        >
          {text}
        </p>
      ) : null}

      {caption ? (
        <div className="text-caption font-medium text-on-block3">{caption}</div>
      ) : null}
    </div>
  );
}
