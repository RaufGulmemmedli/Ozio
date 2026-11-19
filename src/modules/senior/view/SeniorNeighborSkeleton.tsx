'use client';

/**
 * Mirror skeleton for `/senior/neighbor` (`senior-neighbor-skeleton.html`, node `o4h17J`).
 *
 * Per the drawn composition: the tabs stay **real**, the list card carries three rows (48 tile
 * bone, two text bones, a 96×28 chip bone) and the 360-wide info card is bones. The page header,
 * the demo notice and the "Yeni sorğu" CTA above also stay real.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

const ROWS = [0, 1, 2] as const;

export function SeniorNeighborSkeleton() {
  const tc = useTranslations('common');

  return (
    <Shimmer label={tc('loading')} className="flex w-full flex-col items-start gap-8 lg:flex-row">
      <BoneCard r="xl" pad="8px 28px" gap={0} className="w-full min-w-0 flex-1">
        {ROWS.map((row) => (
          <div key={row} className="flex h-[96px] w-full flex-row items-center gap-4">
            <Bone w={48} h={48} r="md" />
            <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
              <Bone w={row % 2 === 0 ? 164 : 140} h={16} r="xs" />
              <Bone w={row % 2 === 0 ? 236 : 196} h={14} r="xs" />
            </div>
            <Bone w={96} h={28} r="pill" />
          </div>
        ))}
      </BoneCard>

      <BoneCard r="xl" pad={28} gap={16} className="w-full shrink-0 lg:w-[360px]">
        <Bone w={132} h={20} r="sm" />
        <Bone w="100%" h={14} r="xs" />
        <Bone w="100%" h={14} r="xs" />
        <Bone w="70%" h={14} r="xs" />
      </BoneCard>
    </Shimmer>
  );
}
