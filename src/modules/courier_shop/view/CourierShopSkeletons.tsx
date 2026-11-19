'use client';

/**
 * The three loading frames, each a mirror of its loaded layout.
 *
 * Transcribed from `kuryerin-cantasi-yuklenir.html` (`AqiH4`),
 * `geyin-sec-qaytar-yuklenir.html` (`S29O4`) and `kuryer-ekspert-yuklenir.html` (`OYTuE`):
 * static chrome (shell, demo banner, page header, and the dark intro strip the bag draws for real)
 * stays real, every data block becomes a bone, one `<Shimmer>` per skeleton root, and bones on the
 * dark panels use the translucent `white` tone so they are visible on `block`.
 *
 * Same containers, gaps and columns as the loaded views, so nothing shifts when the data lands.
 */
import { useTranslations } from 'next-intl';

import { Bone, ProductGridSkeleton, Shimmer } from '@/shared/skeleton';

import { BagIntro } from '../components/bag-parts';
import { ShopColumns } from '../components/shop-chrome';

/** Bones on `bg-block`: `white` tone at low opacity, as the export's `#FFFFFF1F` bones. */
const onBlock = 'bg-white/[0.12]';

/** The 380 summary panel, dark, with its own bones (`Order Summary` / `Booking Summary`). */
function PanelSkeleton({ titleW = 80, leadW = 200 }: { titleW?: number; leadW?: number }) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-bento bg-block p-6 md:p-8">
      <Bone w={titleW} h={14} r={7} className={onBlock} />
      <Bone w={leadW} h={24} r={12} className={onBlock} />
      <Bone w="100%" h={16} r="xs" className={onBlock} />
      <Bone w="100%" h={16} r="xs" className={onBlock} />
      <Bone w="100%" h={16} r="xs" className={onBlock} />
      <Bone w="100%" h={56} r="pill" className={onBlock} />
    </div>
  );
}

/** `AqiH4` — intro strip real, 6 item bones in the same 3-up grid, mini-cart bones. */
export function CourierBagSkeleton() {
  const t = useTranslations('courier_shop');

  return (
    <ShopColumns
      aside={
        <Shimmer className="flex w-full flex-col gap-4 rounded-card bg-surface p-6">
          <Bone w={100} h={22} r={11} />
          <Bone w="100%" h={16} r="xs" />
          <Bone w="100%" h={16} r="xs" />
          <Bone w="100%" h={56} r="pill" />
        </Shimmer>
      }
    >
      <BagIntro />
      <Shimmer label={t('common.loading')} className="w-full">
        <ProductGridSkeleton cols={3} count={6} />
      </Shimmer>
    </ShopColumns>
  );
}

/** `S29O4` — product card bones (300 tile + 6 size bones), explainer bones, dark summary bones. */
export function CourierFitSkeleton() {
  const t = useTranslations('courier_shop');

  return (
    <ShopColumns
      aside={
        <Shimmer className="w-full">
          <PanelSkeleton />
        </Shimmer>
      }
    >
      <Shimmer label={t('common.loading')} className="flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-6 rounded-card bg-surface p-6 md:flex-row">
          {/* Two bones rather than one with responsive overrides: `Bone` sizes inline. */}
          <Bone w="100%" h={220} r={24} className="md:hidden" />
          <Bone w={300} h={300} r={24} className="hidden md:block" />
          <div className="flex min-w-0 flex-1 flex-col gap-[14px]">
            <Bone w={60} h={13} r={6.5} />
            <Bone w="min(360px, 100%)" h={26} r={13} />
            <Bone w={140} h={32} r="md" />
            <div className="flex w-full flex-row gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Bone key={i} w="100%" h={52} r={16} className="flex-1" />
              ))}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 rounded-card bg-surface p-6">
          <Bone w={160} h={22} r={11} />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex w-full flex-row items-center gap-4">
              <Bone w={44} h={44} r="md" />
              <Bone w="100%" h={16} r="xs" className="flex-1" />
            </div>
          ))}
        </div>
      </Shimmer>
    </ShopColumns>
  );
}

/** `OYTuE` — product bones (3 × 64), service bones (3 × 72), slot bones (5 pills), dark panel. */
export function CourierExpertSkeleton() {
  const t = useTranslations('courier_shop');

  return (
    <ShopColumns
      aside={
        <Shimmer className="w-full">
          <PanelSkeleton titleW={60} leadW={240} />
        </Shimmer>
      }
    >
      <Shimmer label={t('common.loading')} className="flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-4 rounded-card bg-surface p-6">
          <Bone w={100} h={22} r={11} />
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            {Array.from({ length: 3 }, (_, i) => (
              <Bone key={i} w="100%" h={64} r="lg" className="flex-1" />
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 rounded-card bg-surface p-6">
          <Bone w={140} h={22} r={11} />
          {Array.from({ length: 3 }, (_, i) => (
            <Bone key={i} w="100%" h={72} r="lg" />
          ))}
        </div>

        <div className="flex w-full flex-col gap-4 rounded-card bg-surface p-6">
          <Bone w={80} h={22} r={11} />
          <div className="flex w-full flex-row flex-wrap gap-2.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Bone key={i} w={120} h={44} r="pill" />
            ))}
          </div>
        </div>
      </Shimmer>
    </ShopColumns>
  );
}

/** The doorstep screen reuses the fit skeleton, as the screen spec says. */
export const DoorstepSkeleton = CourierFitSkeleton;

/** `/courier-expert/booking` while the reservation is read back. */
export function ExpertBookingSkeleton() {
  const t = useTranslations('courier_shop');
  return (
    <Shimmer
      label={t('common.loading')}
      className="flex w-full flex-col items-center gap-4 rounded-card bg-surface px-6 py-12 md:p-14"
    >
      <Bone w={96} h={96} r="lg" />
      <Bone w={280} h={28} r="md" />
      <Bone w="min(520px, 100%)" h={16} r="xs" />
      <div className="flex w-full max-w-[420px] flex-col gap-3 rounded-lg bg-surface2 p-5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex w-full flex-row items-center justify-between">
            <Bone w={70} h={14} r="xs" />
            <Bone w={100} h={14} r="xs" />
          </div>
        ))}
      </div>
      <Bone w={180} h={48} r="pill" />
    </Shimmer>
  );
}
