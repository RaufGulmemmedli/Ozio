'use client';

/**
 * SC1's loading state. The screen spec calls for "three tile bones".
 *
 * The page header and the "Demo rejim" strip are **static chrome** and stay real (hard rule 3):
 * only the three tiles shimmer, in the same grid, at the same heights and gaps as the loaded view,
 * so nothing shifts when the data lands.
 */
import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

export function SchoolHubSkeleton() {
  const t = useTranslations('school');

  return (
    <Shimmer
      label={t('loading')}
      className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {[0, 1, 2].map((i) => (
        <Bone key={i} w="100%" h={260} r="bento" className="lg:h-[340px]" />
      ))}
    </Shimmer>
  );
}
