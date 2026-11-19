'use client';

/**
 * PR2 · "Partnyor detalı" — `/market/partners/[id]` (`app-partnyor-detali.html`, frame `cwOP7`).
 *
 * Cover 280 (`brand`, r36) → two-column body: "Necə keşbek qazanırsan" (3 steps), "Aktiv
 * kampaniyalar", "Filiallar" (list + the few mappable points) | side column with the hours,
 * contact links and the cashback rules.
 *
 * Data reality:
 *  - the brand itself comes from the category listing (`usePartnerBrand`), because there is no
 *    brand-by-id endpoint;
 *  - the per-branch `bonus_percentage` is the only cashback figure on live, so the cover shows the
 *    **highest branch rate** and says so, instead of inventing a brand-wide rate;
 *  - 191 of 197 live branches have no coordinate and 190 no opening hours, so the hours card and
 *    the branch distances only appear when the data is actually there.
 */
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { Link } from '@/core/i18n/navigation';
import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Breadcrumbs, Button } from '@/shared/ui';
import { EmptyState, ErrorState, InlineNotice } from '@/shared/states';
import {
  ArrowUpRight,
  Phone,
  Globe,
  MapPinOff,
  Percent,
  QrCode,
  ShoppingBasket,
  Store,
  Wallet,
} from '@/shared/lucide';

import { BranchRow } from '../components/BranchRow';
import { CampaignCard } from '../components/CampaignCard';
import { PartnerLogo } from './../components/PartnerLogo';
import { useBranches, useCampaigns, usePartnerBrand } from '../hooks';
import { isOpenAt, maxCashback, minutesToClock, type Branch } from '../data/models/partner';
import { PartnerDetailSkeleton } from './PartnersSkeleton';

const STEP_ICONS = [QrCode, ShoppingBasket, Wallet] as const;
const STEP_TINTS = ['bg-brand-soft text-brand', 'bg-sky-soft text-sky', 'bg-success-soft text-success'] as const;

/** Minutes since midnight in Baku. Branch hours are Baku wall-clock and are read literally. */
function bakuNowMinutes(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Baku',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const hh = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const mm = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hh * 60 + mm;
}

export interface PartnerDetailViewProps {
  brandId: string;
}

export function PartnerDetailView({ brandId }: PartnerDetailViewProps) {
  const t = useTranslations('partners');
  const failureMessage = useFailureMessage();
  const { number, percentPoints } = useFormat();
  const params = useSearchParams();
  const categoryId = params?.get('category') ?? null;

  const resolution = usePartnerBrand(brandId, categoryId);
  const branchesQuery = useBranches(brandId);
  const campaigns = useCampaigns();

  const brand = resolution.data?.brand ?? null;
  const branchesData = branchesQuery.data;
  const branches = useMemo(() => branchesData ?? [], [branchesData]);
  const nowMinutes = useMemo(() => bakuNowMinutes(), []);

  const rate = brand?.cashbackPercent ?? maxCashback(branches);
  const rateIsPerBranch = brand?.cashbackPercent === null || brand?.cashbackPercent === undefined;
  const withHours = branches.filter((b) => b.openMinutes !== null && b.closeMinutes !== null);
  const openNowCount = withHours.filter((b) => isOpenAt(b, nowMinutes) === true).length;
  const mappable = branches.filter((b) => b.point !== null);
  const website = brand?.links.find((link) => /^https?:/i.test(link.url)) ?? null;

  if (resolution.isPending) return <PartnerDetailSkeleton label={t('loading')} />;

  if (resolution.isError) {
    return (
      <ErrorState
        failure={resolution.error}
        title={t('error.title')}
        message={failureMessage(resolution.error)}
        onRetry={() => resolution.refetch()}
        retryLabel={t('error.retry')}
        secondaryAction={
          <Button as="a" href={paths.marketPartners} variant="soft" size="lg">
            {t('detail.backToList')}
          </Button>
        }
      />
    );
  }

  if (!brand) {
    return (
      <EmptyState
        icon={Store}
        tone="brand"
        panel
        title={t('detail.notFound.title')}
        body={t('detail.notFound.body')}
        action={
          <Button as="a" href={paths.marketPartners} size="lg">
            {t('detail.backToList')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <Breadcrumbs
        label={t('detail.breadcrumbLabel')}
        items={[{ label: t('title'), href: paths.marketPartners }, { label: brand.name }]}
      />

      {/* Cover */}
      <section className="flex w-full flex-col justify-between gap-6 rounded-bento bg-brand p-7 md:min-h-[280px] md:flex-row md:items-end md:p-9">
        <div className="flex flex-col justify-between gap-5 md:h-full">
          <PartnerLogo name={brand.name} src={brand.imageUrl} size={88} radius={24} fontSize={34} />
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-h2 font-extrabold tracking-[-0.035em] text-white md:text-[44px]">
              {brand.name}
            </h1>
            <p className="m-0 text-body font-medium text-white/90">
              {t('detail.meta', {
                category: brand.categoryName,
                branches: number(brand.branchCount || branches.length),
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-[14px] md:items-end">
          <div className="flex flex-col items-start md:items-end">
            <p className="m-0 text-[72px] font-extrabold leading-none tracking-[-0.05em] text-yellow md:text-[120px]">
              {rate === null ? '—' : percentPoints(rate)}
            </p>
            <p className="m-0 text-body font-bold text-white">
              {rate === null
                ? t('detail.rateUnknown')
                : rateIsPerBranch
                  ? t('detail.ratePerBranch')
                  : t('detail.rateCaption')}
            </p>
          </div>
          <div className="flex flex-row flex-wrap gap-2.5">
            {website ? (
              <Button
                as="a"
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                variant="white"
                size="md"
                trailingIcon={<ArrowUpRight size={18} aria-hidden="true" />}
              >
                {t('detail.website')}
              </Button>
            ) : null}
            <Button as="a" href={paths.marketPartnerBranches(brand.id)} variant="ghost" size="md" className="border-white text-white">
              {t('detail.allBranches')}
            </Button>
          </div>
        </div>
      </section>

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-9">
          {/* How to earn — static copy from the export, not server data */}
          <section className="flex w-full flex-col gap-4">
            <h2 className="m-0 text-h3 font-extrabold tracking-[-0.02em] text-ink">
              {t('detail.howTo.title')}
            </h2>
            <ol className="m-0 grid w-full list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
              {[0, 1, 2].map((index) => {
                const Icon = STEP_ICONS[index];
                return (
                  <li key={index} className="flex flex-col gap-[14px]">
                    <span
                      aria-hidden="true"
                      className={`grid size-14 place-items-center rounded-[18px] ${STEP_TINTS[index]}`}
                    >
                      <Icon size={24} />
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="m-0 text-[17px] font-bold text-ink">
                        {t(`detail.howTo.step${index + 1}.title`)}
                      </p>
                      <p className="m-0 text-label leading-5 text-ink2">
                        {t(`detail.howTo.step${index + 1}.body`)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Campaigns */}
          <section className="flex w-full flex-col gap-4">
            <div className="flex w-full flex-row items-center justify-between gap-4">
              <h2 className="m-0 text-h3 font-extrabold tracking-[-0.02em] text-ink">
                {t('detail.campaigns.title')}
              </h2>
              <Link href={paths.offers} className="text-label font-semibold text-brand">
                {t('detail.campaigns.all')}
              </Link>
            </div>
            {campaigns.isPending ? (
              <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                <div className="h-[180px] rounded-xl bg-surface2" aria-hidden="true" />
                <div className="h-[180px] rounded-xl bg-surface2" aria-hidden="true" />
              </div>
            ) : campaigns.isError ? (
              <ErrorState
                compact
                failure={campaigns.error}
                title={t('detail.campaigns.errorTitle')}
                message={failureMessage(campaigns.error)}
                onRetry={() => campaigns.refetch()}
                retryLabel={t('error.retry')}
              />
            ) : (campaigns.data?.length ?? 0) === 0 ? (
              <InlineNotice tone="info" icon={Percent} body={t('detail.campaigns.empty')} multiline />
            ) : (
              <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                {(campaigns.data ?? []).slice(0, 2).map((campaign, index) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    tone={index % 2 === 0 ? 'yellow' : 'dark'}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Branches */}
          <section className="flex w-full flex-col gap-4">
            <div className="flex w-full flex-row items-center justify-between gap-4">
              <h2 className="m-0 text-h3 font-extrabold tracking-[-0.02em] text-ink">
                {t('detail.branches.title')}
              </h2>
              <Link
                href={paths.marketPartnerBranches(brand.id)}
                className="text-label font-semibold text-brand"
              >
                {t('detail.branches.count', { count: number(brand.branchCount || branches.length) })}
              </Link>
            </div>

            {mappable.length === 0 && branches.length > 0 ? (
              <InlineNotice
                tone="warning"
                icon={MapPinOff}
                title={t('detail.branches.noMapTitle')}
                body={t('detail.branches.noMapBody')}
                multiline
              />
            ) : null}

            {branchesQuery.isPending ? (
              <div className="flex w-full flex-col gap-3" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[76px] rounded-card bg-surface2" />
                ))}
              </div>
            ) : branchesQuery.isError ? (
              <ErrorState
                compact
                failure={branchesQuery.error}
                title={t('detail.branches.errorTitle')}
                message={failureMessage(branchesQuery.error)}
                onRetry={() => branchesQuery.refetch()}
                retryLabel={t('error.retry')}
              />
            ) : branches.length === 0 ? (
              <EmptyState
                compact
                panel
                icon={Store}
                title={t('detail.branches.emptyTitle')}
                body={t('detail.branches.emptyBody')}
              />
            ) : (
              <ul className="m-0 flex w-full list-none flex-col p-0">
                {branches.slice(0, 4).map((branch: Branch) => (
                  <BranchRow
                    key={branch.id}
                    branch={branch}
                    brandName={brand.name}
                    variant="list"
                    openNow={isOpenAt(branch, nowMinutes)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Side column */}
        <aside className="flex w-full flex-col gap-4 lg:w-[340px]">
          <section className="flex w-full flex-col gap-[14px] rounded-xl bg-surface p-6">
            <div className="flex w-full flex-row items-center justify-between gap-3">
              <h2 className="m-0 text-body-l font-extrabold text-ink">{t('detail.hours.title')}</h2>
              {withHours.length > 0 ? (
                <span
                  className={`rounded-pill px-3 py-[5px] text-micro font-bold ${
                    openNowCount > 0 ? 'bg-success-soft text-success' : 'bg-surface2 text-ink2'
                  }`}
                >
                  {openNowCount > 0 ? t('detail.hours.openNow') : t('detail.hours.closedNow')}
                </span>
              ) : null}
            </div>
            {withHours.length === 0 ? (
              <p className="m-0 text-label text-ink2">{t('detail.hours.unknown')}</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {withHours.slice(0, 5).map((branch) => (
                  <li key={branch.id} className="flex flex-row items-center justify-between gap-3">
                    <span className="truncate text-label text-ink2">{branch.name}</span>
                    <span className="shrink-0 text-label font-bold text-ink">
                      {minutesToClock(branch.openMinutes!)} – {minutesToClock(branch.closeMinutes!)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex w-full flex-col gap-[14px] rounded-xl bg-surface p-6">
            <h2 className="m-0 text-body-l font-extrabold text-ink">{t('detail.contact.title')}</h2>
            {brand.links.length === 0 && branches.every((b) => b.phone === null) ? (
              <p className="m-0 text-label text-ink2">{t('detail.contact.unknown')}</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-[14px] p-0">
                {branches
                  .filter((b) => b.phone !== null)
                  .slice(0, 2)
                  .map((branch) => (
                    <li key={`phone-${branch.id}`}>
                      <a
                        href={`tel:${branch.phone}`}
                        className="flex flex-row items-center gap-3 text-label font-semibold text-ink"
                      >
                        <Phone size={18} aria-hidden="true" className="text-ink3" />
                        {branch.phone}
                      </a>
                    </li>
                  ))}
                {brand.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-row items-center gap-3 text-label font-semibold text-ink"
                    >
                      <Globe size={18} aria-hidden="true" className="text-ink3" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex w-full flex-col gap-2.5 rounded-xl bg-violet-soft p-6">
            <h2 className="m-0 text-body-l font-extrabold text-ink">{t('detail.rules.title')}</h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {['one', 'two', 'three'].map((key) => (
                <li key={key} className="text-caption leading-[19px] text-ink">
                  {`• ${t(`detail.rules.${key}`)}`}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
