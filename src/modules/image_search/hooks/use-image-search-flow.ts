'use client';

/**
 * The screen's state machine (screens spec §2: `source -> analyzing -> results | noProducts |
 * nothing | error`), plus the `?preview=` overrides so every state is reachable from the URL.
 *
 * Who owns what:
 *  - the frame           → `useCapturedFrame` (browser only, released on unmount)
 *  - the labels          → `useRecognition`   (MOCK, `/api/mock/image_search/recognize`)
 *  - the products        → `useImageProducts` (REAL, `stores/search` + `stores/{id}/products`)
 */
import { useCallback, useMemo, useState } from 'react';
import { usePreview } from '@/core/query';

import type { CapturedFrame, FrameRejection } from '../data/image-frame';
import { labelPercent, type ImageRecognition, type RecognizedLabel } from '../data/models/recognition';
import { useCapturedFrame } from './use-captured-frame';
import { useImageProducts, type UseImageProductsResult } from './use-image-products';
import { useRecognition } from './use-recognition';

/** Every screen state in the spec, in the order they occur. */
export type ImageSearchStage =
  | 'source'
  | 'analyzing'
  | 'results'
  | 'resultsLoading'
  | 'noProducts'
  | 'notRecognized'
  | 'error';

/** `?preview=` values this screen understands, on top of the global ones. */
export const IMAGE_SEARCH_PREVIEWS = [
  'source',
  'analyzing',
  'results',
  'loading',
  'empty',
  'not-recognized',
  'error',
] as const;

export interface UseImageSearchFlowResult {
  stage: ImageSearchStage;
  /** `true` when the stage comes from `?preview=`, so the view knows to use seed data. */
  previewing: boolean;
  frame: CapturedFrame | null;
  rejection: FrameRejection | null;
  preparing: boolean;
  recognition: ImageRecognition | null;
  labels: RecognizedLabel[];
  /** The label the grid is currently searched with, or the hand-edited query. */
  activeQuery: string | null;
  /** Confidence of `activeQuery` when it came from a label, else `null`. */
  activeConfidence: number | null;
  /** `true` once the user typed their own query (the chip row then shows it as custom). */
  customQuery: boolean;
  products: UseImageProductsResult;
  editOpen: boolean;

  /** Start over from the capture screen (also releases the frame). */
  reset: () => void;
  /** Keep the frame, run recognition again. */
  retry: () => void;
  /** Validate + downscale + recognise one picked or shot image. */
  submitFile: (file: Blob) => void;
  /** Re-search with another recognised label. */
  selectLabel: (label: RecognizedLabel) => void;
  /** Re-search with a hand-typed query (the "Sorğunu düzəlt" dialog). */
  applyCustomQuery: (query: string) => void;
  openEdit: () => void;
  closeEdit: () => void;
}

/** Seeds used only under `?preview=`, so a reviewer sees a filled screen. */
const PREVIEW_LABELS: RecognizedLabel[] = [
  { name: 'Qırmızı alma', confidence: 0.92 },
  { name: 'Alma', confidence: 0.81 },
  { name: 'Meyvə', confidence: 0.64 },
];

export function useImageSearchFlow(): UseImageSearchFlowResult {
  const preview = usePreview();
  const capture = useCapturedFrame();
  const recognize = useRecognition();

  const [recognition, setRecognition] = useState<ImageRecognition | null>(null);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [activeConfidence, setActiveConfidence] = useState<number | null>(null);
  const [customQuery, setCustomQuery] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const previewStage: ImageSearchStage | null = useMemo(() => {
    switch (preview) {
      case 'source':
        return 'source';
      case 'analyzing':
        return 'analyzing';
      case 'results':
        return 'results';
      case 'loading':
        return 'resultsLoading';
      case 'empty':
        return 'noProducts';
      case 'not-recognized':
        return 'notRecognized';
      case 'error':
        return 'error';
      default:
        return null;
    }
  }, [preview]);

  const previewing = previewStage !== null;

  const seededLabels = previewing ? PREVIEW_LABELS : (recognition?.labels ?? []);
  const seededQuery = previewing ? (activeQuery ?? PREVIEW_LABELS[0].name) : activeQuery;
  const seededConfidence = previewing
    ? (activeConfidence ?? labelPercent(PREVIEW_LABELS[0]) / 100)
    : activeConfidence;

  const products = useImageProducts({
    query: seededQuery,
    // Under `?preview=` the grid is seeded by the view, so no request is fired.
    enabled: !previewing && recognition !== null && (recognition.labels.length > 0 || customQuery),
  });

  const liveStage: ImageSearchStage = useMemo(() => {
    if (recognize.isError) return 'error';
    if (recognize.isPending || capture.preparing) return 'analyzing';
    if (recognition === null) return 'source';
    if (recognition.labels.length === 0 && !customQuery) return 'notRecognized';
    if (products.isPending) return 'resultsLoading';
    if (products.isEmpty) return 'noProducts';
    return 'results';
  }, [
    recognize.isError,
    recognize.isPending,
    capture.preparing,
    recognition,
    customQuery,
    products.isPending,
    products.isEmpty,
  ]);

  const stage = previewStage ?? liveStage;

  const runRecognition = useCallback(
    (frame: CapturedFrame) => {
      recognize.mutate(
        { frame },
        {
          onSuccess: (result) => {
            setRecognition(result);
            setCustomQuery(false);
            const first = result.labels[0] ?? null;
            setActiveQuery(first?.name ?? null);
            setActiveConfidence(first?.confidence ?? null);
          },
          onError: () => {
            setRecognition(null);
            setActiveQuery(null);
            setActiveConfidence(null);
          },
        },
      );
    },
    [recognize],
  );

  const submitFile = useCallback(
    (file: Blob) => {
      setRecognition(null);
      setActiveQuery(null);
      setActiveConfidence(null);
      setCustomQuery(false);
      recognize.reset();
      void capture.accept(file).then((frame) => {
        if (!frame) {
          // A refused file keeps the capture screen up; `capture.rejection` says why.
          return;
        }
        runRecognition(frame);
      });
    },
    [capture, recognize, runRecognition],
  );

  const retry = useCallback(() => {
    if (!capture.frame) {
      recognize.reset();
      return;
    }
    runRecognition(capture.frame);
  }, [capture.frame, recognize, runRecognition]);

  const reset = useCallback(() => {
    capture.clear();
    recognize.reset();
    setRecognition(null);
    setActiveQuery(null);
    setActiveConfidence(null);
    setCustomQuery(false);
    setEditOpen(false);
  }, [capture, recognize]);

  const selectLabel = useCallback((label: RecognizedLabel) => {
    setActiveQuery(label.name);
    setActiveConfidence(label.confidence);
    setCustomQuery(false);
  }, []);

  const applyCustomQuery = useCallback((query: string) => {
    const value = query.trim();
    if (!value) return;
    setActiveQuery(value);
    setActiveConfidence(null);
    setCustomQuery(true);
    setEditOpen(false);
    // A hand-typed query is a valid search even when the recogniser found nothing.
    setRecognition((prev) => prev ?? { labels: [] });
  }, []);

  return {
    stage,
    previewing,
    frame: capture.frame,
    rejection: capture.rejection,
    preparing: capture.preparing,
    recognition: previewing ? { labels: seededLabels } : recognition,
    labels: seededLabels,
    activeQuery: seededQuery,
    activeConfidence: seededConfidence,
    customQuery,
    products,
    editOpen,
    reset,
    retry,
    submitFile,
    selectLabel,
    applyCustomQuery,
    openEdit: () => setEditOpen(true),
    closeEdit: () => setEditOpen(false),
  };
}
