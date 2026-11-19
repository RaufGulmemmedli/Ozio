'use client';

/**
 * Mirror skeleton for `/checkout/payment`: the same two-column body (methods flex-1 + a 380 summary),
 * the same 84-high method rows and the same section captions. The page title and the section
 * captions stay real and un-shimmered (architecture/05 §2).
 */
import { useTranslations } from 'next-intl';
import { Bone, BoneCard, Shimmer, SummaryCardSkeleton } from '@/shared/skeleton';

export function PaymentMethodSkeleton() {
  const t = useTranslations('payment');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Bone w={160} h={13} r="xs" />
          {[0, 1].map((index) => (
            <BoneCard key={index} r="lg" pad={22} gap={16} row h={84}>
              <Bone w={60} h={40} r="sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <Bone w={index === 0 ? 150 : 180} h={16} r="sm" />
                <Bone w={220} h={12} r="xs" />
              </div>
              <Bone w={26} h={26} r="pill" />
            </BoneCard>
          ))}
          <BoneCard r="lg" pad={22} gap={12} row h={72}>
            <Bone w={20} h={20} r="xs" />
            <Bone w={160} h={16} r="sm" />
          </BoneCard>

          <div className="h-3" />
          <Bone w={140} h={13} r="xs" />
          {[0, 1].map((index) => (
            <BoneCard key={index} r="lg" pad={22} gap={16} row h={84}>
              <Bone w={60} h={40} r="sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <Bone w={index === 0 ? 70 : 130} h={16} r="sm" />
                <Bone w={240} h={12} r="xs" />
              </div>
              <Bone w={26} h={26} r="pill" />
            </BoneCard>
          ))}
        </div>

        <div className="w-full shrink-0 lg:w-[380px]">
          <SummaryCardSkeleton rows={3} />
        </div>
      </div>
    </Shimmer>
  );
}
