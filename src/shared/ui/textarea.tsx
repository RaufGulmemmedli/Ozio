'use client';

/**
 * <Textarea> — the <Input> skin, multi-line.
 *
 * Spec: components.md §4. Same fill / border / radius / padding; min 3 rows,
 * optional auto-grow (used by order rating and support chat).
 */

import * as React from 'react';

import { cn } from '@/core/lib/cn';

import { useFieldControl, type FieldState } from './field';
import { INPUT_CONTROL_CLASSES, inputShellClasses, type InputVariant } from './input';

export interface TextareaProps extends React.ComponentPropsWithoutRef<'textarea'> {
  variant?: InputVariant;
  state?: FieldState;
  invalid?: boolean;
  /** Grow with the content instead of scrolling. */
  autoGrow?: boolean;
  /** Hard cap for `autoGrow`, in px. */
  maxHeight?: number;
  containerClassName?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export function Textarea({
  variant = 'default',
  state,
  invalid,
  autoGrow = false,
  maxHeight,
  rows = 3,
  className,
  containerClassName,
  disabled,
  id,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  ref,
  ...rest
}: TextareaProps): React.ReactElement {
  const field = useFieldControl();
  const resolvedState: FieldState =
    state ?? (invalid === true ? 'error' : (field?.state ?? 'default'));

  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [focused, setFocused] = React.useState(false);
  const [uncontrolledFilled, setUncontrolledFilled] = React.useState(
    () => defaultValue !== undefined && String(defaultValue).length > 0,
  );
  const filled = value !== undefined ? String(value).length > 0 : uncontrolledFilled;

  const resize = React.useCallback(() => {
    const el = innerRef.current;
    if (!el || !autoGrow) return;
    el.style.height = 'auto';
    const next = maxHeight ? Math.min(el.scrollHeight, maxHeight) : el.scrollHeight;
    el.style.height = `${next}px`;
    el.style.overflowY = maxHeight && el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [autoGrow, maxHeight]);

  React.useEffect(() => {
    resize();
  }, [resize, value]);

  return (
    <div
      className={cn(
        inputShellClasses({
          variant,
          state: resolvedState,
          disabled: Boolean(disabled),
          focused,
          filled,
          multiline: true,
        }),
        containerClassName,
      )}
    >
      <textarea
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.RefObject<HTMLTextAreaElement | null>).current = node;
        }}
        id={id ?? field?.id}
        rows={rows}
        disabled={disabled ?? field?.disabled}
        required={rest.required ?? field?.required}
        aria-invalid={resolvedState === 'error' || undefined}
        aria-describedby={field?.describedById}
        value={value}
        defaultValue={defaultValue}
        className={cn(
          INPUT_CONTROL_CLASSES,
          'h-auto resize-none leading-[1.5]',
          autoGrow && 'overflow-hidden',
          className,
        )}
        onChange={(event) => {
          if (value === undefined) setUncontrolledFilled(event.target.value.length > 0);
          resize();
          onChange?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...rest}
      />
    </div>
  );
}
