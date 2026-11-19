'use client';

/**
 * P1 "App · Profil" — `/profile` (`app-profil.html`, frame `eeKNY`).
 *
 * What the export draws vs what `GET v1/profile/me` actually carries:
 *  - avatar "N", name, phone  → `name` / `phone` (verified).
 *  - "Gold səviyyə" + "Gold-a 120 ₼ qalıb" → **there is no tier/level field on the payload** (and
 *    no cashback percentage), so the yellow tag slot shows the one real card value instead: the
 *    spendable bonus balance, plus the card number. Nothing is computed here.
 *  - "48 Sifariş / 128,40 ₼ Keşbek / 5 Kupon" → assembled client-side from `v2/orders` total,
 *    `bonus_cards[0].total` and `v1/promo-code` count; a failed counter renders a dash.
 *  - the menu row counts come from `v1/profile/address`, `v1/profile/me/cards` and the
 *    notifications unread-count endpoint (each its own query, each optional).
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFlag } from '@/core/config';
import { useFormat } from '@/core/i18n';
import { useLocaleKey } from '@/core/query';
import { localeLabels, type AppLocale } from '@/core/i18n/routing';
import { useFailureMessage } from '@/core/i18n/failure-message';
import { paths } from '@/core/routes';
import { useTheme } from '@/core/theme';
import {
  Bell,
  CreditCard,
  Globe,
  History,
  LifeBuoy,
  LogOut,
  MapPin,
  Monitor,
  SlidersHorizontal,
  User,
  Users,
} from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { Button } from '@/shared/ui';
import { ErrorState } from '@/shared/states';

import { ProfileAvatar } from '../components/profile-avatar';
import { SettingsRow, SettingsRowGroup } from '../components/settings-row';
import { StatTile } from '../components/stat-tile';
import { formatPhone, primaryCard } from '../data/models/profile';
import {
  useAddressCount,
  useProfileStats,
  useUnreadCount,
} from '../hooks/use-profile-counts';
import { useProfile } from '../hooks/use-profile';
import { useSignOut } from '../hooks/use-sign-out';
import { ProfileSkeleton } from './ProfileSkeleton';

export function ProfileView() {
  const t = useTranslations('profile');
  const tSettings = useTranslations('settings');
  const format = useFormat();
  const locale = useLocaleKey() as AppLocale;
  const failureMessage = useFailureMessage();
  const { pref: themePref } = useTheme();

  const query = useProfile();
  const profile = query.data ?? null;
  // Every counter is another module's read; `null` means "not answered / failed" → a dash.
  const stats = useProfileStats(profile);
  const addressCount = useAddressCount();
  const unreadCount = useUnreadCount();

  const { signOut, busy } = useSignOut(profile?.phone);

  const referral = useFlag('referral');
  const supportChat = useFlag('supportChat');

  const header = (
    <PageHeader
      title={t('title')}
      subtitle={t('subtitle')}
      actions={
        <Button
          variant="ghost"
          size="lg"
          onClick={() => void signOut()}
          loading={busy}
          leadingIcon={<LogOut size={20} aria-hidden="true" />}
          className="border-brand text-brand hover:bg-brand-soft"
        >
          {t('signOut')}
        </Button>
      }
    />
  );

  if (query.isPending) {
    return (
      <>
        {header}
        <ProfileSkeleton label={t('loading')} />
      </>
    );
  }

  if (query.isError || !profile) {
    return (
      <>
        {header}
        <ErrorState
          failure={query.error}
          title={t('error.title')}
          message={query.error ? failureMessage(query.error) : undefined}
          onRetry={() => void query.refetch()}
          retryLabel={t('retry')}
        />
      </>
    );
  }

  const card = primaryCard(profile);
  const name = profile.name ?? t('identity.noName');
  // `undefined` = the counter query has not answered yet, `null` = it failed → both render a dash.
  const { orders, cashback, coupons } = stats;

  return (
    <>
      {header}

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-6">
        {/* ------------------------------------------------------------------ left: identity */}
        <div className="flex w-full flex-col gap-5 lg:w-[420px] lg:shrink-0">
          <div className="flex w-full flex-col gap-5 rounded-xl bg-block p-6 md:p-8">
            <div className="flex items-center gap-5">
              <ProfileAvatar profile={profile} size={88} />
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="m-0 truncate text-h3 font-extrabold text-on-block">{name}</p>
                {profile.phone ? (
                  <p className="m-0 text-body-sm font-normal text-on-block2">
                    {formatPhone(profile.phone)}
                  </p>
                ) : null}
              </div>
            </div>

            {/* The export's level tag slot. There is no tier on the payload, so it carries the
                one real card value: the spendable bonus balance (+ the card number). */}
            {card ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex h-7 items-center rounded-pill bg-yellow px-3 text-caption font-bold text-on-yellow">
                  {t('identity.balanceTag', { amount: format.money(card.bonus) })}
                </span>
                {card.cardNumber ? (
                  <span className="text-caption font-normal text-on-block2">
                    {t('identity.cardNumber', { number: card.cardNumber })}
                  </span>
                ) : null}
              </div>
            ) : null}

            <Button as="a" href={paths.profileEdit} variant="white" fullWidth>
              {t('identity.edit')}
            </Button>
          </div>

          <div className="flex w-full gap-3">
            <StatTile
              label={t('stats.orders')}
              value={orders === null ? null : format.number(orders)}
              unknownText={t('stats.unknown')}
              unknownHint={t('stats.unknownHint')}
            />
            <StatTile
              label={t('stats.cashback')}
              value={cashback === null ? null : format.money(cashback)}
              unknownText={t('stats.unknown')}
              unknownHint={t('stats.unknownHint')}
            />
            <StatTile
              label={t('stats.coupons')}
              value={coupons === null ? null : format.number(coupons)}
              unknownText={t('stats.unknown')}
              unknownHint={t('stats.unknownHint')}
            />
          </div>

          <button
            type="button"
            onClick={() => void signOut()}
            disabled={busy}
            className={cn(
              'flex h-14 w-full items-center justify-center gap-2.5 rounded-pill',
              'text-body font-semibold text-brand',
              'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
              'hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <LogOut size={20} aria-hidden="true" />
            {t('signOut')}
          </button>
        </div>

        {/* ---------------------------------------------------------------------- right: menu */}
        <SettingsRowGroup as="nav" label={t('menu.label')} className="lg:flex-1">
          <SettingsRow
            icon={User}
            label={t('menu.info')}
            sub={t('menu.infoSub')}
            href={paths.profileEdit}
          />
          <SettingsRow
            icon={MapPin}
            label={t('menu.addresses')}
            sub={
              addressCount === null ? undefined : t('menu.addressesSub', { count: addressCount })
            }
            href={paths.addresses}
          />
          {/* TODO(cart): agent M6 owns the card flows — this links straight to its add-card modal. */}
          <SettingsRow
            icon={CreditCard}
            label={t('menu.cards')}
            sub={t('menu.cardsSub')}
            href={paths.checkoutAddCard}
          />
          {/* TODO(notifications): agent M2 owns `/notifications`; only the badge is read here. */}
          <SettingsRow
            icon={Bell}
            label={t('menu.notifications')}
            sub={
              unreadCount === null
                ? undefined
                : t('menu.notificationsSub', { count: unreadCount })
            }
            href={paths.notifications}
          />
          <SettingsRow
            icon={Globe}
            label={t('menu.language')}
            value={localeLabels[locale]}
            href={paths.settingsLanguage}
          />
          <SettingsRow
            icon={Monitor}
            label={t('menu.theme')}
            value={tSettings(`theme.${themePref}`)}
            href={paths.settingsAppearance}
          />
          <SettingsRow
            icon={History}
            label={t('menu.history')}
            sub={t('menu.historySub')}
            href={paths.history}
          />
          <SettingsRow
            icon={SlidersHorizontal}
            label={t('menu.settings')}
            sub={t('menu.settingsSub')}
            href={paths.settings}
          />
          <SettingsRow
            icon={LifeBuoy}
            label={t('menu.help')}
            sub={t('menu.helpSub')}
            href={paths.help}
          />
          {referral ? (
            <SettingsRow
              icon={Users}
              label={t('menu.invite')}
              sub={t('menu.inviteSub')}
              href={paths.invite}
            />
          ) : null}
          {supportChat ? (
            <SettingsRow
              icon={LifeBuoy}
              label={t('menu.support')}
              sub={t('menu.supportSub')}
              href={paths.support}
            />
          ) : null}
        </SettingsRowGroup>
      </div>

    </>
  );
}
