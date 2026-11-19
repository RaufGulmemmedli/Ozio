'use client';

/**
 * `support-chat-loading.html` (`XOzRP`) — the mirror skeleton.
 *
 * Bones: the head (48 avatar + 140×16 and 100×12 lines), three message bubbles (320×56 outgoing,
 * 400×72 and 260×48 incoming) and the three topic rows. The **composer chrome is not shimmered**:
 * it is static, and a pulsing input would look broken — only its pill gets a bone, per the export.
 *
 * Same card heights, paddings and gaps as the loaded view, so nothing shifts when the thread lands.
 */
import { Bone, Shimmer } from '@/shared/skeleton';

export interface SupportChatSkeletonProps {
  /** Visually-hidden announcement ("Yüklənir…"). */
  label: string;
}

export function SupportChatSkeleton({ label }: SupportChatSkeletonProps) {
  return (
    <Shimmer label={label} className="flex w-full flex-col items-start gap-6 lg:flex-row">
      <div className="flex h-[560px] w-full min-w-0 flex-1 flex-col rounded-xl bg-surface md:h-[640px]">
        <div className="flex w-full shrink-0 flex-row items-center gap-[14px] border-b border-line px-5 py-4 md:px-6">
          <Bone w={48} h={48} r="full" />
          <div className="flex flex-col gap-2">
            <Bone w={140} h={16} r="md" />
            <Bone w={100} h={12} r="md" />
          </div>
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col justify-end gap-[14px] px-5 py-6 md:px-6">
          <div className="flex w-full flex-row justify-end">
            <Bone w={320} h={56} r="card" className="max-w-[85%]" />
          </div>
          <div className="flex w-full flex-row justify-start">
            <Bone w={400} h={72} r="card" className="max-w-[85%]" />
          </div>
          <div className="flex w-full flex-row justify-start">
            <Bone w={260} h={48} r="card" className="max-w-[85%]" />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-row items-center gap-3 border-t border-line px-5 py-4 md:px-6">
          <Bone w="100%" h={52} r="full" />
          <Bone w={52} h={52} r="full" />
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-[14px] rounded-xl bg-surface p-7 lg:w-[380px]">
        <Bone w={200} h={22} r="md" />
        <Bone w="100%" h={60} r="lg" />
        <Bone w="100%" h={60} r="lg" />
        <Bone w="100%" h={60} r="lg" />
      </div>
    </Shimmer>
  );
}
