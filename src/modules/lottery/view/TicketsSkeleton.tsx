/** Loading mirror for the ticket list: eight 64-high row bones at the loaded gap. */
import { ListRowSkeleton, Shimmer } from '@/shared/skeleton';

export function TicketsSkeleton({ count = 8, label }: { count?: number; label?: string }) {
  return (
    <Shimmer className="flex w-full flex-col gap-3" label={label}>
      {Array.from({ length: count }, (_, i) => (
        <ListRowSkeleton key={i} h={64} index={i} />
      ))}
    </Shimmer>
  );
}
