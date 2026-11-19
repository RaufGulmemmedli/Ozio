import type { ReactNode } from 'react';

import { CircleAlert, MapPinOff, Store, TriangleAlert } from '@/shared/lucide';

import { InlineNotice, type InlineNoticeProps } from './inline-notice';

type DomainNoticeProps = Omit<InlineNoticeProps, 'tone' | 'icon'> & {
  /** Already-localized bold lead-in. */
  title?: ReactNode;
  /** Already-localized sentence. */
  body?: ReactNode;
};

/**
 * Store closed (states-catalog.md §1.7 `wAk8X`, screen AX7).
 * "Mağaza hazırda bağlıdır" + what happens next; products can still be added
 * for a scheduled order, so this never changes the route.
 */
export function ClosedBanner({ title, body, multiline = true, ...rest }: DomainNoticeProps) {
  return (
    <InlineNotice
      tone="warning"
      icon={Store}
      title={title}
      body={body}
      multiline={multiline}
      role="status"
      {...rest}
    />
  );
}

/**
 * Product out of stock (states-catalog.md §1.7 `nmFNI`, screen AX5).
 * Pair it with the disabled Add button and the "Bənzər məhsullar" rail.
 */
export function OutOfStockNotice({ title, body, ...rest }: DomainNoticeProps) {
  return (
    <InlineNotice
      tone="error"
      icon={CircleAlert}
      title={title}
      body={body}
      role="status"
      {...rest}
    />
  );
}

/**
 * Out of delivery zone (states-catalog.md §1.7 `D1eUt`, screen UN7).
 * Shown inside the address form while save stays disabled.
 */
export function OutOfZoneNotice({ title, body, multiline = true, ...rest }: DomainNoticeProps) {
  return (
    <InlineNotice
      tone="warning"
      icon={MapPinOff}
      title={title}
      body={body}
      multiline={multiline}
      role="alert"
      {...rest}
    />
  );
}

/**
 * Generic "heads-up" strip for the remaining inline cases (delivery delay,
 * scheduled slot, partial outage). `tone`/`icon` default to the warning look.
 */
export function WarningNotice({ title, body, ...rest }: DomainNoticeProps) {
  return (
    <InlineNotice
      tone="warning"
      icon={TriangleAlert}
      title={title}
      body={body}
      role="status"
      {...rest}
    />
  );
}
