'use client';

/**
 * <DatePicker> + <DateField> — components.md §8 ("Date picker" `rNbOM`, field `qpd4m`).
 *
 * Panel 380×400, `surface`, radius 28, padding 24, gap 16, shadow `menu`.
 * Head: chevron-left + "Noyabr 2026" 17/700 + chevron-right (20px icons `ink2`).
 * Weekday row 12/600 `ink3`, Monday first. Day cell 44×44 circle 14/500,
 * `ink3` outside the month; selected → `cta` fill + `on-cta`; today → 1.5px
 * `brand` ring; disabled → `ink3` at 40%.
 *
 * No date library — plain `Date` math on local midnights.
 * Every string arrives through `labels`, so the caller localises.
 */

import * as RadixPopover from '@radix-ui/react-popover';
import * as React from 'react';

import { cn } from '@/core/lib/cn';
import { Calendar, ChevronLeft, ChevronRight } from '@/shared/lucide';

import { useFieldControl, type FieldState } from './field';
import { INPUT_ADORNMENT_CLASSES, inputShellClasses, type InputVariant } from './input';

/* ------------------------------------------------------------------ date math */

/** Local midnight of `date`. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Monday-first weekday index: Mon 0 … Sun 6. */
function mondayFirstIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** 42 local midnights, Monday-first, covering `month` plus its leading/trailing days. */
function monthMatrix(month: Date): Date[] {
  const first = startOfMonth(month);
  const start = addDays(first, -mondayFirstIndex(first));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/* ------------------------------------------------------------------ labels */

export interface DatePickerLabels {
  /** 7 short weekday names, Monday first: `['B.e','Ç.a','Çər','C.a','Cüm','Şən','Baz']`. */
  weekdays: readonly string[];
  /** 12 month names, January first: `['Yanvar', …, 'Dekabr']`. */
  months: readonly string[];
  /** aria-label for the ‹ button. */
  prevMonth: string;
  /** aria-label for the › button. */
  nextMonth: string;
  /** Optional accessible name for the grid, e.g. "Tarix seç". */
  calendar?: string;
  /** Optional `(date) => string` for each day cell's accessible name. */
  day?: (date: Date) => string;
}

/* ------------------------------------------------------------------ panel */

export interface DatePickerProps {
  /** Selected day. `null` = nothing selected. */
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date) => void;
  /** Visible month (controlled). */
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  min?: Date;
  max?: Date;
  /** Extra per-day rule on top of `min`/`max`. */
  isDateDisabled?: (date: Date) => boolean;
  /** All visible / spoken strings. Required: this package never hardcodes copy. */
  labels: DatePickerLabels;
  /** Marks "today" with the brand ring; defaults to the real today. */
  today?: Date;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export function DatePicker({
  value,
  defaultValue = null,
  onChange,
  month,
  defaultMonth,
  onMonthChange,
  min,
  max,
  isDateDisabled,
  labels,
  today,
  className,
  ref,
}: DatePickerProps): React.ReactElement {
  const controlledValue = value !== undefined;
  const [innerValue, setInnerValue] = React.useState<Date | null>(defaultValue);
  const selected = controlledValue ? value : innerValue;

  const todayDate = React.useMemo(() => startOfDay(today ?? new Date()), [today]);

  const controlledMonth = month !== undefined;
  const [innerMonth, setInnerMonth] = React.useState<Date>(() =>
    startOfMonth(defaultMonth ?? selected ?? todayDate),
  );
  const visibleMonth = controlledMonth ? startOfMonth(month) : innerMonth;

  const [focusedDate, setFocusedDate] = React.useState<Date>(
    () => selected ?? startOfMonth(visibleMonth),
  );
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const shouldRefocus = React.useRef(false);

  const isDisabled = React.useCallback(
    (date: Date): boolean => {
      if (min && date.getTime() < startOfDay(min).getTime()) return true;
      if (max && date.getTime() > startOfDay(max).getTime()) return true;
      return isDateDisabled?.(date) ?? false;
    },
    [min, max, isDateDisabled],
  );

  const goToMonth = (next: Date) => {
    const normalised = startOfMonth(next);
    if (!controlledMonth) setInnerMonth(normalised);
    onMonthChange?.(normalised);
  };

  const moveFocus = (next: Date) => {
    shouldRefocus.current = true;
    setFocusedDate(next);
    if (
      next.getMonth() !== visibleMonth.getMonth() ||
      next.getFullYear() !== visibleMonth.getFullYear()
    ) {
      goToMonth(next);
    }
  };

  React.useEffect(() => {
    if (!shouldRefocus.current) return;
    shouldRefocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>('[data-oz-day-focus="true"]')?.focus();
  }, [focusedDate]);

  const select = (date: Date) => {
    if (isDisabled(date)) return;
    if (!controlledValue) setInnerValue(date);
    setFocusedDate(date);
    onChange?.(date);
  };

  const days = React.useMemo(() => monthMatrix(visibleMonth), [visibleMonth]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (event.key in map) {
      event.preventDefault();
      moveFocus(addDays(focusedDate, map[event.key]!));
      return;
    }
    switch (event.key) {
      case 'Home':
        event.preventDefault();
        moveFocus(addDays(focusedDate, -mondayFirstIndex(focusedDate)));
        return;
      case 'End':
        event.preventDefault();
        moveFocus(addDays(focusedDate, 6 - mondayFirstIndex(focusedDate)));
        return;
      case 'PageUp':
        event.preventDefault();
        moveFocus(addMonths(focusedDate, -1));
        return;
      case 'PageDown':
        event.preventDefault();
        moveFocus(addMonths(focusedDate, 1));
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        select(focusedDate);
        return;
      default:
        return;
    }
  };

  const headTitle = `${labels.months[visibleMonth.getMonth()] ?? ''} ${visibleMonth.getFullYear()}`;

  return (
    <div
      ref={ref}
      className={cn(
        'flex w-[380px] max-w-full flex-col gap-4 rounded-xl bg-surface p-6 shadow-menu',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <MonthNavButton label={labels.prevMonth} onClick={() => goToMonth(addMonths(visibleMonth, -1))}>
          <ChevronLeft aria-hidden="true" />
        </MonthNavButton>
        <div aria-live="polite" className="text-[17px] font-bold text-ink">
          {headTitle}
        </div>
        <MonthNavButton label={labels.nextMonth} onClick={() => goToMonth(addMonths(visibleMonth, 1))}>
          <ChevronRight aria-hidden="true" />
        </MonthNavButton>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={labels.calendar}
        onKeyDown={onKeyDown}
        className="flex flex-col gap-1"
      >
        <div role="row" className="grid grid-cols-7">
          {labels.weekdays.map((name, i) => (
            <div
              key={i}
              role="columnheader"
              aria-label={name}
              className="grid h-8 place-items-center text-micro font-semibold text-ink3"
            >
              {name}
            </div>
          ))}
        </div>

        {Array.from({ length: 6 }, (_, row) => (
          <div key={row} role="row" className="grid grid-cols-7">
            {days.slice(row * 7, row * 7 + 7).map((date) => {
              const outside = date.getMonth() !== visibleMonth.getMonth();
              const isSelected = isSameDay(date, selected);
              const disabled = isDisabled(date);
              const isFocused = isSameDay(date, focusedDate);
              return (
                <div key={date.getTime()} role="gridcell" aria-selected={isSelected} className="grid place-items-center">
                  <button
                    type="button"
                    data-oz-day-focus={isFocused || undefined}
                    tabIndex={isFocused ? 0 : -1}
                    disabled={disabled}
                    aria-label={labels.day?.(date)}
                    aria-current={isSameDay(date, todayDate) ? 'date' : undefined}
                    onClick={() => select(date)}
                    className={cn(
                      'grid size-11 place-items-center rounded-pill text-label font-medium',
                      'transition-[background-color,color,transform] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
                      outside ? 'text-ink3' : 'text-ink',
                      isSameDay(date, todayDate) && !isSelected && 'ring-[1.5px] ring-brand ring-inset',
                      isSelected && 'bg-cta text-on-cta',
                      disabled && 'cursor-not-allowed text-ink3 opacity-40',
                      !disabled && !isSelected && 'hover:bg-surface2 active:scale-[.97]',
                    )}
                  >
                    {date.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthNavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'grid size-9 place-items-center rounded-pill text-ink2',
        'transition-[background-color,transform] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
        'hover:bg-surface2 active:scale-[.97]',
        '[&_svg]:size-5',
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ field */

export interface DateFieldProps extends Omit<DatePickerProps, 'className' | 'ref'> {
  /** Formatted selected date, e.g. `useFormat().date(value)`. */
  display?: string;
  placeholder?: string;
  variant?: InputVariant;
  state?: FieldState;
  invalid?: boolean;
  disabled?: boolean;
  /** Accessible name when there is no surrounding <Field> label. */
  'aria-label'?: string;
  className?: string;
  panelClassName?: string;
  align?: 'start' | 'center' | 'end';
  ref?: React.Ref<HTMLButtonElement>;
}

/** An <Input> with a `calendar` icon that opens <DatePicker> in a popover. */
export function DateField({
  display,
  placeholder,
  variant = 'default',
  state,
  invalid,
  disabled,
  className,
  panelClassName,
  align = 'start',
  onChange,
  ref,
  'aria-label': ariaLabel,
  ...picker
}: DateFieldProps): React.ReactElement {
  const field = useFieldControl();
  const resolvedState: FieldState =
    state ?? (invalid === true ? 'error' : (field?.state ?? 'default'));
  const isDisabled = disabled ?? field?.disabled;
  const [open, setOpen] = React.useState(false);

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger
        ref={ref}
        id={field?.id}
        type="button"
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-invalid={resolvedState === 'error' || undefined}
        aria-describedby={field?.describedById}
        className={cn(
          inputShellClasses({
            variant,
            state: resolvedState,
            disabled: Boolean(isDisabled),
            focused: open,
            filled: Boolean(display),
          }),
          'cursor-pointer text-left',
          className,
        )}
      >
        <span className={INPUT_ADORNMENT_CLASSES}>
          <Calendar aria-hidden="true" />
        </span>
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-body font-normal',
            display ? 'text-ink' : 'text-ink3',
          )}
        >
          {display ?? placeholder}
        </span>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          sideOffset={8}
          align={align}
          className="z-50 focus:outline-none"
        >
          <DatePicker
            {...picker}
            className={panelClassName}
            onChange={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
          />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
