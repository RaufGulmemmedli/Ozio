'use client';

/**
 * `/school/grades` — SC2 "Qiymətlər → xal" (`sc2-school-grades.html`, frame `iqPR7`).
 *
 * Left column: the brand balance hero (label 15/700, "52 xal" at 64/800, body 15/400), the upload
 * dropzone, then "Qiymətlərim" and the grade rows. Right column (400): "Mükafatlar" and the three
 * reward cards.
 *
 * States, all reachable with `?preview=`:
 *  - loading → `<GradesSkeleton>` (the drawn `-skeleton` export);
 *  - empty → `State · Hələ qiymət yoxdur` from the states board, with "Şəkil seç";
 *  - error → `State · Yüklənmədi` with "Yenidən cəhd et".
 *
 * Nothing on this screen does arithmetic: the balance, each grade's points and each reward's
 * `affordable` all arrive from the mock, and a redeem's new balance comes back from the handler.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button, toast } from '@/shared/ui';

import { GradesTable } from '../components/grades-table';
import { GraduationCap } from '../components/icons';
import { RedeemDialog } from '../components/redeem-dialog';
import { RewardCard } from '../components/reward-card';
import { SchoolDemoBanner } from '../components/school-demo-banner';
import { UploadDropzone } from '../components/upload-dropzone';
import type { SchoolReward } from '../data/models/grade';
import { useGrades, useRedeemReward, useUploadGradePhoto } from '../hooks/use-grades';
import { GradesSkeleton } from './GradesSkeleton';

/** One file input serves both the dropzone and the empty state's "Şəkil seç". */
const UPLOAD_INPUT_ID = 'school-grades-photo';

export function GradesView() {
  const t = useTranslations('school');
  const failureMessage = useFailureMessage();

  const grades = useGrades();
  const upload = useUploadGradePhoto();
  const redeem = useRedeemReward();

  const [picked, setPicked] = useState<SchoolReward | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openRedeem = (reward: SchoolReward) => {
    setPicked(reward);
    redeem.reset();
    setDialogOpen(true);
  };

  const header = (
    <>
      <PageHeader
        title={t('grades.title')}
        subtitle={t('grades.subtitle')}
        backHref={paths.school}
        backLabel={t('crumb.school')}
      />
      <SchoolDemoBanner />
    </>
  );

  if (grades.isPending) {
    return (
      <>
        {header}
        <GradesSkeleton />
      </>
    );
  }

  if (grades.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={grades.error}
          title={t('error.title')}
          message={t('error.body')}
          retryLabel={t('error.retry')}
          onRetry={() => void grades.refetch()}
          retrying={grades.isFetching}
        />
      </>
    );
  }

  const data = grades.data;
  const hasGrades = (data?.grades.length ?? 0) > 0;

  return (
    <>
      {header}

      <div className="flex w-full flex-col gap-8 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <section
            aria-labelledby="grades-balance"
            className="flex w-full flex-col gap-2 rounded-bento bg-brand p-6 lg:p-8"
          >
            <h2 id="grades-balance" className="text-body-sm font-bold text-white">
              {t('grades.balanceLabel')}
            </h2>
            <p className="text-hero font-extrabold text-white" aria-live="polite">
              {t('points', { count: data?.balance ?? 0 })}
            </p>
            <p className="text-body-sm text-white/85">{t('grades.balanceBody')}</p>
          </section>

          <UploadDropzone
            inputId={UPLOAD_INPUT_ID}
            onPick={(file) => upload.mutate(file)}
            busy={upload.isPending}
          />

          {upload.isError ? (
            <p role="alert" className="text-caption text-brand">
              {failureMessage(upload.error)}
            </p>
          ) : null}

          <h2 className="text-h3 font-extrabold text-ink lg:text-[22px]">
            {t('grades.listTitle')}
          </h2>

          {hasGrades ? (
            <GradesTable grades={data?.grades ?? []} />
          ) : (
            <EmptyState
              panel
              tone="brand"
              icon={GraduationCap}
              title={t('grades.empty.title')}
              body={t('grades.empty.body')}
              action={
                <Button
                  variant="primary"
                  size="md"
                  loading={upload.isPending}
                  onClick={() => document.getElementById(UPLOAD_INPUT_ID)?.click()}
                >
                  {t('grades.upload.action')}
                </Button>
              }
            />
          )}
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-[400px] lg:shrink-0">
          <h2 className="text-h3 font-extrabold text-ink lg:text-[22px]">{t('rewards.title')}</h2>
          {(data?.rewards ?? []).map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onRedeem={openRedeem}
              busy={redeem.isPending && picked?.id === reward.id}
            />
          ))}
        </div>
      </div>

      <RedeemDialog
        reward={picked}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) redeem.reset();
        }}
        busy={redeem.isPending}
        result={redeem.data ?? null}
        failure={redeem.error ?? null}
        onConfirm={() => {
          if (!picked) return;
          redeem.mutate(picked.id, {
            onSuccess: (result) => {
              toast.success({
                title: t('redeem.success'),
                body: result.couponCode,
              });
            },
          });
        }}
      />
    </>
  );
}
