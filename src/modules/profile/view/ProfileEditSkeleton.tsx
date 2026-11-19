/**
 * Mirror skeleton for PS1: the photo row, three two-up field rows, the action row and the two side
 * cards — same card padding, gaps and column widths as the loaded form.
 */
import { Bone, FormSkeleton, Shimmer } from '@/shared/skeleton';

export function ProfileEditSkeleton({ label }: { label: string }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-6 lg:flex-row lg:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-7 rounded-xl bg-surface p-6 md:p-8">
        <div className="flex items-center gap-5">
          <Bone w={80} h={80} r="pill" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Bone w={120} h={16} r="sm" />
            <Bone w={210} h={13} r="xs" />
          </div>
        </div>
        <FormSkeleton fields={6} cols={2} submit={false} />
        <div className="flex justify-end gap-3">
          <Bone w={110} h={52} r="pill" />
          <Bone w={150} h={52} r="pill" />
        </div>
      </div>

      <div className="flex w-full flex-col gap-5 lg:w-[340px] lg:shrink-0">
        <div className="flex flex-col gap-3.5 rounded-xl bg-block p-7">
          <Bone w={28} h={28} r="sm" tone="surface2" />
          <Bone w={200} h={20} r="sm" tone="surface2" />
          <Bone w="100%" h={42} r="sm" tone="surface2" />
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-surface p-7">
          <div className="flex items-center justify-between">
            <Bone w={120} h={15} r="xs" />
            <Bone w={38} h={15} r="xs" />
          </div>
          <Bone w="100%" h={10} r="pill" />
          <Bone w="100%" h={40} r="sm" />
        </div>
      </div>
    </Shimmer>
  );
}
