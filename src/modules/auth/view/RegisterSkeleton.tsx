'use client';

import { useTranslations } from 'next-intl';

import { Bone, FormSkeleton, Shimmer } from '@/shared/skeleton';

/**
 * Mirror skeleton for `/register`. The static chrome (back link, step dots, title, subtitle) is
 * rendered by the view and is **not** shimmered — only the four fields, the consent row and the
 * submit button are bones, at the same sizes and gaps as the real form.
 */
export function RegisterSkeleton() {
  const t = useTranslations('common');
  return (
    <Shimmer className="flex w-full flex-col gap-[22px]" label={t('loading')}>
      {/* Ad + Soyad side by side, then E-poçt and Doğum tarixi full width (56 high, radius 14). */}
      <FormSkeleton fields={2} cols={2} submit={false} />
      <FormSkeleton fields={2} cols={1} submit={false} />
      {/* consent row: 22px box + two text lines */}
      <div className="flex w-full items-start gap-3">
        <Bone w={22} h={22} r="xs" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Bone w="100%" h={14} r="xs" />
          <Bone w="60%" h={14} r="xs" />
        </div>
      </div>
      <Bone w="100%" h={60} r="pill" />
    </Shimmer>
  );
}
