'use client';

/**
 * `/card/levels` loading state, mirroring `app-seviyyeler.html`: the status card
 * (`block`, r28, padding 32) and four tier cards (r28, padding 28, 520 high) in
 * a row with gap 16.
 *
 * The heading and the demo banner are real chrome and are not shimmered.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Bone, Shimmer } from '@/shared/skeleton';

export function LevelsSkeleton({ className }: { className?: string }) {
  const t = useTranslations('loyalty_card');

  return (
    <Shimmer label={t('loading')} className={cn('flex w-full flex-col gap-8', className)}>
      <div className="flex w-full flex-col gap-6 rounded-xl bg-block p-8 lg:flex-row lg:items-center lg:gap-10">
        <div className="flex flex-col gap-1">
          <Bone w={130} h={12} r="xs" tone="surface2" />
          <Bone w={120} h={40} r="sm" tone="surface2" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Bone w="60%" h={15} r="xs" tone="surface2" />
          <Bone w="100%" h={10} r={5} tone="surface2" />
        </div>
        <Bone w={80} h={40} r="pill" tone="surface2" />
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-7"
          >
            <Bone w={52} h={52} r="pill" />
            <div className="flex flex-col gap-1">
              <Bone w={120} h={26} r="sm" />
              <Bone w={160} h={13} r="xs" />
            </div>
            <Bone w={120} h={48} r="sm" />
            <div className="flex flex-col gap-3 border-t border-line pt-5">
              <Bone w="100%" h={14} r="xs" />
              <Bone w="85%" h={14} r="xs" />
              <Bone w="70%" h={14} r="xs" />
            </div>
          </div>
        ))}
      </div>
    </Shimmer>
  );
}
