'use client';

/**
 * V7's loading state — shown while a scan is running, so it mirrors the **result** layout: the
 * white items panel (a header row plus five row bones) next to the 400-wide dark comparison card.
 *
 * `TableSkeleton` supplies the rows, so the head and row heights match every other table in the
 * app. The scanning *message* (`State · Çek skan olunur…`) is rendered by the view above this.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneTint, Shimmer, TableSkeleton } from '@/shared/skeleton';

export function ReceiptScanSkeleton() {
  const t = useTranslations('viral');

  return (
    <Shimmer label={t('scan.scanning.title')} className="flex w-full flex-col gap-8 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-xl bg-surface p-7">
        <div className="flex w-full flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Bone w={200} h={22} r="xs" />
            <Bone w={160} h={13} r="xs" />
          </div>
          <Bone w={96} h={28} r="pill" />
        </div>
        <TableSkeleton cols={3} rows={5} />
      </div>

      <div className="w-full lg:w-[400px] lg:shrink-0">
        <BoneTint tone="block" r="bento" w="100%" h={320} />
      </div>
    </Shimmer>
  );
}
