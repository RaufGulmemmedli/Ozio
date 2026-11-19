'use client';

/**
 * The courier strip (`app-order-tracking.html` `UgyAX`): r28, padding 20, a 56px avatar, name
 * 17/700 over "Kuryer · 4,9 ★" 13/400, then a soft 48 call button and a brand 48 message button.
 *
 * **The call/message buttons only appear when a phone number is actually present** — the courier
 * fields are unverified, so a `tel:` link is never invented. There is no messaging endpoint, so
 * "message" is an SMS link to the same number.
 */
import { useTranslations } from 'next-intl';
import { cn } from '@/core/lib/cn';
import { MessageCircle, Phone } from '@/shared/lucide';
import { Avatar, Card } from '@/shared/ui';
import type { OrderCourier } from '../data/models/order-detail';

export interface CourierCardProps {
  courier: OrderCourier;
  className?: string;
}

export function CourierCard({ courier, className }: CourierCardProps) {
  const t = useTranslations('orders');
  const name = courier.name?.trim();
  if (!name) return null;

  const phone = courier.phone?.replace(/\s+/g, '') ?? null;
  const meta = [t('courier.role'), courier.rating !== null ? `${courier.rating} ★` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card tone="surface" radius="xl" className={cn('flex items-center gap-[14px] p-5', className)}>
      <Avatar size={56} name={name} tone="violet" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[17px] font-bold text-ink">{name}</span>
        <span className="truncate text-caption text-ink2">{meta}</span>
      </div>

      {phone ? (
        <>
          <a
            href={`tel:${phone}`}
            aria-label={t('courier.call', { name })}
            className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-surface2 text-ink hover:bg-line"
          >
            <Phone size={22} aria-hidden="true" />
          </a>
          <a
            href={`sms:${phone}`}
            aria-label={t('courier.message', { name })}
            className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-brand text-white hover:bg-brand-dark"
          >
            <MessageCircle size={22} aria-hidden="true" />
          </a>
        </>
      ) : (
        <span className="text-caption text-ink3">{t('courier.noPhone')}</span>
      )}
    </Card>
  );
}
