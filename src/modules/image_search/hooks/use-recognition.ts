'use client';

/**
 * The MOCK step: `POST /api/mock/image_search/recognize`.
 *
 * A mutation, not a query — it is an action on a frame the user just captured, it must not be
 * cached, and it must not be retried behind the user's back.
 */
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { unwrap, type Failure } from '@/core/network';

import { imageSearchRepository } from '../data/image_search.repository';
import type { CapturedFrame } from '../data/image-frame';
import type { ImageRecognition } from '../data/models/recognition';
import { imageSearchKeys } from '../image_search.query-keys';

export interface RecognizeInput {
  frame: CapturedFrame;
  /** Demo switch so "not recognised" and "analysis failed" are reachable from the UI. */
  outcome?: 'none' | 'error';
}

export type UseRecognitionResult = UseMutationResult<ImageRecognition, Failure, RecognizeInput>;

export function useRecognition(): UseRecognitionResult {
  const locale = useLocale();

  return useMutation<ImageRecognition, Failure, RecognizeInput>({
    mutationKey: imageSearchKeys.recognize(),
    retry: false,
    mutationFn: ({ frame, outcome }) =>
      unwrap(
        imageSearchRepository.recognize({
          // Metadata only — the frame's bytes never leave the page.
          byteSize: frame.byteSize,
          width: frame.width,
          height: frame.height,
          mimeType: frame.mimeType,
          locale,
          outcome,
        }),
      ),
  });
}
