'use client';

/**
 * `/invite` — "Dostunu gətir" (`referral.html`, node `TqTcl`).
 *
 * The honest version of this screen:
 *  - the code is the **real** `ref_code` from `GET v1/profile/me` when the server sends one;
 *  - it is **null on the live test account**, so the mock's sample code is used instead and the
 *    demo banner keeps saying "Dəvət proqramı hələ qoşulmayıb, bu nümunə koddur.";
 *  - with no code at all, the screen is `referral-unavailable.html` — a documented state;
 *  - the invite list, the progress and the reward are **mock only**. There is no referral API.
 *
 * States: loading → `InviteSkeleton` (`referral-loading.html`), unavailable →
 * `ReferralUnavailable` (`referral-unavailable.html`), error → `<ErrorState>` with the same
 * "Yenilə" action the design gives the unavailable screen, loaded → `referral.html`.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { DemoBanner, ErrorState } from '@/shared/states';

import { ReferralCodeHero } from '../components/referral-code-hero';
import { ReferralInvitedList } from '../components/referral-invited-list';
import { ReferralSteps } from '../components/referral-steps';
import { useReferral } from '../hooks/use-referral';
import { useShareCode } from '../hooks/use-share-code';
import { InviteSkeleton } from './invite-skeleton';
import { ReferralUnavailable } from './referral-unavailable';

export function InviteView() {
  const t = useTranslations('referral');
  const failureMessage = useFailureMessage();

  const { referral, isPending, isError, failure, isRefetching, refetch, unavailable } =
    useReferral();

  // The hook is called unconditionally (rules of hooks); an empty code just means nothing to share.
  const share = useShareCode(referral?.code ?? '');

  const header = (
    <PageHeader
      title={t('title')}
      subtitle={t('subtitle')}
      backHref={paths.profile}
      backLabel={t('back')}
    />
  );

  if (isPending) {
    return (
      <>
        {header}
        <InviteSkeleton />
      </>
    );
  }

  if (isError) {
    return (
      <>
        {header}
        <DemoBanner module="profile_referral" body={t('demo.body')} />
        <ErrorState
          failure={failure}
          title={t('error.title')}
          message={failure ? failureMessage(failure) : undefined}
          retryLabel={t('unavailable.action')}
          onRetry={refetch}
          retrying={isRefetching}
        />
      </>
    );
  }

  if (unavailable || referral === null) {
    return (
      <>
        {header}
        {/* The export omits the demo notice on this state; the build contract requires it on every
            mock screen, and it is exactly the sentence this state needs. */}
        <DemoBanner module="profile_referral" body={t('demo.body')} />
        <ReferralUnavailable onRetry={refetch} retrying={isRefetching} />
      </>
    );
  }

  return (
    <>
      {header}
      <DemoBanner module="profile_referral" body={t('demo.body')} />

      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-6">
          <ReferralCodeHero
            code={referral.code}
            copied={share.copied}
            onCopy={share.copyCode}
            onShare={share.shareCode}
          />
          <ReferralSteps rewardPerInvite={referral.rewardPerInvite} />
        </div>

        <ReferralInvitedList invited={referral.invited} />
      </div>
    </>
  );
}
