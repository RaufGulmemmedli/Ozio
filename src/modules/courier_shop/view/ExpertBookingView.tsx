'use client';

/**
 * `/courier-expert/booking` — "Rezerv təsdiqi" (`kuryer-ekspert-rezerv-tesdiqi.html`, `gZwVY`).
 *
 * Flutter receives the `ExpertBooking` through the router's `extra`, which a direct web load
 * cannot carry, so the screen reads the reservation back from the mock instead
 * (`GET expert/bookings/latest`) and — per the screen spec — redirects to `/courier-expert` when
 * there is none. The redirect shows the booking skeleton while it happens, never a blank frame.
 */
import { useEffect } from 'react';
import { useRouter } from '@/core/i18n';
import { useTranslations } from 'next-intl';

import { usePreview } from '@/core/query';
import { paths } from '@/core/routes';
import { WifiOff } from '@/shared/lucide';
import { ErrorState } from '@/shared/states';

import { ExpertBookingCard } from '../components/expert-parts';
import { ShopLinkButton, ShopScreen } from '../components/shop-chrome';
import { useLatestBooking } from '../hooks/use-courier-expert';
import { ExpertBookingSkeleton } from './CourierShopSkeletons';

export function ExpertBookingView() {
  const t = useTranslations('courier_shop');
  const router = useRouter();
  const booking = useLatestBooking();

  // `?preview=` must stay on this screen, or every preview would bounce to `/courier-expert`.
  const previewing = usePreview() !== null;
  const missing = booking.isSuccess && booking.data === null;

  useEffect(() => {
    if (missing && !previewing) router.replace(paths.courierExpert);
  }, [missing, previewing, router]);

  if (booking.isError) {
    return (
      <ShopScreen crumb={t('expert.booking.crumb')} title={t('expert.booking.title')}>
        <ErrorState
          className="rounded-card bg-surface px-6 py-14"
          icon={WifiOff}
          title={t('expert.error.title')}
          message={t('expert.error.body')}
          retryLabel={t('common.retry')}
          retrying={booking.isRefetching}
          onRetry={() => booking.refetch()}
          secondaryAction={
            <ShopLinkButton href={paths.courierExpert} variant="soft">
              {t('expert.empty.cta')}
            </ShopLinkButton>
          }
        />
      </ShopScreen>
    );
  }

  if (booking.isPending || !booking.data) {
    return (
      <ShopScreen crumb={t('expert.booking.crumb')} title={t('expert.booking.title')}>
        <ExpertBookingSkeleton />
      </ShopScreen>
    );
  }

  return (
    <ShopScreen
      crumb={t('expert.booking.crumb')}
      title={t('expert.booking.pageTitle')}
      subtitle={booking.data.ref}
    >
      <ExpertBookingCard
        booking={booking.data}
        action={
          <ShopLinkButton href={paths.orders} variant="primary">
            {t('expert.booking.cta')}
          </ShopLinkButton>
        }
      />
    </ShopScreen>
  );
}
