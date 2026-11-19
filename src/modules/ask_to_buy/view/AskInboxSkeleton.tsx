'use client';

/**
 * Mirror skeleton for `/ask-to-buy` (`ask-inbox-skeleton.html`).
 *
 * The page header, the demo notice and the tab strip stay **real** — only the two columns below
 * are boned, under a single `<Shimmer>`: the list card with 5 rows (44 circle, two text bones, a
 * time bone, an amount bone and an 88×28 chip bone) and the side card (title bone + 3 × 36 circle
 * with two bones). Container sizes, gaps and the 340 side column match the loaded view, so
 * nothing shifts when the data lands.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

const ROWS = [0, 1, 2, 3, 4] as const;
const STEPS = [0, 1, 2] as const;

export function AskInboxSkeleton() {
  const tc = useTranslations('common');

  return (
    <Shimmer
      label={tc('loading')}
      className="flex w-full flex-col items-start gap-8 lg:flex-row"
    >
      <BoneCard r="xl" pad="8px 28px" gap={0} className="w-full min-w-0 flex-1">
        {ROWS.map((row) => (
          <div key={row} className="flex h-[88px] w-full flex-row items-center gap-4">
            <Bone w={44} h={44} r="pill" />
            <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
              <Bone w={row % 2 === 0 ? 184 : 156} h={16} r="xs" />
              <Bone w={row % 2 === 0 ? 212 : 176} h={14} r="xs" />
            </div>
            <Bone w={84} h={14} r="xs" className="hidden lg:block" />
            <Bone w={72} h={17} r="xs" />
            <Bone w={88} h={28} r="pill" />
          </div>
        ))}
      </BoneCard>

      <BoneCard r="xl" pad={28} gap={16} className="w-full shrink-0 lg:w-[340px]">
        <Bone w={140} h={24} r="sm" />
        {STEPS.map((step) => (
          <div key={step} className="flex w-full flex-row items-start gap-[14px]">
            <Bone w={36} h={36} r="pill" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Bone w={132} h={15} r="xs" />
              <Bone w="100%" h={14} r="xs" />
            </div>
          </div>
        ))}
      </BoneCard>
    </Shimmer>
  );
}
