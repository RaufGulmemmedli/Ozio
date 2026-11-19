'use client';

/**
 * The entry point other modules place: the camera button inside the search field
 * (`08-feature-flags-mocks.md`, image_search row → "camera button in search field").
 *
 * M4 renders this at the trailing edge of `/search`'s field. It is a plain link to
 * `/search/image`, so there is no camera permission and no mock traffic until the user is on the
 * photo screen. When `imageSearch` is off it renders **nothing** — a flagged-off module hides its
 * entry points, and the route redirects anyway.
 */
import { useTranslations } from 'next-intl';

import { FeatureFlags } from '@/core/config';
import { Link } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { Camera } from '@/shared/lucide';

export interface CameraSearchButtonProps {
  /** Icon size in px. The search field's trailing slot uses 20. */
  size?: number;
  className?: string;
}

export function CameraSearchButton({ size = 20, className }: CameraSearchButtonProps) {
  const t = useTranslations('image_search');
  if (!FeatureFlags.imageSearch) return null;

  return (
    <Link
      href={paths.searchImage}
      aria-label={t('entry.label')}
      title={t('entry.label')}
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-pill text-ink2',
        'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--ease-out)] hover:bg-surface2 hover:text-ink',
        className,
      )}
    >
      <Camera aria-hidden="true" size={size} />
    </Link>
  );
}
