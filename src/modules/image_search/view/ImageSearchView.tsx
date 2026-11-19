'use client';

/**
 * `/search/image` — "Şəkillə axtar" (`LKV29` and its five sibling states).
 *
 * The real/mock split, in one place:
 *  - capture      → **browser only** (`<input type="file" capture>` + an optional `getUserMedia`
 *                   sheet). Nothing is uploaded; `POST v1/file/upload` is a plain upload, not a
 *                   recogniser, so it is never called.
 *  - recognition  → **MOCK** `POST /api/mock/image_search/recognize` (MSW, ~2.2 s, rotating samples)
 *  - the products → **REAL** `GET v1/stores/search` + `GET v1/stores/{storeId}/products?keyword=`
 *                   through the store module's own hooks and `<ProductCard>`.
 *
 * Every state is reachable from the UI and from `?preview=`:
 * `source | analyzing | loading | results | empty | not-recognized | error`.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { mswMode } from '@/core/config';
import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { Search, Sparkles, Sun, Tag } from '@/shared/lucide';
import { DemoBanner, EmptyState, ErrorState, StateButton } from '@/shared/states';
import type { ProductRow } from '@/modules/store';

import { CameraSheet } from '../components/CameraSheet';
import { CaptureDropZone } from '../components/CaptureDropZone';
import { EditQueryDialog } from '../components/EditQueryDialog';
import { ImageProductGrid } from '../components/ImageProductGrid';
import { AnalyzingPanel, type StepState } from '../components/AnalyzingPanel';
import { ImageSearchHeading } from '../components/ImageSearchHeading';
import { RecognizedCard } from '../components/RecognizedCard';
import { TextSearchLink } from '../components/TextSearchLink';
import { TipsCard } from '../components/TipsCard';
import { previewImageProducts } from '../data/image_search.preview';
import { labelPercent } from '../data/models/recognition';
import { useImageSearchFlow } from '../hooks/use-image-search-flow';
import { ImageSearchResultsSkeleton } from './ImageSearchResultsSkeleton';

const HEADING_ID = 'image-search-title';

/** Mocks switched off at build time → the recognition step cannot run at all. */
const MOCKS_OFF = mswMode === 'off';

export function ImageSearchView() {
  const t = useTranslations('image_search');
  const failureMessage = useFailureMessage();
  const flow = useImageSearchFlow();
  const [cameraOpen, setCameraOpen] = useState(false);
  const pickRef = useRef<(() => void) | null>(null);

  const cameraSupported =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function';

  const rejectionMessage = useMemo(() => {
    switch (flow.rejection) {
      case 'tooLarge':
        return t('file.tooLarge');
      case 'wrongType':
        return t('file.wrongType');
      case 'unreadable':
        return t('file.unreadable');
      default:
        return null;
    }
  }, [flow.rejection, t]);

  const registerPicker = useCallback((open: () => void) => {
    pickRef.current = open;
  }, []);

  const openPicker = useCallback(() => {
    pickRef.current?.();
  }, []);

  const heading = (titleKey: 'title' | 'results.title' | 'analyzing.title', backSelf: boolean) => (
    <ImageSearchHeading
      headingId={HEADING_ID}
      backHref={backSelf ? paths.searchImage : paths.market}
      backLabel={backSelf ? t('back.self') : t('back.market')}
      title={t(titleKey)}
      aiLabel={t('ai')}
      subtitle={titleKey === 'analyzing.title' ? t('analyzing.subtitle') : t('subtitle')}
    />
  );

  /* ---------------------------------------------------------------- mocks off */

  if (MOCKS_OFF) {
    return (
      <div className="flex w-full flex-col gap-8 pb-12 pt-2">
        {heading('title', false)}
        <DemoBanner module={t('title')} body={t('demo.body')} />
        <ErrorState
          title={t('mockOff.title')}
          message={t('mockOff.body')}
          secondaryAction={
            <StateButton variant="soft" href={paths.search}>
              {t('textSearch')}
            </StateButton>
          }
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------ capture */

  const captureScreen = (
    <>
      {heading('title', false)}
      <DemoBanner module={t('title')} body={t('demo.body')} />
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <CaptureDropZone
          title={t('drop.title')}
          hint={t('drop.hint')}
          dropActiveLabel={t('drop.active')}
          pickLabel={t('action.pick')}
          cameraLabel={t('action.camera')}
          busy={flow.preparing}
          error={rejectionMessage}
          onCamera={cameraSupported ? () => setCameraOpen(true) : undefined}
          onFile={flow.submitFile}
          onRegisterPicker={registerPicker}
        />
        <div className="flex w-full shrink-0 flex-col items-start gap-5 lg:w-[380px]">
          <TipsCard
            title={t('tips.title')}
            tips={[
              { id: 'light', icon: Sun, label: t('tips.light') },
              { id: 'single', icon: Sparkles, label: t('tips.single') },
              { id: 'label', icon: Tag, label: t('tips.label') },
            ]}
          />
          <TextSearchLink label={t('textSearch')} />
        </div>
      </div>
    </>
  );

  /* ---------------------------------------------------------------- analyzing */

  const recognizeState: StepState = flow.stage === 'analyzing' ? 'running' : 'done';
  const searchState: StepState = flow.stage === 'analyzing' ? 'waiting' : 'running';

  const analyzingScreen = (
    <>
      {heading('analyzing.title', true)}
      <DemoBanner module={t('title')} body={t('demo.body')} />
      <AnalyzingPanel
        photoUrl={flow.frame?.objectUrl ?? null}
        photoAlt={t('analyzing.photoAlt')}
        heading={t('analyzing.heading')}
        busyLabel={t('analyzing.title')}
        recognize={{
          title: t('analyzing.recognizeTitle'),
          body:
            recognizeState === 'done'
              ? t('analyzing.recognizeDone')
              : t('analyzing.recognizeRunning'),
          state: recognizeState,
        }}
        search={{
          title: t('analyzing.searchTitle'),
          body:
            searchState === 'running'
              ? t('analyzing.searchRunning')
              : t('analyzing.searchWaiting'),
          state: searchState,
        }}
        cancelLabel={t('action.cancel')}
        onCancel={flow.reset}
      />
    </>
  );

  /* ------------------------------------------------- the recognised-card block */

  const activeQuery = flow.activeQuery ?? '';
  const confidencePercent =
    flow.activeConfidence === null
      ? null
      : Math.round(Math.min(1, Math.max(0, flow.activeConfidence)) * 100);

  const recognizedCard = (
    <RecognizedCard
      photoUrl={flow.frame?.objectUrl ?? null}
      photoAlt={t('recognized.photoAlt')}
      aiLabel={t('recognized.label')}
      customLabel={flow.customQuery ? t('recognized.custom') : null}
      confidenceLabel={
        confidencePercent === null ? null : t('recognized.confidence', { percent: confidencePercent })
      }
      query={activeQuery}
      labels={flow.labels}
      activeQuery={flow.activeQuery}
      chipsLabel={t('recognized.chipsLabel')}
      formatChip={(label) => t('recognized.chip', { name: label.name, percent: labelPercent(label) })}
      onSelectLabel={flow.selectLabel}
      editLabel={t('action.edit')}
      onEdit={flow.openEdit}
      retakeLabel={t('action.retake')}
      onRetake={flow.reset}
    />
  );

  /* ------------------------------------------------------------------ results */

  // Under `?preview=results` the grid is seeded so a reviewer sees a filled screen without the API.
  const previewRows: ProductRow[] = flow.previewing ? previewImageProducts() : [];
  const rows = flow.previewing ? previewRows : flow.products.items;
  const total = flow.previewing ? previewRows.length : flow.products.total;

  const resultsScreen = (
    <>
      {heading('results.title', true)}
      <DemoBanner module={t('title')} body={t('demo.body')} />
      {recognizedCard}
      <div className="flex w-full flex-row flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-h3 font-extrabold text-ink">
          {t('results.count', { count: total })}
        </h2>
        <p className="m-0 text-label text-ink3">{t('results.scope')}</p>
      </div>
      <ImageProductGrid
        products={rows}
        hasMore={!flow.previewing && flow.products.hasMore}
        onLoadMore={flow.products.loadMore}
        error={flow.products.isError ? flow.products.error : undefined}
        errorMessage={flow.products.error ? failureMessage(flow.products.error) : undefined}
        retryLabel={t('action.retry')}
        loadingLabel={t('loading')}
        onRetry={flow.products.refetch}
      />
    </>
  );

  const resultsLoadingScreen = (
    <>
      {heading('results.title', true)}
      <DemoBanner module={t('title')} body={t('demo.body')} />
      <ImageSearchResultsSkeleton
        label={t('loading')}
        photoUrl={flow.frame?.objectUrl ?? null}
        photoAlt={t('recognized.photoAlt')}
        aiLabel={t('recognized.label')}
      />
    </>
  );

  const noProductsScreen = (
    <>
      {heading('results.title', true)}
      <DemoBanner module={t('title')} body={t('demo.body')} />
      <section className="flex w-full flex-col items-start gap-5 rounded-xl bg-surface p-5 md:flex-row md:items-center md:gap-6">
        <div className="size-[100px] shrink-0 overflow-hidden rounded-lg bg-surface2">
          {flow.frame ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flow.frame.objectUrl}
              alt={t('recognized.photoAlt')}
              className="size-full object-cover"
              draggable={false}
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-caption font-extrabold text-violet">
            {confidencePercent === null
              ? (flow.customQuery ? t('recognized.custom') : t('recognized.label'))
              : t('recognized.summary', { percent: confidencePercent })}
          </span>
          <p className="m-0 text-h3 font-extrabold text-ink">{activeQuery}</p>
        </div>
      </section>
      <EmptyState
        panel
        tone="muted"
        icon={Search}
        titleAs="h2"
        title={t('noProducts.title')}
        body={t('noProducts.body', { query: activeQuery })}
        action={
          <StateButton variant="primary" onClick={flow.openEdit}>
            {t('action.editQuery')}
          </StateButton>
        }
        secondaryAction={
          <StateButton variant="soft" onClick={flow.reset}>
            {t('action.retake')}
          </StateButton>
        }
      />
    </>
  );

  const notRecognizedScreen = (
    <>
      {heading('results.title', true)}
      <DemoBanner module={t('title')} body={t('demo.body')} />
      <EmptyState
        panel
        tone="brand"
        icon={Sparkles}
        titleAs="h2"
        title={t('notRecognized.title')}
        body={t('notRecognized.body')}
        action={
          <StateButton variant="primary" onClick={flow.reset}>
            {t('action.anotherPhoto')}
          </StateButton>
        }
        secondaryAction={
          <StateButton variant="soft" href={paths.search}>
            {t('textSearch')}
          </StateButton>
        }
      >
        <button
          type="button"
          onClick={flow.openEdit}
          className="min-h-11 rounded-sm px-2 text-body-sm font-bold text-brand hover:text-brand-dark"
        >
          {t('action.editQuery')}
        </button>
      </EmptyState>
    </>
  );

  const errorScreen = (
    <>
      {heading('results.title', true)}
      <DemoBanner module={t('title')} body={t('demo.body')} />
      <ErrorState
        title={t('error.title')}
        message={t('error.body')}
        onRetry={flow.retry}
        retryLabel={t('action.retry')}
        secondaryAction={
          <StateButton variant="soft" onClick={flow.reset}>
            {t('action.anotherPhoto')}
          </StateButton>
        }
      />
    </>
  );

  const body = (() => {
    switch (flow.stage) {
      case 'analyzing':
        return analyzingScreen;
      case 'resultsLoading':
        return resultsLoadingScreen;
      case 'results':
        return resultsScreen;
      case 'noProducts':
        return noProductsScreen;
      case 'notRecognized':
        return notRecognizedScreen;
      case 'error':
        return errorScreen;
      default:
        return captureScreen;
    }
  })();

  return (
    <div className="flex w-full flex-col gap-8 pb-12 pt-2">
      {body}

      <EditQueryDialog
        open={flow.editOpen}
        onOpenChange={(open) => (open ? flow.openEdit() : flow.closeEdit())}
        title={t('dialog.title')}
        hint={t('dialog.hint')}
        label={t('dialog.label')}
        placeholder={t('dialog.placeholder')}
        closeLabel={t('action.close')}
        cancelLabel={t('action.cancel')}
        searchLabel={t('action.search')}
        initialQuery={activeQuery}
        onSubmit={flow.applyCustomQuery}
      />

      <CameraSheet
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        title={t('camera.title')}
        closeLabel={t('action.close')}
        onCapture={flow.submitFile}
        onPickFile={openPicker}
        labels={{
          starting: t('camera.starting'),
          shoot: t('camera.shoot'),
          cancel: t('action.cancel'),
          deniedTitle: t('camera.denied.title'),
          deniedBody: t('camera.denied.body'),
          unavailableTitle: t('camera.unavailable.title'),
          unavailableBody: t('camera.unavailable.body'),
          pickInstead: t('action.pick'),
          videoLabel: t('camera.title'),
        }}
      />
    </div>
  );
}
