'use client';

/**
 * `Route Summary` (`c9F0G2`) and `Route Card` (`uVeqa`): the declared route as four
 * `label ↔ value` rows plus one soft "Marşrutu dəyiş" button.
 */
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { Badge } from '@/shared/ui';

import { minutesToClock, type CpRoute } from '../data/models/courier-plus';

import { CpLinkButton } from './CpLinkButton';
import { CpCard, CpCardHeader, CpInfoRow, CpInfoRows } from './CpPrimitives';

export interface CpRouteSummaryCardProps {
  route: CpRoute;
  /** Shows the "Aktiv" / "Deaktiv" pill next to the title (the landing card does). */
  showStatus?: boolean;
  /** `360` on the matches screen, fluid on the landing. */
  className?: string;
  titleKey?: 'home.route' | 'matches.routeSummary';
  titleId?: string;
}

export function CpRouteSummaryCard({
  route,
  showStatus = false,
  className,
  titleKey = 'matches.routeSummary',
  titleId = 'cp-route-summary',
}: CpRouteSummaryCardProps) {
  const t = useTranslations('courier_plus');
  const declared = Boolean(route.from.trim() && route.to.trim());

  return (
    <CpCard className={className} aria-labelledby={titleId}>
      <CpCardHeader
        title={t(titleKey)}
        titleId={titleId}
        tag={
          showStatus ? (
            <Badge tone={route.active && declared ? 'success' : 'neutral'}>
              {route.active && declared ? t('home.routeActive') : t('home.routeInactive')}
            </Badge>
          ) : null
        }
      />

      <CpInfoRows>
        <CpInfoRow label={t('home.from')} value={declared ? route.from : '—'} />
        <CpInfoRow label={t('home.to')} value={declared ? route.to : '—'} />
        <CpInfoRow label={t('matches.timeLabel')} value={minutesToClock(route.departMinutes)} />
        <CpInfoRow label={t('home.transport')} value={t(`transport.${route.transport}`)} />
      </CpInfoRows>

      <CpLinkButton href={paths.courierPlusRoute} variant="soft" size="lg" fullWidth>
        {declared ? t('matches.changeRoute') : t('home.setRoute')}
      </CpLinkButton>
    </CpCard>
  );
}
