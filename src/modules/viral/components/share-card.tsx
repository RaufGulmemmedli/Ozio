'use client';

/**
 * V4's "Linki paylaş" column (380 wide, white, radius 28, padding 28, gap 16).
 *
 * Measured: title 20/800, a 52-high `surface2` link field at radius 16 with a `link` glyph, a
 * 52-high soft "Linki kopyala" and a 52-high brand "WhatsApp-da paylaş".
 *
 * Sharing goes through `navigator.share` with a `copyToClipboard` fallback (`shareOrCopy` from
 * `@/core/lib/clipboard`) plus a toast, so a desktop browser without the Web Share API still
 * works. The WhatsApp button uses the same path rather than opening `wa.me`, because the demo must
 * not hand a share URL to a third party.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { copyToClipboard, shareOrCopy } from '@/core/lib/clipboard';
import { Copy } from '@/shared/lucide';
import { Button, toast } from '@/shared/ui';

import { Link2, Send } from './icons';

export interface ShareCardProps {
  link: string;
  /** Used in the share sheet's text. */
  title: string;
}

export function ShareCard({ link, title }: ShareCardProps) {
  const t = useTranslations('viral');
  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);

  const copy = async () => {
    setCopying(true);
    try {
      const ok = await copyToClipboard(link);
      if (ok) toast.success(t('share.copied'));
      else toast.error(t('share.failed'));
    } finally {
      setCopying(false);
    }
  };

  const share = async () => {
    setSharing(true);
    try {
      const outcome = await shareOrCopy({
        title,
        text: t('share.text', { title }),
        url: link,
      });
      if (outcome === 'failed') toast.error(t('share.failed'));
      else toast.success(outcome === 'shared' ? t('share.shared') : t('share.copied'));
    } finally {
      setSharing(false);
    }
  };

  return (
    <aside
      aria-labelledby="viral-share"
      className="flex w-full flex-col gap-4 rounded-xl bg-surface p-7 lg:w-[380px] lg:shrink-0"
    >
      <h2 id="viral-share" className="text-h4 font-extrabold text-ink">
        {t('share.title')}
      </h2>

      <p className="flex h-13 w-full flex-row items-center gap-2.5 overflow-hidden rounded-md bg-surface2 px-4">
        <Link2 size={18} aria-hidden="true" className="shrink-0 text-ink3" />
        <span className="min-w-0 truncate text-label text-ink2">{link}</span>
      </p>

      <Button
        variant="soft"
        size="xl"
        fullWidth
        loading={copying}
        leadingIcon={<Copy size={20} aria-hidden="true" />}
        onClick={() => void copy()}
      >
        {t('share.copy')}
      </Button>

      <Button
        variant="brand"
        size="xl"
        fullWidth
        loading={sharing}
        leadingIcon={<Send size={20} aria-hidden="true" />}
        onClick={() => void share()}
      >
        {t('share.send')}
      </Button>
    </aside>
  );
}
