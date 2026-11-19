'use client';

/**
 * V1's loading state: three tile bones in the loaded view's grid, at its heights and gaps.
 *
 * The page header and the "Demo rejim" strip are static chrome and stay real (hard rule 3).
 */
import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

export function ViralHubSkeleton() {
  const t = useTranslations('viral');

  return (
    <Shimmer
      label={t('loading')}
      className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {[0, 1, 2].map((i) => (
        <Bone key={i} w="100%" h={280} r="bento" className="lg:h-[360px]" />
      ))}
    </Shimmer>
  );
}
