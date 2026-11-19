'use client';

/**
 * The prize wheel (N1), rebuilt as CSS + SVG from `wheel.html`.
 *
 * Geometry from the export: rim 560 (`$yellow`), wheel 540 with 8 equal 45° wedges, hub 124
 * (`$bg` with a 6px `$block` ring, label "FIRLAT"), brand pointer at 12 o'clock. Everything scales
 * with the container, so the same markup works at 390 / 768 / 1440.
 *
 * **The prize is never chosen here.** The view posts a spin, the mock API answers with an index,
 * and only then does this component animate: `rotation` eases to the angle that parks that slice
 * under the pointer, always forwards, always a whole number of extra turns. `prefers-reduced-motion`
 * skips the animation and settles immediately.
 */
import { useMemo, type CSSProperties } from 'react';

import { cn } from '@/core/lib/cn';
import type { WheelSegment, WheelTone } from '../data/models/wheel';

/** Easing + duration of the spin (motion.md: long ease-out, no bounce). */
export const SPIN_MS = 4000;
const SPIN_EASE = 'cubic-bezier(0.12, 0.68, 0.08, 1)';
const SPIN_TURNS = 5;

const VIEW = 560;
const WHEEL = 540;
const R = WHEEL / 2;
/** Where the labels sit, measured from the export (label centre 184px from the hub). */
const LABEL_R = 184;

const FILL: Record<WheelTone, string> = {
  brand: 'var(--oz-brand)',
  yellow: 'var(--oz-yellow)',
  sky: 'var(--oz-sky-soft)',
  violet: 'var(--oz-violet-soft)',
  success: 'var(--oz-success-soft)',
};

/** White on the brand slices is the one colour the design system keeps literal. */
const LABEL_FILL: Record<WheelTone, string> = {
  brand: 'var(--oz-white)',
  yellow: 'var(--oz-on-yellow)',
  sky: 'var(--oz-ink)',
  violet: 'var(--oz-ink)',
  success: 'var(--oz-ink)',
};

/** Point on the wheel at `deg`, measured clockwise from 12 o'clock. */
function pointAt(deg: number, radius: number): [number, number] {
  const t = (deg * Math.PI) / 180;
  return [R + radius * Math.sin(t), R - radius * Math.cos(t)];
}

/** Wedge `index` of `count`, running counter-clockwise from the pointer as the export paints it. */
function wedgePath(index: number, count: number): string {
  const step = 360 / count;
  const [x0, y0] = pointAt(-(index * step), R);
  const [x1, y1] = pointAt(-((index + 1) * step), R);
  const largeArc = step > 180 ? 1 : 0;
  return `M ${R} ${R} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${largeArc} 0 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

/** Rotation that parks the centre of slice `index` under the pointer. */
function angleFor(index: number, count: number): number {
  const step = 360 / count;
  return index * step + step / 2;
}

/** The export wraps a long label onto two lines inside a 96px box. */
function wrapLabel(label: string): string[] {
  const text = label.replace(/\s+/g, ' ').trim();
  if (text.length <= 11 || !text.includes(' ')) return [text];
  const middle = Math.floor(text.length / 2);
  let cut = text.lastIndexOf(' ', middle);
  if (cut <= 0) cut = text.indexOf(' ', middle);
  if (cut <= 0) return [text];
  return [text.slice(0, cut), text.slice(cut + 1)];
}

/**
 * Read **only inside an event handler**, never during render (a render-time media read differs
 * between the server pass and the client and would break hydration). The wheel itself handles
 * reduced motion in CSS (`motion-reduce:transition-none`); this tells the caller how long to wait
 * before revealing the prize.
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/** How long the caller should wait after a spin before showing the result. */
export const spinRevealDelayMs = (): number => (prefersReducedMotion() ? 0 : SPIN_MS + 80);

export interface PrizeWheelProps {
  segments: WheelSegment[];
  /** Label per segment, already localized and already money-formatted where it is an amount. */
  labels: string[];
  /** The slice the server picked, or `null` while idle. */
  targetIndex: number | null;
  /**
   * Incremented by the caller on every spin. The rotation is derived from it
   * (`token × 5 turns + the slice angle`), so the wheel always travels forwards, the same slice can
   * be won twice in a row, and this component keeps no state of its own.
   */
  spinToken: number;
  /** The hub doubles as a spin control ("FIRLAT"). */
  onSpin?: () => void;
  spinDisabled?: boolean;
  /** `aria-label` of the whole wheel, listing the prizes. */
  wheelLabel: string;
  hubLabel: string;
  hubAriaLabel: string;
  className?: string;
}

export function PrizeWheel({
  segments,
  labels,
  targetIndex,
  spinToken,
  onSpin,
  spinDisabled = false,
  wheelLabel,
  hubLabel,
  hubAriaLabel,
  className,
}: PrizeWheelProps) {
  const count = segments.length;

  // Derived, not stored: no effect, no setState, nothing to get out of sync with the server answer.
  const rotation = useMemo(() => {
    if (spinToken === 0 || targetIndex === null || count === 0) return 0;
    return spinToken * SPIN_TURNS * 360 + angleFor(targetIndex, count);
  }, [spinToken, targetIndex, count]);

  const wheelStyle: CSSProperties = { transform: `rotate(${rotation}deg)` };

  return (
    <div
      className={cn('relative mx-auto aspect-square w-full max-w-[560px]', className)}
      role="img"
      aria-label={wheelLabel}
    >
      {/* rim */}
      <div aria-hidden="true" className="absolute inset-0 rounded-pill bg-yellow" />

      {/* the rotating wheel: 540 inside the 560 rim.
          `prefers-reduced-motion` drops the transition in CSS, so the wheel jumps straight to the
          server's slice and the result shows at once. */}
      <div
        aria-hidden="true"
        className="absolute transition-transform motion-reduce:transition-none"
        style={{
          inset: `${((VIEW - WHEEL) / 2 / VIEW) * 100}%`,
          transitionTimingFunction: SPIN_EASE,
          transitionDuration: `${SPIN_MS}ms`,
          ...wheelStyle,
        }}
      >
        <svg viewBox={`0 0 ${WHEEL} ${WHEEL}`} className="h-full w-full overflow-visible">
          {segments.map((segment, index) => (
            <path key={segment.id} d={wedgePath(index, count)} fill={FILL[segment.tone]} />
          ))}
          {segments.map((segment, index) => {
            const step = 360 / count;
            const [x, y] = pointAt(-(index * step + step / 2), LABEL_R);
            const lines = wrapLabel(labels[index] ?? segment.label);
            const dy = lines.length > 1 ? -8 : 0;
            return (
              <text
                key={`${segment.id}-label`}
                x={x}
                y={y + dy}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={LABEL_FILL[segment.tone]}
                style={{ fontSize: 16, fontWeight: 800 }}
              >
                {lines.map((line, lineIndex) => (
                  <tspan key={line} x={x} dy={lineIndex === 0 ? 0 : 18}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}
        </svg>
      </div>

      {/* pointer: brand triangle at 12 o'clock, pointing down into the wheel */}
      <svg
        aria-hidden="true"
        viewBox="0 0 48 54"
        className="absolute h-[9.65%] w-[8.57%]"
        style={{ left: '45.71%', top: '-5.5%' }}
      >
        <path d="M24 54L3.215 13.5h41.57z" fill="var(--oz-brand)" />
      </svg>

      {/* hub — also the spin control */}
      <button
        type="button"
        onClick={onSpin}
        disabled={spinDisabled || !onSpin}
        aria-label={hubAriaLabel}
        className={cn(
          'absolute flex items-center justify-center rounded-pill bg-bg text-body-l font-extrabold text-ink',
          'outline outline-[6px] -outline-offset-[3px] outline-block transition-transform',
          'disabled:cursor-not-allowed disabled:opacity-70',
          !spinDisabled && onSpin && 'hover:scale-[1.03] active:scale-[0.98] cursor-pointer',
        )}
        style={{
          width: `${(124 / VIEW) * 100}%`,
          height: `${(124 / VIEW) * 100}%`,
          left: `${((VIEW - 124) / 2 / VIEW) * 100}%`,
          top: `${((VIEW - 124) / 2 / VIEW) * 100}%`,
        }}
      >
        {hubLabel}
      </button>
    </div>
  );
}
