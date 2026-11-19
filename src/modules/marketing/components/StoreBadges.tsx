/**
 * App Store / Google Play buttons — nodes `App Store` + `Google Play` inside the
 * download block `YOqDs` (components.md §11): 60 high `#111` pill, 24 inline
 * padding, icon 22 + label 17/600 white, gap 10, row gap 12.
 *
 * Deliberately NOT the official store badges: Lucide carries no licensed
 * `apple` / `google-play` artwork and shipping a look-alike of an official badge
 * would be wrong, so this is the design's own custom pill. `#111` maps to the
 * `block` token (near-black in both themes) so the pill stays dark on the brand
 * panel in dark mode too.
 */
import { cn } from '@/core/lib/cn';
import { Apple, Play } from '@/shared/lucide';

export interface StoreBadgesProps {
  appStoreHref: string;
  googlePlayHref: string;
  appStoreLabel: string;
  googlePlayLabel: string;
  /** Accessible names — the visible label alone reads as a place, not an action. */
  appStoreAria: string;
  googlePlayAria: string;
  className?: string;
}

const PILL =
  'inline-flex h-14 items-center justify-center gap-2.5 rounded-pill bg-block px-6 ' +
  'text-[17px] font-semibold text-white transition-transform duration-[var(--oz-dur-fast)] ' +
  'ease-[var(--oz-ease-out)] active:scale-[.97] md:h-15';

export function StoreBadges({
  appStoreHref,
  googlePlayHref,
  appStoreLabel,
  googlePlayLabel,
  appStoreAria,
  googlePlayAria,
  className,
}: StoreBadgesProps) {
  return (
    <div className={cn('flex w-full flex-col gap-3 sm:w-fit sm:flex-row', className)}>
      <a
        href={appStoreHref}
        aria-label={appStoreAria}
        target="_blank"
        rel="noopener noreferrer"
        className={PILL}
      >
        <Apple size={22} aria-hidden="true" />
        {appStoreLabel}
      </a>
      <a
        href={googlePlayHref}
        aria-label={googlePlayAria}
        target="_blank"
        rel="noopener noreferrer"
        className={PILL}
      >
        <Play size={22} aria-hidden="true" />
        {googlePlayLabel}
      </a>
    </div>
  );
}
