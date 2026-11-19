'use client';

/**
 * `Composer` node: padding 16/24, gap 12 — a 52-high `bg` pill input and the 52 send circle
 * (`cta` when there is text, `surface2` when disabled, exactly as `support-chat-new.html` draws it).
 *
 * It is a **real `<form>`**: Enter submits (so the on-screen keyboard's "send" works), Shift+Enter
 * inserts a newline, and the textarea grows with the text up to four lines.
 */
import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/core/lib/cn';
import { ArrowRight } from '@/shared/lucide';

import { MAX_MESSAGE_LENGTH } from '../data/support.fixtures';

export interface ComposerProps {
  label: string;
  placeholder: string;
  sendLabel: string;
  /** "Enter — göndər, Shift+Enter — yeni sətir", tied to the field with aria-describedby. */
  hint: string;
  busy?: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  /** Already-localized failure message for the last send. */
  error?: string | null;
}

const MAX_ROWS = 4;

export function Composer({
  label,
  placeholder,
  sendLabel,
  hint,
  busy = false,
  disabled = false,
  onSend,
  error,
}: ComposerProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');

  // Grow with the content, capped at MAX_ROWS so the message list keeps its space.
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const line = 21;
    el.style.height = `${Math.min(el.scrollHeight, line * MAX_ROWS + 20)}px`;
  }, [value]);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !busy && !disabled;

  const submit = useCallback(() => {
    if (!canSend) return;
    onSend(trimmed);
    setValue('');
    areaRef.current?.focus();
  }, [canSend, onSend, trimmed]);

  return (
    <form
      className="flex w-full shrink-0 flex-col gap-1.5 border-t border-line px-5 py-4 md:px-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex w-full flex-row items-end gap-3">
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
        <textarea
          ref={areaRef}
          id={id}
          rows={1}
          value={value}
          placeholder={placeholder}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={disabled}
          aria-describedby={hintId}
          enterKeyHint="send"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.shiftKey) return;
            e.preventDefault();
            submit();
          }}
          className={cn(
            'min-h-[52px] w-full flex-1 resize-none rounded-pill bg-bg px-5 py-[15px]',
            'text-body-sm leading-[21px] text-ink placeholder:text-ink3',
            'outline-none disabled:opacity-60',
          )}
        />
        <button
          type="submit"
          aria-label={sendLabel}
          disabled={!canSend}
          className={cn(
            'flex size-[52px] shrink-0 items-center justify-center rounded-pill',
            'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--ease-out)]',
            canSend ? 'bg-cta text-on-cta' : 'bg-surface2 text-ink3',
          )}
        >
          <ArrowRight aria-hidden="true" size={20} />
        </button>
      </div>

      <p id={hintId} className="m-0 text-nano text-ink3">
        {hint}
      </p>

      {error ? (
        <p role="alert" className="m-0 text-caption font-semibold text-brand">
          {error}
        </p>
      ) : null}
    </form>
  );
}
