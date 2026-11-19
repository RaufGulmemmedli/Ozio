'use client';

/** `Tips` node: `surface` / `rounded-xl`, padding 28, gap 16; each tip is a 36 `violet-soft` disc. */
import type { LucideIcon } from '@/shared/lucide';

export interface TipsCardProps {
  title: string;
  tips: ReadonlyArray<{ id: string; icon: LucideIcon; label: string }>;
}

export function TipsCard({ title, tips }: TipsCardProps) {
  return (
    <section className="flex w-full flex-col gap-4 rounded-xl bg-surface p-7" aria-label={title}>
      <h2 className="m-0 text-body-l font-bold text-ink">{title}</h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {tips.map(({ id, icon: Icon, label }) => (
          <li key={id} className="flex flex-row items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-violet-soft text-violet"
            >
              <Icon size={18} />
            </span>
            <span className="text-body-sm font-medium text-ink">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
