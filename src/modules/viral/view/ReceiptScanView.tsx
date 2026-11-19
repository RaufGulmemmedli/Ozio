'use client';

/**
 * `/viral/receipt-scan` — V7 "Kassa çeki skaneri" (`v7-viral-receipt-scan.html`, frame `a2aaX`).
 *
 * The export draws the **result**: the items panel (store, "Dünən · 5 məhsul tapıldı", the
 * "Çek oxundu" pill, the Məhsul / Mağaza / Ozio table) next to the dark comparison card. The two
 * states before it come from `v-states-dialogs.html`:
 *
 *  - `State · Çeki çərçivəyə sal` → `<ReceiptDropzone>`, with "Kamera yoxdur? Çekin şəklini yüklə.";
 *  - `State · Çek skan olunur…` → the scanning notice plus `<ReceiptScanSkeleton>`;
 *  - plus the not-recognized state the brief asks for, which the mock answers with
 *    `recognized: false` (a 200, not a failure) — the dropzone comes back with a message.
 *
 * ## The photo never leaves the browser
 *
 *  - capture is `<input type="file" accept="image/*" capture="environment">`; the `getUserMedia`
 *    preview is optional, asked for only when the user presses "Kameranı aç", and its module is a
 *    **dynamic import** so the camera code stays out of the app shell;
 *  - `useReceiptScan` downscales the capture in a `<canvas>` (max 1280 px on the long edge) and
 *    hands *that* copy over, revoking every object URL — including on unmount;
 *  - the request is answered by MSW inside this page's own service worker, and `remote.mock()`
 *    cannot address the real host. `POST v1/file/upload` is **not** used: `api/README.md` says it
 *    is a plain file store, not a recognition endpoint, so sending a receipt there would park a
 *    user's shopping in a bucket for nothing.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { CircleAlert, ScanLine } from '@/shared/lucide';
import { ErrorState, InlineNotice } from '@/shared/states';
import { Button, toast } from '@/shared/ui';

import { ComparisonCard } from '../components/comparison-card';
import { ReceiptDropzone } from '../components/receipt-dropzone';
import { ReceiptItems } from '../components/receipt-items';
import { ViralDemoBanner } from '../components/viral-demo-banner';
import { useAddReceiptToCart, useReceiptScan } from '../hooks/use-receipt-scan';
import { ReceiptScanSkeleton } from './ReceiptScanSkeleton';

export function ReceiptScanView() {
  const t = useTranslations('viral');
  const { money } = useFormat();
  const failureMessage = useFailureMessage();

  const { capture, take, clear, preparing, decodeFailed, scan } = useReceiptScan();
  const addToCart = useAddReceiptToCart();

  const [notRecognized, setNotRecognized] = useState(false);

  const receipt = scan.data?.recognized ? scan.data : null;
  const busy = preparing || scan.isPending;

  const start = async (file: Blob) => {
    setNotRecognized(false);
    const prepared = await take(file);
    if (!prepared) return;
    scan.mutate(
      { blob: prepared.blob, width: prepared.width, height: prepared.height },
      {
        onSuccess: (result) => setNotRecognized(!result.recognized),
      },
    );
  };

  const reset = () => {
    clear();
    scan.reset();
    setNotRecognized(false);
  };

  return (
    <>
      <PageHeader
        title={t('scan.title')}
        subtitle={t('scan.subtitle')}
        backHref={paths.viral}
        backLabel={t('crumb.viral')}
        actions={
          receipt ? (
            <Button
              variant="soft"
              size="lg"
              leadingIcon={<ScanLine size={20} aria-hidden="true" />}
              onClick={reset}
            >
              {t('scan.again')}
            </Button>
          ) : undefined
        }
      />

      <ViralDemoBanner />

      {/* A transport failure is an error panel; `recognized: false` is not. */}
      {scan.isError ? (
        <ErrorState
          failure={scan.error}
          title={t('error.title')}
          message={failureMessage(scan.error)}
          retryLabel={t('error.retry')}
          onRetry={reset}
        />
      ) : null}

      {decodeFailed ? (
        <InlineNotice
          tone="error"
          icon={CircleAlert}
          role="alert"
          title={t('scan.decodeFailed.title')}
          body={t('scan.decodeFailed.body')}
        />
      ) : null}

      {notRecognized ? (
        <InlineNotice
          tone="error"
          icon={CircleAlert}
          role="alert"
          title={t('scan.notRecognized.title')}
          body={t('scan.notRecognized.body')}
        />
      ) : null}

      {scan.isPending ? (
        <>
          <InlineNotice
            tone="info"
            icon={ScanLine}
            role="status"
            title={t('scan.scanning.title')}
            body={t('scan.scanning.body')}
          />
          <ReceiptScanSkeleton />
        </>
      ) : receipt ? (
        <div className="flex w-full flex-col gap-8 lg:flex-row">
          <ReceiptItems receipt={receipt} />
          <ComparisonCard
            receipt={receipt}
            busy={addToCart.isPending}
            onAddToCart={() =>
              addToCart.mutate(undefined, {
                onSuccess: (result) =>
                  toast.success({
                    title: t('scan.addedDemo', { count: result.itemCount }),
                    body: money(result.total),
                  }),
                onError: (failure) => toast.error(failureMessage(failure)),
              })
            }
          />
        </div>
      ) : (
        <ReceiptDropzone
          onPick={(file) => void start(file)}
          busy={busy}
          previewUrl={capture?.previewUrl ?? null}
        />
      )}
    </>
  );
}
