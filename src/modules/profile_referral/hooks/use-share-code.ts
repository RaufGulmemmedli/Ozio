'use client';

/**
 * Sharing the invite code.
 *
 * `navigator.share` when the browser has it, otherwise a clipboard copy plus the "Kopyalandı"
 * toast — `shareOrCopy` from `@/core/lib/clipboard` already implements exactly that fallback
 * chain (including the `execCommand` path for non-secure origins), so nothing is reimplemented
 * here.
 *
 * The shared text is the documented message: "Ozio-ya qoşul! Dəvət kodum: {code}".
 */
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

import { shareOrCopy, useCopyToClipboard } from '@/core/lib/clipboard';
import { toast } from '@/shared/ui';

export interface UseShareCode {
  /** True for ~2 s after a successful copy — drives the "Kopyalandı" button label. */
  copied: boolean;
  /** Copies the bare code. */
  copyCode: () => void;
  /** `navigator.share`, falling back to copying the invite message. */
  shareCode: () => void;
  /** The message that gets shared, exposed so the view can label the button. */
  message: string;
}

export function useShareCode(code: string): UseShareCode {
  const t = useTranslations('referral');
  const { copied, copy } = useCopyToClipboard();
  const message = t('code.shareMessage', { code });

  const copyCode = useCallback(() => {
    void (async () => {
      const ok = await copy(code);
      if (ok) toast.success(t('code.copiedToast'));
      else toast.error(t('code.copyFailed'));
    })();
  }, [code, copy, t]);

  const shareCode = useCallback(() => {
    void (async () => {
      const result = await shareOrCopy({ title: t('code.shareTitle'), text: message });
      // `shared` opened the OS sheet: the sheet is its own feedback, so no toast.
      if (result === 'copied') toast.success(t('code.copiedToast'));
      else if (result === 'failed') toast.error(t('code.copyFailed'));
    })();
  }, [message, t]);

  return { copied, copyCode, shareCode, message };
}
