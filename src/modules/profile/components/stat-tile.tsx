'use client';

/**
 * `Stat · Sifariş` / `Stat · Keşbek` / `Stat · Kupon` from `app-profil.html`:
 * `surface` r20 card, padding 18/20, gap 4, value 22/800 `ink`, label 13/400 `ink2`.
 *
 * `value === null` means the endpoint that feeds the tile failed or answered an unknown shape —
 * the tile then shows a dash with an accessible explanation instead of a fabricated number
 * (BUILD-CONTRACT rule 7).
 */
import { cn } from '@/core/lib/cn';

export interface StatTileProps {
  label: string;
  /** Already formatted (`useFormat().money` / `.number`), or `null` when unknown. */
  value: string | null;
  /** Announced in place of the dash when `value` is `null`. */
  unknownHint: string;
  unknownText: string;
  className?: string;
}

export function StatTile({ label, value, unknownHint, unknownText, className }: StatTileProps) {
  const unknown = value === null;
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1 rounded-lg bg-surface px-5 py-[18px]',
        className,
      )}
    >
      <span className="truncate text-[22px] font-extrabold leading-tight text-ink">
        {unknown ? (
          <>
            <span aria-hidden="true">{unknownText}</span>
            <span className="sr-only">{unknownHint}</span>
          </>
        ) : (
          value
        )}
      </span>
      <span className="text-caption font-normal text-ink2">{label}</span>
    </div>
  );
}
