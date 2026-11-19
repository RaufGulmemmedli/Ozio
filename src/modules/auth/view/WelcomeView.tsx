'use client';

/**
 * A5 — `/welcome` (`xosh-geldin.html`), step 3/3 of the first run.
 *
 * Export: bonus banner on `yellow`, radius 20, padding 20, 48px `block` gift tile, label 13/600
 * and amount 28/800 · heading 40/800 "Xoş gəldin, {name}!" · three tour rows separated by 1px
 * `line` hairlines, 44px number tile (`brand` for the first, `surface2` after), title 17/800,
 * description 14/400 · primary pill 60 "Başla".
 *
 * **The welcome bonus is server data.** `GET /api/auth/session` exposes `bonus` from the first
 * bonus card; the banner only appears when the server actually sent an amount — the design's
 * "+5,00 ₼" is never hardcoded.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { useRouter } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { usePrefs, useSession } from '@/core/session';
import { CreditCard, Gift, Trophy, Truck, type LucideIcon } from '@/shared/lucide';
import { Bone, Shimmer } from '@/shared/skeleton';
import { Button } from '@/shared/ui';

import { AuthHeading } from '../components/AuthHeading';
import { StepDots } from '../components/StepDots';
import { useAuthDestination } from '../hooks/use-auth-destination';

const TOUR: readonly { key: 'card' | 'lottery' | 'delivery'; icon: LucideIcon }[] = [
  { key: 'card', icon: CreditCard },
  { key: 'lottery', icon: Trophy },
  { key: 'delivery', icon: Truck },
];

export function WelcomeView() {
  const t = useTranslations('auth');
  const format = useFormat();
  const router = useRouter();
  const { final } = useAuthDestination();

  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const setOnboardingSeen = usePrefs((s) => s.setOnboardingSeen);

  const firstName = (user?.name ?? '').trim().split(/\s+/u)[0] ?? '';
  const bonus = user?.bonus ?? null;

  const start = () => {
    setOnboardingSeen(true);
    router.replace(final());
  };

  return (
    <main id="main" className="flex w-full flex-col gap-6">
      <StepDots total={3} current={3} label={t('welcome.step')} />

      {/* Server data: no amount, no banner. */}
      {status === 'unknown' ? (
        <Shimmer className="w-full" label={t('welcome.loadingBonus')}>
          <Bone w="100%" h={96} r="lg" />
        </Shimmer>
      ) : bonus !== null && bonus > 0 ? (
        <div className="flex w-full items-center gap-4 rounded-lg bg-yellow p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-block">
            <Gift aria-hidden="true" className="size-[22px] text-on-block" />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-caption font-semibold text-on-yellow">
              {t('welcome.bonus.label')}
            </span>
            <span className="text-[28px] font-extrabold leading-none text-on-yellow">
              {`+${format.money(bonus)}`}
            </span>
          </span>
        </div>
      ) : null}

      <AuthHeading
        title={
          firstName ? t('welcome.title', { name: firstName }) : t('welcome.titleFallback')
        }
        subtitle={t('welcome.subtitle')}
      />

      <ol className="flex w-full flex-col">
        {TOUR.map(({ key, icon: Icon }, index) => (
          <li
            key={key}
            className={cn(
              'flex w-full items-center gap-4 py-[14px]',
              index < TOUR.length - 1 && 'border-b border-line',
            )}
          >
            <span
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-pill',
                index === 0 ? 'bg-brand' : 'bg-surface2',
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn('size-5', index === 0 ? 'text-on-cta' : 'text-ink2')}
              />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span
                className={cn(
                  'text-[17px] font-extrabold',
                  index === 0 ? 'text-ink' : 'text-ink2',
                )}
              >
                {t(`welcome.tour.${key}.title`)}
              </span>
              <span className={cn('text-label font-normal', index === 0 ? 'text-ink2' : 'text-ink3')}>
                {t(`welcome.tour.${key}.body`)}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <Button type="button" size="3xl" fullWidth onClick={start}>
        {t('welcome.cta')}
      </Button>
    </main>
  );
}
