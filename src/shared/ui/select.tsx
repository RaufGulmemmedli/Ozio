'use client';

/**
 * <Select> — Radix Select wearing the <Input> skin, with the Dropdown panel
 * from components.md §6 ("Dropdown menu" `H3yZg`):
 * 260 wide, `surface`, 1px `line`, radius 20, padding 8, shadow `menu`;
 * items 44 high, radius 12, padding-inline 12, icon 18 `ink2` + label 14/500,
 * hover `surface2`.
 */

import * as RadixSelect from '@radix-ui/react-select';
import * as React from 'react';

import { cn } from '@/core/lib/cn';
import { Check, ChevronDown } from '@/shared/lucide';

import { useFieldControl, type FieldState } from './field';
import { INPUT_ADORNMENT_CLASSES, inputShellClasses, type InputVariant } from './input';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const SELECT_CONTENT_CLASSES =
  'z-50 max-h-[320px] w-[260px] overflow-y-auto rounded-lg border border-line bg-surface p-2 shadow-menu ' +
  '[transform-origin:var(--radix-select-content-transform-origin)]';

export const SELECT_ITEM_CLASSES =
  'flex h-11 cursor-pointer select-none items-center gap-3 rounded-[12px] px-3 ' +
  'text-label font-medium text-ink outline-none ' +
  'data-[highlighted]:bg-surface2 data-[state=checked]:bg-surface2 ' +
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40 ' +
  '[&_svg]:size-[18px] [&_svg]:shrink-0';

/** One row of the panel. Use it when passing `children` instead of `options`. */
export function SelectItem({
  value,
  icon,
  children,
  className,
  ...rest
}: RadixSelect.SelectItemProps & { icon?: React.ReactNode }): React.ReactElement {
  return (
    <RadixSelect.Item value={value} className={cn(SELECT_ITEM_CLASSES, className)} {...rest}>
      {icon ? <span className="text-ink2">{icon}</span> : null}
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="ml-auto text-brand">
        <Check aria-hidden="true" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options?: readonly SelectOption[];
  /** Alternative to `options`: your own <SelectItem>s. */
  children?: React.ReactNode;
  placeholder?: string;
  variant?: InputVariant;
  state?: FieldState;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  /** Rendered as the trigger's leading adornment. */
  leadingIcon?: React.ReactNode;
  /** Accessible name when there is no surrounding <Field> label. */
  'aria-label'?: string;
  className?: string;
  contentClassName?: string;
  /** Panel alignment relative to the trigger. */
  align?: 'start' | 'center' | 'end';
  onOpenChange?: (open: boolean) => void;
  ref?: React.Ref<HTMLButtonElement>;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  options,
  children,
  placeholder,
  variant = 'default',
  state,
  invalid,
  disabled,
  required,
  name,
  leadingIcon,
  className,
  contentClassName,
  align = 'start',
  onOpenChange,
  ref,
  ...rest
}: SelectProps): React.ReactElement {
  const field = useFieldControl();
  const resolvedState: FieldState =
    state ?? (invalid === true ? 'error' : (field?.state ?? 'default'));
  const isDisabled = disabled ?? field?.disabled;

  const [open, setOpen] = React.useState(false);
  const controlled = value !== undefined;
  const [innerValue, setInnerValue] = React.useState(defaultValue);
  const current = controlled ? value : innerValue;

  return (
    <RadixSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => {
        if (!controlled) setInnerValue(next);
        onValueChange?.(next);
      }}
      disabled={isDisabled}
      required={required ?? field?.required}
      name={name}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChange?.(next);
      }}
    >
      <RadixSelect.Trigger
        ref={ref}
        id={field?.id}
        aria-label={rest['aria-label']}
        aria-invalid={resolvedState === 'error' || undefined}
        aria-describedby={field?.describedById}
        className={cn(
          inputShellClasses({
            variant,
            state: resolvedState,
            disabled: Boolean(isDisabled),
            focused: open,
            filled: Boolean(current),
          }),
          'cursor-pointer text-left',
          className,
        )}
      >
        {leadingIcon ? <span className={INPUT_ADORNMENT_CLASSES}>{leadingIcon}</span> : null}
        <RadixSelect.Value
          placeholder={
            placeholder ? <span className="text-ink3">{placeholder}</span> : undefined
          }
          className="min-w-0 flex-1 truncate text-body font-normal"
        />
        <RadixSelect.Icon className="ml-auto flex shrink-0 items-center text-ink2">
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-5 transition-transform duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
              open && 'rotate-180',
            )}
          />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={8}
          align={align}
          className={cn(SELECT_CONTENT_CLASSES, contentClassName)}
        >
          <RadixSelect.Viewport className="flex flex-col gap-0.5">
            {options
              ? options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    icon={option.icon}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))
              : children}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
