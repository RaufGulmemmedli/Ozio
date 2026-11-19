'use client';

/**
 * Mirror skeleton for `/parcel` (`Pe3XF` → `baglama-esas-yuklenir.html`).
 *
 * Only the list card becomes bones: the hero, the rules card, the page header and the filter chips
 * are static chrome and stay real (skeletons.md / BUILD-CONTRACT rule 3). The card keeps the
 * loaded row height (84) and the same columns, so nothing shifts when the data lands.
 */
import { Bone, Shimmer } from '@/shared/skeleton';

export function ParcelListSkeleton({ rows = 5, label }: { rows?: number; label?: string }) {
  return (
    <Shimmer label={label} className="w-full rounded-xl bg-surface px-6 py-2">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex w-full flex-row items-center gap-4 border-b border-line py-4 last:border-b-0 md:min-h-[84px]"
        >
          <Bone w={48} h={48} r="md" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Bone w={96} h={14} r="xs" />
            <Bone w={[260, 300, 240, 280, 220][i % 5]} h={13} r="xs" />
          </div>
          <Bone w={118} h={28} r="pill" />
          <Bone w={62} h={16} r="xs" />
          <Bone w={100} h={13} r="xs" />
          <Bone w={20} h={20} r="xs" />
        </div>
      ))}
    </Shimmer>
  );
}
