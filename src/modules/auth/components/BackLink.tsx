'use client';

import type { ReactNode } from 'react';

import { Link } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { ArrowLeft } from '@/shared/lucide';

/**
 * The "Geri" row at the top of the form panel (`otp-kod.html` `OpCKH`): icon 18, gap 8,
 * label 15/600 `ink2`. 44px minimum touch target on mobile (`-m-2 p-2`).
 */
const CLASSES =
  'group -m-2 inline-flex w-fit items-center gap-2 rounded-md p-2 text-body-sm font-semibold ' +
  'text-ink2 transition-colors duration-[var(--oz-dur-fast)] hover:text-ink ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export function BackLink({
  children,
  href,
  onClick,
  className,
}: {
  children: ReactNode;
  /** Renders a locale-aware link. Omit it and pass `onClick` for a non-navigating action. */
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const content = (
    <>
      <ArrowLeft aria-hidden="true" className="size-[18px]" />
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(CLASSES, className)}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(CLASSES, className)}>
      {content}
    </button>
  );
}
