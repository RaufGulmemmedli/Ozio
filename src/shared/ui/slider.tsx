'use client';

/**
 * <Slider> — the price-range filter control.
 * 4px `surface2` track, `brand` range, 20px white thumb with a 2px `brand` ring.
 * One or two thumbs (`value`/`defaultValue` array length decides).
 */

import * as RadixSlider from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '@/core/lib/cn';

export interface SliderProps extends Omit<RadixSlider.SliderProps, 'children'> {
  /** One accessible name per thumb, e.g. ['Minimum qiymət', 'Maksimum qiymət']. */
  thumbLabels?: readonly string[];
  ref?: React.Ref<HTMLSpanElement>;
}

export function Slider({
  className,
  value,
  defaultValue,
  thumbLabels,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  ref,
  ...rest
}: SliderProps): React.ReactElement {
  const thumbCount = (value ?? defaultValue ?? [min]).length;

  return (
    <RadixSlider.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue ?? (value ? undefined : [min])}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(
        'relative flex w-full touch-none items-center select-none',
        'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        disabled && 'cursor-not-allowed opacity-40',
        className,
      )}
      {...rest}
    >
      <RadixSlider.Track className="relative h-1 w-full grow rounded-pill bg-surface2 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1">
        <RadixSlider.Range className="absolute h-full rounded-pill bg-brand data-[orientation=vertical]:w-full" />
      </RadixSlider.Track>
      {Array.from({ length: thumbCount }, (_, index) => (
        <RadixSlider.Thumb
          key={index}
          aria-label={thumbLabels?.[index]}
          className={cn(
            'block size-5 rounded-pill border-2 border-brand bg-white',
            'transition-transform duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
            !disabled && 'hover:scale-110 active:scale-105',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          )}
        />
      ))}
    </RadixSlider.Root>
  );
}
