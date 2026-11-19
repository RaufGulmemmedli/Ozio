import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

/**
 * Title + subtitle block shared by every auth screen.
 *
 * Export (`giris.html` `Tri9D`): column, gap 10; title 40/800 `ink` (`-1px` tracking on
 * `/login` and `/otp`), subtitle 16/400 line-height 22-24 `ink2`. 40px is between `text-h1-app`
 * (36) and `text-h1` (48), so the pixel value is kept.
 */
export function AuthHeading({
  title,
  subtitle,
  as: As = 'h1',
  id,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  as?: 'h1' | 'h2';
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full flex-col gap-2.5', className)}>
      <As
        id={id}
        className="text-h2 font-extrabold leading-tight tracking-[-1px] text-ink md:text-[40px]"
      >
        {title}
      </As>
      {subtitle ? (
        <p className="w-full text-body font-normal leading-[22px] text-ink2">{subtitle}</p>
      ) : null}
    </div>
  );
}
