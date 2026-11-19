'use client';

/**
 * A button-shaped link.
 *
 * `<Button as="a">` from `@/shared/ui` renders a raw `<a>`, which drops the locale prefix
 * (`/ru/...`, `/en/...`), so every in-app navigation that looks like a button goes through
 * next-intl's `<Link>` instead. Shapes and tones are the measured ones: 52 / 48 / 44 high, pill
 * radius, 15–16/700.
 *
 * TODO(core): if `@/shared/ui` ever grows a locale-aware `<LinkButton>`, delete this.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';

export type LinkButtonTone = 'primary' | 'white' | 'yellow' | 'soft';
export type LinkButtonSize = 52 | 48 | 44;

const TONES: Record<LinkButtonTone, string> = {
  primary: 'bg-cta text-on-cta hover:opacity-90',
  white: 'bg-white text-brand-dark hover:opacity-90',
  yellow: 'bg-yellow text-on-yellow hover:opacity-90',
  soft: 'bg-surface2 text-ink hover:bg-line',
};

const SIZES: Record<LinkButtonSize, string> = {
  52: 'h-13 px-7 text-body-sm',
  48: 'h-12 px-6 text-body-sm',
  44: 'h-11 px-5 text-label',
};

export interface LinkButtonProps {
  href: string;
  tone?: LinkButtonTone;
  size?: LinkButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

export function LinkButton({
  href,
  tone = 'primary',
  size = 52,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  children,
  className,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex shrink-0 flex-row items-center justify-center gap-2 rounded-pill font-bold',
        'transition-opacity active:scale-[.97]',
        TONES[tone],
        SIZES[size],
        fullWidth ? 'w-full' : 'w-fit',
        className,
      )}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}
