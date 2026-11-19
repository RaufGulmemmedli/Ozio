'use client';

/**
 * Mirror skeleton for `/orders`, straight from `app-sifarislerim-loading.html`:
 * the title bones (36×230 over 16×300), the **real** (static) tab pills, then the body — a flex-1
 * list of 104-high order rows beside the 380 side panel (caption bones, a 200-high map tint and
 * three step rows).
 *
 * Same container sizes, gaps and columns as the loaded view, so nothing shifts when data arrives.
 */
import { useTranslations } from 'next-intl';
import {
  Bone,
  BoneCard,
  MapSkeleton,
  OrderRowSkeleton,
  Shimmer,
} from '@/shared/skeleton';

export interface OrdersSkeletonProps {
  rows?: number;
}

export function OrdersSkeleton({ rows = 5 }: OrdersSkeletonProps) {
  const t = useTranslations('orders');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col gap-2.5">
        <Bone w={230} h={36} r={12} />
        <Bone w={300} h={16} r="sm" />
      </div>

      <div className="flex w-full flex-col gap-6 2xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {Array.from({ length: rows }, (_, index) => (
            <OrderRowSkeleton key={index} index={index} />
          ))}
        </div>

        <BoneCard r="xl" pad={28} gap={20} w="100%" className="2xl:w-[380px] 2xl:shrink-0">
          <Bone w={150} h={14} r="xs" />
          <Bone w={230} h={24} r="sm" />
          <MapSkeleton h={200} />
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex w-full items-center gap-[14px]">
              <Bone w={32} h={32} r={16} />
              <Bone w={160} h={14} r="xs" />
            </div>
          ))}
        </BoneCard>
      </div>
    </Shimmer>
  );
}
