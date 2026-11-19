'use client';

/**
 * `image-search-results-loading.html` (`t8MPh`) — the mirror skeleton for the **real** product
 * search that a recognised query kicks off.
 *
 * What stays real (export: "Recognized (real)"): the card shell, the captured photo and the
 * "AI tanıdı" line — they are already on screen and must not flash. Bones: the query line
 * (260×30), the three chips (120×36), the "{n} məhsul tapıldı" heading (200×26) and the 2×4
 * product grid, which is the shared `<ProductGridSkeleton>` so the loaded grid cannot shift.
 *
 * One `<Shimmer>` root; the `surface` card fills stay outside it.
 */
import { Bone, ProductGridSkeleton, Shimmer } from '@/shared/skeleton';

import { IMAGE_GRID_CLASS } from '../components/ImageProductGrid';
import { RECOGNIZED_CARD_CLASS } from '../components/RecognizedCard';

export interface ImageSearchResultsSkeletonProps {
  /** Visually-hidden announcement ("Yüklənir…"). */
  label: string;
  photoUrl: string | null;
  photoAlt: string;
  /** Static chrome: the real "AI tanıdı" line is not shimmered. */
  aiLabel: string;
}

export function ImageSearchResultsSkeleton({
  label,
  photoUrl,
  photoAlt,
  aiLabel,
}: ImageSearchResultsSkeletonProps) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-8">
      <section className={RECOGNIZED_CARD_CLASS}>
        <div className="size-[120px] shrink-0 overflow-hidden rounded-lg bg-surface2 md:size-[140px]">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={photoAlt} className="size-full object-cover" draggable={false} />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5">
          <span className="text-caption font-extrabold text-violet">{aiLabel}</span>
          <Bone w={260} h={30} r="md" className="max-w-full" />
          <div className="flex flex-row flex-wrap gap-2">
            <Bone w={120} h={36} r="full" />
            <Bone w={120} h={36} r="full" />
            <Bone w={120} h={36} r="full" />
          </div>
        </div>
      </section>

      <Bone w={200} h={26} r="md" />

      <ProductGridSkeleton cols={4} count={8} className={IMAGE_GRID_CLASS} />
    </Shimmer>
  );
}
