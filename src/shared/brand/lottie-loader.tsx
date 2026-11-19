'use client';

/**
 * Brand splash animation (`public/lottie/ozio_logo.json`, 2560x512, 60 fps, 252 frames).
 *
 * Segments (design-system/assets.md §Lottie, motion.md §4):
 *   0–186  → in + hold, played once at boot and held on frame 186
 *   186–248 → out, played when `ready` turns true, then `onExitDone()`
 *
 * This is for the splash / page boot ONLY — never a data-loading state
 * (those are shimmer skeletons, BUILD-CONTRACT rule 3).
 *
 * The engine is dynamic-imported with `ssr: false`; the wrapper reserves
 * `aspect-ratio: 5 / 1` so nothing shifts while the 735 kB json loads.
 */

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';

import type { LottieHandle, LottieSvgProps } from 'lottie-react';

import { cn } from '@/core/lib/cn';
import { useReducedMotion } from '@/core/lib/use-reduced-motion';

/**
 * Frame ranges from assets.md and the file's own markers: `drive-in` 0–60, `burnout` 66–186,
 * `drive-off` 186–248 (252 frames total).
 */
export const OZIO_LOTTIE_SEGMENTS = {
  intro: [0, 186],
  outro: [186, 248],
  /**
   * `burnout` alone — the scooter already parked, revving on the spot. No drive-in, no drive-off,
   * so the logo never travels across the screen. This is what `travel={false}` plays.
   */
  hold: [66, 186],
  /** Static frame shown when the viewer asked for reduced motion. */
  still: 120,
} as const;

export const OZIO_LOTTIE_SRC = '/lottie/ozio_logo.json';

/**
 * `LottieSvg` is the svg-only build (smaller engine). The cast flattens its
 * polymorphic call signature so `next/dynamic` can carry it.
 */
const LottieSvg = dynamic(
  async () => {
    const mod = await import('lottie-react');
    return { default: mod.LottieSvg as unknown as ComponentType<LottieSvgProps> };
  },
  { ssr: false },
);

type Phase = 'intro' | 'hold' | 'exit' | 'done';

export interface LottieLoaderProps {
  /** Flip to `true` once the app has booted; plays the 186–248 exit. */
  ready?: boolean;
  /**
   * `true` (default): the scooter drives in, holds, then drives off — the full brand animation.
   * `false`: only the `burnout` segment, so it stays where it is and never crosses the screen.
   */
  travel?: boolean;
  /** Called once the exit segment has finished (or immediately under reduced motion). */
  onExitDone?: () => void;
  /**
   * Accessible name (pass a translated string, e.g. `t('splash.loading')`).
   * Omitted → the animation is `aria-hidden` and the page announces loading.
   */
  label?: string;
  className?: string;
}

export function LottieLoader({
  ready = false,
  travel = true,
  onExitDone,
  label,
  className,
}: LottieLoaderProps) {
  const reducedMotion = useReducedMotion();
  const lottie = useRef<LottieHandle>(null);
  const phase = useRef<Phase>('intro');
  const exitDone = useRef(false);
  const [loaded, setLoaded] = useState(false);

  const finish = useCallback(() => {
    if (exitDone.current) return;
    exitDone.current = true;
    phase.current = 'done';
    onExitDone?.();
  }, [onExitDone]);

  const playExit = useCallback(() => {
    if (phase.current === 'exit' || phase.current === 'done') return;
    // `drive-off` IS the travelling part. Without `travel` there is nothing to play on the way
    // out, so the hold segment simply ends and the overlay fades.
    if (!travel) {
      finish();
      return;
    }
    phase.current = 'exit';
    lottie.current?.playSegments(OZIO_LOTTIE_SEGMENTS.outro);
  }, [finish, travel]);

  const handleReady = useCallback(() => {
    setLoaded(true);
    if (reducedMotion) {
      // assets.md / motion.md: no playback, hold a representative frame.
      lottie.current?.seek(OZIO_LOTTIE_SEGMENTS.still);
    }
  }, [reducedMotion]);

  const handleComplete = useCallback(() => {
    if (phase.current === 'intro') {
      phase.current = 'hold';
      if (ready) playExit();
      return;
    }
    if (phase.current === 'exit') finish();
  }, [finish, playExit, ready]);

  useEffect(() => {
    if (!ready) return;
    if (reducedMotion) {
      finish();
      return;
    }
    if (phase.current === 'hold') playExit();
  }, [finish, playExit, ready, reducedMotion]);

  return (
    <div
      className={cn(
        // Reserved box — 2560x512 is 5:1, so the height follows the width and nothing shifts
        // while the json loads.
        'aspect-[5/1]',
        /*
         * The size ladder lives here, not in the callers, because both of them (<BootSplash> and
         * /splash) want the same thing and used to pin it to 420 px — which looked lost on a
         * 1440-wide screen. It climbs with the project's own breakpoints (sm 480, md 768,
         * lg 1200, 2xl 1440); at 2xl the scooter is 960x192, two thirds of the viewport width.
         *
         * `calc(100%-32px)` keeps the 16 px gutter on phones that 07-responsive-a11y-perf.md asks
         * for. assets.md caps the drawn asset at 640 px, which is what md still gives; the wider
         * desktop steps are the owner's call.
         */
        'w-[calc(100%-32px)] max-w-[420px] md:max-w-[640px] lg:max-w-[820px] 2xl:max-w-[960px]',
        className,
      )}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-loaded={loaded || undefined}
    >
      <LottieSvg
        src={OZIO_LOTTIE_SRC}
        renderer="svg"
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
        autoplay={!reducedMotion}
        /*
         * The still version LOOPS while it is waiting.
         *
         * `ready` is the caller saying "the thing you are covering has arrived". With `travel`
         * there is a drive-off to play on the way out, so one pass is enough. Without it the clip
         * would simply stop on its last frame and sit there frozen for as long as the data takes
         * — so while `ready` is false the `burnout` segment repeats, which is what makes this
         * usable as a loading indicator rather than a fixed picture.
         */
        loop={!travel && !ready}
        segment={
          reducedMotion
            ? undefined
            : travel
              ? OZIO_LOTTIE_SEGMENTS.intro
              : OZIO_LOTTIE_SEGMENTS.hold
        }
        lottieRef={lottie}
        subscriptions={{ ready: handleReady, complete: handleComplete }}
        className="h-full w-full"
      />
    </div>
  );
}
