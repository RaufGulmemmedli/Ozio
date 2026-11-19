'use client';

/** Mirror skeleton for N2 (`missions-loading.html`): the same summary row and 2-column grid. */
import { cn } from '@/core/lib/cn';
import { Bone, Shimmer } from '@/shared/skeleton';

function TileBones({ wide }: { wide?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-[140px] flex-col justify-center gap-2 rounded-bento bg-surface p-7',
        wide ? 'flex-1' : 'w-full lg:w-[260px] lg:shrink-0',
      )}
    >
      <Bone w={150} h={14} r="xs" />
      <Bone w={wide ? 190 : 110} h={wide ? 40 : 32} r="md" />
    </div>
  );
}

function CardBones() {
  return (
    <div className="flex w-full flex-col gap-[14px] rounded-xl bg-surface p-6">
      <div className="flex flex-row items-center gap-[14px]">
        <Bone w={52} h={52} r="pill" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Bone w="70%" h={17} r="sm" />
          <Bone w="90%" h={14} r="xs" />
        </div>
      </div>
      <div className="flex flex-row items-center gap-3">
        <Bone w="100%" h={10} r="pill" />
        <Bone w={34} h={14} r="xs" />
      </div>
      <div className="flex flex-row items-center justify-between">
        <Bone w={72} h={30} r="pill" />
        <Bone w={140} h={44} r="pill" />
      </div>
    </div>
  );
}

export function MissionsSkeleton({ label }: { label: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-8" label={label}>
      <div className="flex w-full flex-col gap-5 lg:flex-row">
        <TileBones wide />
        <TileBones />
        <TileBones />
      </div>

      <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
        {[1, 2, 3, 4, 5].map((row) => (
          <CardBones key={row} />
        ))}
        <div className="flex h-[200px] w-full flex-col justify-center gap-2.5 rounded-xl bg-block p-6">
          <Bone w={150} h={20} r="sm" tone="white" className="opacity-[0.12]" />
          <Bone w={220} h={14} r="xs" tone="white" className="opacity-[0.12]" />
          <Bone w={130} h={44} r="pill" tone="white" className="opacity-[0.12]" />
        </div>
      </div>
    </Shimmer>
  );
}
