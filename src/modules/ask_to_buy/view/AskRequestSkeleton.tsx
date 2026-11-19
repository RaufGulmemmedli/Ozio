'use client';

/**
 * Mirror skeleton for `/ask-to-buy/[id]` (`ask-detail-skeleton.html`).
 *
 * Per the spec: the request card carries an avatar bone plus two text bones and a chip bone, the
 * tracker bar bone, three item rows (52 photo, two bones, a price bone) and the note bone; the
 * side column is five bones, two of them button pills. The page header and the demo notice above
 * stay real.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

const ITEMS = [0, 1, 2] as const;

export function AskRequestSkeleton() {
  const tc = useTranslations('common');

  return (
    <Shimmer label={tc('loading')} className="flex w-full flex-col items-start gap-8 lg:flex-row">
      <BoneCard r="xl" pad={28} gap={24} className="w-full min-w-0 flex-1">
        <div className="flex w-full flex-row items-center justify-between gap-4">
          <div className="flex min-w-0 flex-row items-center gap-[14px]">
            <Bone w={52} h={52} r="pill" />
            <div className="flex min-w-0 flex-col gap-2">
              <Bone w={232} h={18} r="xs" />
              <Bone w={280} h={14} r="xs" />
            </div>
          </div>
          <Bone w={96} h={28} r="pill" />
        </div>

        <Bone w="100%" h={32} r="pill" />
        <div className="h-px w-full bg-line" />
        <Bone w={120} h={18} r="xs" />

        {ITEMS.map((item) => (
          <div key={item} className="flex w-full flex-row items-center gap-[14px]">
            <Bone w={52} h={52} r="md" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Bone w={item === 1 ? 180 : 132} h={16} r="xs" />
              <Bone w={104} h={14} r="xs" />
            </div>
            <Bone w={72} h={16} r="xs" />
          </div>
        ))}

        <Bone w="100%" h={60} r="md" />
      </BoneCard>

      <BoneCard r="xl" pad={28} gap={14} className="w-full shrink-0 lg:w-[400px]">
        <Bone w={88} h={18} r="xs" />
        <Bone w="100%" h={15} r="xs" />
        <Bone w="100%" h={15} r="xs" />
        <div className="h-px w-full bg-line" />
        <Bone w={160} h={28} r="sm" />
        <Bone w="100%" h={52} r="pill" />
        <Bone w="100%" h={52} r="pill" />
      </BoneCard>
    </Shimmer>
  );
}
