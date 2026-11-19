'use client';

/**
 * `/school/student-card` — SC4 "Tələbə kartı" (`sc4-school-student-card.html`, frame `jcgKy`)
 * **plus** the three card states from `sc-states-dialogs.html` (`RgPoP`), which are not separate
 * routes but the same screen at a different `state`:
 *
 * | server `state` | what renders |
 * | --- | --- |
 * | `linked` | the drawn SC4: status row + the real barcode/QR plate + night-discount + categories |
 * | `none` | `Card · Bağlı deyil` — the link form, and `Card · Xəta` when the mock answers 422 |
 * | `pending` | `Card · Yoxlanılır` — the verifying panel, which ends when the server says so |
 *
 * The card is a **real Code 128 symbol and a real QR** (`<StudentCardPlate>`), not an image, and
 * the night-discount window is the mock's clock, not a timer started at mount.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { Check } from '@/shared/lucide';
import { ErrorState } from '@/shared/states';
import { Button, confirmDialog, toast } from '@/shared/ui';

import { IdCard, Unlink } from '../components/icons';
import { LinkCardForm, VerifyingCard } from '../components/link-card-form';
import { NightCategories, NightDiscountCard } from '../components/night-discount-card';
import { SchoolDemoBanner } from '../components/school-demo-banner';
import { StudentCardPlate } from '../components/student-card-plate';
// From the fixtures, not from `school.mock.ts`: importing the handler module here would drag MSW
// into the view's bundle. The fixtures file has no `msw` dependency.
import { STUDENT_CARD_NUMBER } from '../data/school.fixtures';
import {
  useLinkStudentCard,
  useNightDiscountBoundary,
  useStudentCard,
  useUnlinkStudentCard,
} from '../hooks/use-student-card';
import { StudentCardSkeleton } from './StudentCardSkeleton';

export function StudentCardView() {
  const t = useTranslations('school');
  const failureMessage = useFailureMessage();

  const card = useStudentCard();
  const link = useLinkStudentCard();
  const unlink = useUnlinkStudentCard();
  const secondsLeft = useNightDiscountBoundary(card.data);

  const state = card.data?.state ?? 'none';
  const linked = state === 'linked';

  const confirmUnlink = async () => {
    const ok = await confirmDialog({
      title: t('unlink.title'),
      body: t('unlink.body'),
      confirmLabel: t('unlink.confirm'),
      cancelLabel: t('unlink.cancel'),
      destructive: true,
    });
    if (ok) {
      unlink.mutate(undefined, {
        onSuccess: () => toast.success(t('unlink.done')),
        onError: (failure) => toast.error(failureMessage(failure)),
      });
    }
  };

  const header = (
    <>
      <PageHeader
        title={t('card.title')}
        subtitle={t('card.subtitle')}
        backHref={paths.school}
        backLabel={t('crumb.school')}
        actions={
          linked ? (
            <Button
              variant="soft"
              size="lg"
              loading={unlink.isPending}
              leadingIcon={<Unlink size={20} aria-hidden="true" />}
              onClick={() => void confirmUnlink()}
            >
              {t('card.unlink')}
            </Button>
          ) : undefined
        }
      />
      <SchoolDemoBanner />
    </>
  );

  if (card.isPending) {
    return (
      <>
        {header}
        <StudentCardSkeleton />
      </>
    );
  }

  if (card.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={card.error}
          title={t('error.title')}
          message={t('error.body')}
          retryLabel={t('error.retry')}
          onRetry={() => void card.refetch()}
          retrying={card.isFetching}
        />
      </>
    );
  }

  const data = card.data;
  const discount = data?.nightDiscount;

  return (
    <>
      {header}

      <div className="flex w-full flex-col gap-8 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {state === 'none' ? (
            <LinkCardForm
              samplePlaceholder={t('link.numberPlaceholder', { sample: STUDENT_CARD_NUMBER })}
              busy={link.isPending}
              failure={link.error ?? null}
              onSubmit={(number) => link.mutate(number)}
            />
          ) : null}

          {state === 'pending' ? <VerifyingCard number={data?.number ?? ''} /> : null}

          {linked && data ? (
            <>
              <section
                aria-labelledby="card-status"
                className="flex w-full flex-row items-center gap-5 rounded-bento bg-surface p-6 lg:p-7"
              >
                <span
                  aria-hidden="true"
                  className="flex size-18 shrink-0 items-center justify-center rounded-[22px] bg-success-soft"
                >
                  <IdCard size={32} className="text-success" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h2 id="card-status" className="text-h4 font-extrabold text-ink lg:text-[22px]">
                    {t('card.numberLabel', { number: data.number })}
                  </h2>
                  <p className="text-label text-ink2">{data.verifiedNote}</p>
                </div>
                <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-pill bg-success-soft px-2.5 text-micro font-bold text-success">
                  <Check size={14} aria-hidden="true" />
                  {t('card.state.linked')}
                </span>
              </section>

              <StudentCardPlate number={data.number} />
            </>
          ) : null}

          {discount ? (
            <NightDiscountCard discount={discount} linked={linked} secondsLeft={secondsLeft} />
          ) : null}
        </div>

        {discount && discount.categories.length > 0 ? (
          <NightCategories categories={discount.categories} percent={discount.percent} />
        ) : null}
      </div>
    </>
  );
}
