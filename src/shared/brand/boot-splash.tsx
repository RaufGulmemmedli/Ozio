'use client';

/**
 * `<BootSplash>` — the ozio scooter animation over the app on entry.
 *
 * Plays `public/lottie/ozio_logo.json` through `<LottieLoader>`: the file's own markers are
 * `drive-in` 0–60, `burnout` 66–186 and `drive-off` 186–248, which is exactly the intro/outro
 * split `OZIO_LOTTIE_SEGMENTS` already describes, so this component only has to decide WHEN the
 * thing is on screen.
 *
 * **When it plays: once per mount of the layout that holds it.** It is mounted in the marketing
 * layout and in the app shell, which are two different route groups, so:
 *
 *   - opening the landing page mounts the marketing layout → it plays;
 *   - following "Tətbiqə keç" / "Profilim" into the app mounts the app shell → it plays again,
 *     because crossing a route-group boundary mounts the other group's layout;
 *   - moving between pages inside one group reuses that layout → it does NOT replay.
 *
 * That is deliberate and is why there is no "already seen it" flag: the owner asked for the
 * animation both when the landing page opens and when entering the app from it, and a
 * once-per-tab gate would suppress the second one. The cost is that a reload replays it.
 *
 * Two more rules:
 *
 * - **It covers the page from the first paint.** The overlay is server-rendered, so on a document
 *   load there is no frame where the page is visible before the splash drops over it.
 * - **Reduced motion skips it.** `<LottieLoader>` calls `onExitDone` immediately in that case, and
 *   the overlay leaves on the same path as a finished animation.
 *
 * The overlay removes itself from the DOM once the outro has run, so nothing is left over the app.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/core/lib/cn';

import { LottieLoader } from './lottie-loader';

/**
 * Hard cap. `<LottieLoader>` already falls back under reduced motion, but if the 735 kB json or
 * the engine chunk never arrives the visitor must not be left staring at an empty cover.
 */
const MAX_VISIBLE_MS = 6_000;

export interface BootSplashProps {
  /**
   * `true` on the landing page: the scooter drives in across the full width of the screen, edge
   * to edge, and drives off again — the full brand animation, with room to actually travel.
   *
   * `false` everywhere else: only the `burnout` segment plays, so the logo revs where it stands
   * instead of crossing the page, and the artwork keeps the size ladder every other screen uses.
   * Entering the app is a transition between two screens of the same site; the drive-across
   * belongs to arriving at it.
   */
  travel?: boolean;
  /**
   * `false` keeps the animation looping instead of letting it finish — pass the inverse of "still
   * waiting" and the splash stays until the page it covers is actually ready. Defaults to `true`,
   * which is the one-pass behaviour the landing and the first app paint want.
   */
  ready?: boolean;
}

export function BootSplash({ travel = false, ready = true }: BootSplashProps) {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    // Matches the opacity transition below, so the node is removed only once it is invisible.
    setTimeout(() => setGone(true), 260);
  }, []);

  useEffect(() => {
    const timer = setTimeout(finish, MAX_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [finish]);

  if (gone) return null;

  return (
    <div
      className={cn(
        // `overflow-hidden` because both size cases below are now WIDER than the viewport: the
        // json's canvas is mostly empty around the logo, so the only way to draw a bigger logo is
        // a bigger canvas. Clipping the empty sides is free; letting them out would add a
        // horizontal scrollbar to every page the overlay sits on.
        'fixed inset-0 z-[200] grid place-items-center overflow-hidden transition-opacity duration-[250ms] ease-[var(--oz-ease-out)]',
        /*
         * Two different things, despite being one component.
         *
         * Arriving at the site (`travel`): a full pink surface with the white scooter riding
         * across it — the brand moment, and it covers the page until it is ready.
         *
         * Moving between pages: no surface at all. The overlay is transparent, the page shows
         * through, and the artwork itself is brand pink (`oz-splash-tint`) so it reads on the
         * cream background. Transparent means it is no longer covering anything, so it also stops
         * swallowing clicks — a visitor can go on using the page while it plays.
         */
        travel ? 'oz-splash-surface' : 'oz-splash-tint pointer-events-none bg-transparent',
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
      // Decorative: the page behind it is the real content, and the overlay is gone in ~2–4 s.
      aria-hidden="true"
    >
      <LottieLoader
        ready={ready}
        travel={travel}
        onExitDone={finish}
        /*
         * A box of exactly 100vw, enlarged with `scale` — NOT a box wider than the screen.
         *
         * Why it has to be a transform: the logo is only about 46% of the json's 2560-wide
         * canvas, so the only way to draw it big is to draw the canvas bigger than the viewport.
         * The first attempt did that with widths (`w-[190vw]` and friends) and let the overlay's
         * `grid place-items-center` centre them. A grid item WIDER than its track does not centre
         * symmetrically — the overhang resolves towards one side — and the bigger the overhang
         * the more it shows. On a phone the box hung 45vw past each edge, so the animation
         * visibly started off-centre; on a desktop the overhang was half that and it passed.
         *
         * `scale` has no such problem: it grows about the element's own centre, identically at
         * every width, and the overlay's `overflow-hidden` clips the empty canvas evenly. The
         * factors are the old widths expressed as multiples, so the sizes are unchanged — only
         * the centring is fixed.
         *
         * ONE factor at every width, deliberately — no breakpoint ladder.
         *
         * The ladder used to start largest on a phone (2.2) and ease down to the desktop value
         * (1.8). That is what made mobile behave differently: the factor is also how far outside
         * the screen the canvas reaches, so the drive-in had a 60vw run-up on a phone against
         * 40vw on a desktop. The scooter therefore spent noticeably longer off-screen before it
         * reached the middle, which is the "it does not start from the centre on mobile" that was
         * reported. (It was NOT a centring bug: measured on a 390px viewport, the box's centre
         * and the viewport's centre were the same pixel.)
         *
         * A single factor makes the motion identical at every width — mobile exactly like
         * desktop, which is what was asked — and keeps the size, since these are the desktop
         * values the ladder was already converging on.
         */
        className={cn('w-screen max-w-none', travel ? 'scale-[1.8]' : 'scale-[1.4]')}
      />
    </div>
  );
}
