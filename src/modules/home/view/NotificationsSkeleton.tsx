'use client';

/**
 * `/notifications` mirror skeleton: the page header stays real (static chrome) and the rows are
 * `NotificationRowSkeleton` bones — 44 chip, title + body lines and the time stamp, the same
 * container and gap as the loaded list, so nothing shifts.
 */
import { NotificationRowSkeleton, Shimmer } from '@/shared/skeleton';

export function NotificationsSkeleton({ label, count = 6 }: { label?: string; count?: number }) {
  return (
    <Shimmer label={label} className="flex w-full flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <NotificationRowSkeleton key={i} index={i} />
      ))}
    </Shimmer>
  );
}
