'use client';

/**
 * Mirror skeleton for `/senior/pension` (`senior-pension-skeleton.html`, node `fyHaY`).
 *
 * Per the drawn composition: the banner is a 200-high `surface2` block at radius 36 (a tinted
 * fill, so it sits **outside** the bone sweep), the basket card carries six rows (48 photo bone,
 * two text bones, a price bone), and the side card is title / switch pill / divider / total /
 * 64-high button. The page header and the demo notice above stay real.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, BoneTint, Shimmer } from '@/shared/skeleton';

const ROWS = [0, 1, 2, 3, 4, 5] as const;

export function SeniorPensionSkeleton() {
  const tc = useTranslations('common');

  return (
    <Shimmer label={tc('loading')} className="flex w-full flex-col items-start gap-8 lg:flex-row">
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
        <BoneTint r="bento" tone="surface2" className="h-[200px] w-full" />

        <BoneCard r="xl" pad="28px 28px 8px 28px" gap={0}>
          <Bone w={200} h={20} r="sm" className="mb-3" />
          {ROWS.map((row) => (
            <div key={row} className="flex h-[72px] w-full flex-row items-center gap-[14px]">
              <Bone w={48} h={48} r="md" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Bone w={row % 2 === 0 ? 148 : 112} h={16} r="xs" />
                <Bone w={72} h={14} r="xs" />
              </div>
              <Bone w={64} h={16} r="xs" />
            </div>
          ))}
        </BoneCard>
      </div>

      <BoneCard r="xl" pad={28} gap={16} className="w-full shrink-0 lg:w-[400px]">
        <div className="flex w-full flex-row items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <Bone w={148} h={16} r="xs" />
            <Bone w={200} h={13} r="xs" />
          </div>
          <Bone w={52} h={30} r="pill" />
        </div>
        <div className="h-px w-full bg-line" />
        <div className="flex w-full flex-row items-center justify-between gap-4">
          <Bone w={96} h={16} r="xs" />
          <Bone w={120} h={28} r="sm" />
        </div>
        <Bone w="100%" h={64} r="pill" />
      </BoneCard>
    </Shimmer>
  );
}
