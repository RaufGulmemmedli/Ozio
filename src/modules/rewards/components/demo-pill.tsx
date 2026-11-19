'use client';

/**
 * The `Demo Pill` the export paints in every page header: yellow pill, 8/14 padding, flask glyph,
 * 13/700 ink label. `<DemoBanner>`'s own compact form uses the quieter `warn-soft` tint, so this
 * keeps the design's yellow while the full banner above the header carries the explanation.
 *
 * Decorative twin of a `role="note"` banner, hence `aria-hidden`: the banner already says it.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { FlaskConical } from '@/shared/lucide';

export function DemoPill({ className }: { className?: string }) {
  const t = useTranslations('common');

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex w-fit shrink-0 flex-row items-center gap-2 rounded-pill bg-yellow px-[14px] py-2',
        'text-caption font-bold text-on-yellow',
        className,
      )}
    >
      <FlaskConical size={16} className="shrink-0" />
      {t('demo.title')}
    </span>
  );
}
