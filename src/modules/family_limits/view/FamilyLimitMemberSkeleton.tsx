'use client';

/**
 * Mirror skeleton for `/family-limits/[id]` (`limits-member-skeleton.html`, node `zbkcQ`).
 *
 * Per the drawn composition: the left column is the big spend card (4 bones) over the chips card
 * (6 pill bones); the right column is 5 purchase rows. The page header and the demo notice stay
 * real, and the 480 left column plus the gap match the loaded view.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

const CHIPS = [0, 1, 2, 3, 4, 5] as const;
const ROWS = [0, 1, 2, 3, 4] as const;

export function FamilyLimitMemberSkeleton() {
  const tc = useTranslations('common');

  return (
    <Shimmer label={tc('loading')} className="flex w-full flex-col items-start gap-8 lg:flex-row">
      <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[480px]">
        <BoneCard r="xl" pad={32} gap={16}>
          <Bone w={180} h={15} r="xs" />
          <Bone w={240} h={56} r="sm" />
          <Bone w="100%" h={14} r={7} />
          <Bone w={280} h={14} r="xs" />
        </BoneCard>

        <BoneCard r="xl" pad={28} gap={18}>
          <Bone w={260} h={18} r="xs" />
          <div className="flex w-full flex-row flex-wrap gap-[10px]">
            {CHIPS.map((chip) => (
              <Bone key={chip} w={chip % 2 === 0 ? 120 : 96} h={40} r="pill" />
            ))}
          </div>
        </BoneCard>
      </div>

      <BoneCard r="xl" pad="28px 28px 8px 28px" gap={0} className="w-full min-w-0 flex-1">
        <Bone w={132} h={20} r="sm" className="mb-3" />
        {ROWS.map((row) => (
          <div key={row} className="flex h-[76px] w-full flex-row items-center gap-[14px]">
            <Bone w={48} h={48} r="md" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Bone w={row % 2 === 0 ? 168 : 136} h={16} r="xs" />
              <Bone w={144} h={14} r="xs" />
            </div>
            <Bone w={64} h={16} r="xs" />
          </div>
        ))}
      </BoneCard>
    </Shimmer>
  );
}
