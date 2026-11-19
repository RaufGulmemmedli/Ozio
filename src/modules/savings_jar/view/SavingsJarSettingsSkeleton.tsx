'use client';

/**
 * Mirror skeleton for the settings screen (`savings-jar-settings-loading.html`): enable row,
 * two chip groups, the save pill and the dark preview card (fill kept, bones on top).
 */
import { Bone, Shimmer } from '@/shared/skeleton';

export function SavingsJarSettingsSkeleton({ label }: { label: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-6 lg:flex-row" label={label}>
      <div className="flex min-w-0 flex-1 flex-col gap-5 rounded-xl bg-surface p-6 md:p-7">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Bone w={190} h={18} r="sm" />
            <Bone w="90%" h={14} r="xs" />
          </div>
          <Bone w={52} h={30} r="pill" />
        </div>

        <div className="h-px w-full bg-line" />

        {[3, 4].map((chips) => (
          <div key={chips} className="flex flex-col gap-3">
            <Bone w={200} h={15} r="xs" />
            <div className="flex flex-row flex-wrap gap-2.5">
              {Array.from({ length: chips }, (_, index) => (
                <Bone key={index} w={96} h={44} r="pill" />
              ))}
            </div>
          </div>
        ))}

        <Bone w="100%" h={56} r="pill" />
      </div>

      <div className="flex min-h-[260px] w-full flex-col justify-center gap-3.5 rounded-bento bg-block p-8 lg:min-h-[300px] lg:w-[400px] lg:shrink-0">
        <Bone w={90} h={14} r="xs" tone="white" className="opacity-[0.12]" />
        <Bone w={260} h={34} r="md" tone="white" className="opacity-[0.12]" />
        <Bone w={150} h={34} r="pill" tone="white" className="opacity-[0.12]" />
        <Bone w={300} h={14} r="xs" tone="white" className="opacity-[0.12]" />
      </div>
    </Shimmer>
  );
}
