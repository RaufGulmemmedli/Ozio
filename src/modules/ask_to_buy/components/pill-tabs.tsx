'use client';

/**
 * The drawn tab strip: a `surface2` pill rail (radius 999, padding 4, gap 4) holding 44-high
 * pills — active `cta`/`on-cta`, inactive transparent with an `ink2` label — and an optional
 * 22px `brand` count badge (`ask-inbox.html` → `Tabs`).
 *
 * TODO(core): `@/shared/ui`'s `SegmentedControl` has no rail container and paints its inactive
 * pills `surface`, so it cannot express this frame. A `variant="rail"` there would let both this
 * module and `senior` drop their local copy.
 */
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/core/lib/cn';

export interface PillTabOption<V extends string> {
  value: V;
  label: string;
  /** Rendered as the brand badge when greater than 0. */
  count?: number;
  /** Announced alongside the count, e.g. "3 gözləyən sorğu". */
  countLabel?: string;
}

export interface PillTabsProps<V extends string> {
  value: V;
  onValueChange: (value: V) => void;
  options: readonly PillTabOption<V>[];
  /** Accessible name of the strip. */
  label: string;
  className?: string;
}

export function PillTabs<V extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: PillTabsProps<V>) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={(next) => onValueChange(next as V)}
      activationMode="automatic"
    >
      <TabsPrimitive.List
        aria-label={label}
        className={cn(
          'flex w-fit max-w-full flex-row items-center gap-1 overflow-x-auto rounded-pill bg-surface2 p-1',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          className,
        )}
      >
        {options.map((option) => (
          <TabsPrimitive.Trigger
            key={option.value}
            value={option.value}
            className={cn(
              'flex h-11 shrink-0 flex-row items-center gap-2 whitespace-nowrap rounded-pill px-[22px]',
              'text-body-sm font-semibold text-ink2',
              'transition-[background-color,color] duration-[var(--oz-dur-fast)] ease-out',
              'data-[state=active]:bg-cta data-[state=active]:text-on-cta',
            )}
          >
            {option.label}
            {typeof option.count === 'number' && option.count > 0 ? (
              <span className="flex size-[22px] shrink-0 items-center justify-center rounded-pill bg-brand text-micro font-bold text-white">
                {option.count}
                {option.countLabel ? <span className="sr-only"> {option.countLabel}</span> : null}
              </span>
            ) : null}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
