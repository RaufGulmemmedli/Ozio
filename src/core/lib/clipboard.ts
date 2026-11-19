'use client';

/**
 * Copy to clipboard, with the `execCommand` fallback for non-secure origins and older Safari.
 * Used by the referral code, the loyalty card number and order references.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // denied permission or insecure origin — fall through
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.setAttribute('aria-hidden', 'true');
    area.style.position = 'fixed';
    area.style.top = '-9999px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    const selection = document.getSelection();
    const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    if (previous && selection) {
      selection.removeAllRanges();
      selection.addRange(previous);
    }
    return ok;
  } catch {
    return false;
  }
}

export interface UseClipboard {
  /** True for `resetMs` after a successful copy — drives the "Kopyalandı" state on the button. */
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

export function useCopyToClipboard(resetMs = 2000): UseClipboard {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clear = useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  useEffect(() => clear, [clear]);

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text);
      if (!ok) return false;
      clear();
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), resetMs);
      return true;
    },
    [clear, resetMs],
  );

  const reset = useCallback(() => {
    clear();
    setCopied(false);
  }, [clear]);

  return { copied, copy, reset };
}

/** `navigator.share`, with a `copyToClipboard` fallback. Returns what it did. */
export async function shareOrCopy(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return 'shared';
    } catch {
      // user dismissed, or share is unavailable for this payload
    }
  }
  const fallback = data.url ?? data.text ?? data.title ?? '';
  return fallback && (await copyToClipboard(fallback)) ? 'copied' : 'failed';
}
