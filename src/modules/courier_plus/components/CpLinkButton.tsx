'use client';

/**
 * `<Button as="a">` with the active locale prefix applied, so a pill-shaped CTA is still a real
 * link (right-click, middle-click, crawlers) and still goes to `/ru/...` / `/en/...`.
 *
 * // TODO(core): `@/shared/ui`'s `<Button>` has no locale-aware `href`; this wrapper exists in
 * // several modules and belongs there.
 */
import { useLocale } from 'next-intl';

import { getPathname } from '@/core/i18n/navigation';
import { Button, type ButtonProps } from '@/shared/ui';

export interface CpLinkButtonProps extends Omit<ButtonProps, 'as' | 'type'> {
  href: string;
}

export function CpLinkButton({ href, ...rest }: CpLinkButtonProps) {
  const locale = useLocale();
  return <Button {...rest} as="a" href={getPathname({ href, locale })} />;
}
