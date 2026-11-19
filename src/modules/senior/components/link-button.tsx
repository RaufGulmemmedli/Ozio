'use client';

/**
 * `<Button as="a">` with the active locale prefix applied.
 *
 * TODO(core): `@/shared/ui`'s `<Button>` only accepts `as: 'button' | 'a'`, so a plain `href`
 * would drop the `/ru` · `/en` prefix that `@/core/i18n/navigation`'s `<Link>` adds. A
 * `<LinkButton>` in `@/shared/ui` would remove this wrapper (coupons, lottery and the other idea
 * modules keep an identical copy, since modules may not import each other's internals).
 */
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';

import { getPathname } from '@/core/i18n';
import { Button, type ButtonProps } from '@/shared/ui';

export interface LinkButtonProps extends Omit<ButtonProps, 'as' | 'href'> {
  href: string;
  children?: ReactNode;
}

export function LinkButton({ href, ...rest }: LinkButtonProps) {
  const locale = useLocale();
  return <Button {...rest} as="a" href={getPathname({ href, locale })} />;
}
