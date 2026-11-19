'use client';

/**
 * 404 / 500 brand animation: loops the idle range (frames 60–186) slowly.
 *
 * Note: motion.md §4 describes "play 0→60 once, hold" for the error pages while
 * the web brief specifies a slow loop of the hold range — the loop is what is
 * implemented here (frames 60–186, speed 0.5).
 *
 * Reduced motion → no playback, static frame 120 (motion.md §4 / §8).
 */

import dynamic from 'next/dynamic';
import { useCallback, useRef, type ComponentType } from 'react';

import type { LottieHandle, LottieSvgProps } from 'lottie-react';

import { cn } from '@/core/lib/cn';
import { useReducedMotion } from '@/core/lib/use-reduced-motion';

import { OZIO_LOTTIE_SRC, OZIO_LOTTIE_SEGMENTS } from './lottie-loader';

/** The idle / hold range the error pages loop. */
export const OZIO_LOTTIE_IDLE = [60, 186] as const;

const LottieSvg = dynamic(
  async () => {
    const mod = await import('lottie-react');
    return { default: mod.LottieSvg as unknown as ComponentType<LottieSvgProps> };
  },
  { ssr: false },
);

export interface Lottie404Props {
  /** Playback rate; `1` is the file's own speed. Default 0.5 ("slowly"). */
  speed?: number;
  /** Accessible name; omitted → decorative (`aria-hidden`). */
  label?: string;
  className?: string;
}

export function Lottie404({ speed = 0.5, label, className }: Lottie404Props) {
  const reducedMotion = useReducedMotion();
  const lottie = useRef<LottieHandle>(null);

  const handleReady = useCallback(() => {
    if (reducedMotion) lottie.current?.seek(OZIO_LOTTIE_SEGMENTS.still);
  }, [reducedMotion]);

  return (
    <div
      // Same artwork, same arithmetic as `<LottieLoader>`: the logo is only ~46% of the json's
      // canvas, so 640 drew a ~295px scooter. Raised with the rest of the animation; bounded
      // rather than `vw` because this sits in page content, which must not be clipped.
      className={cn(
        'aspect-[5/1] w-[calc(100%-32px)] max-w-[560px] md:max-w-[860px] lg:max-w-[1040px]',
        className,
      )}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <LottieSvg
        src={OZIO_LOTTIE_SRC}
        renderer="svg"
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
        autoplay={!reducedMotion}
        loop={!reducedMotion}
        speed={reducedMotion ? 1 : speed}
        segment={reducedMotion ? undefined : OZIO_LOTTIE_IDLE}
        lottieRef={lottie}
        subscriptions={{ ready: handleReady }}
        className="h-full w-full"
      />
    </div>
  );
}
