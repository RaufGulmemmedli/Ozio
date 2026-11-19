/**
 * Public surface of the photo-search module. Other modules import from **here only**.
 *
 * The entry point other agents place:
 *   `import { CameraSearchButton } from '@/modules/image_search';`
 * M4 renders it in the `/search` field's trailing slot; it hides itself when `imageSearch` is off.
 */

/* ---- entry point other modules place ----------------------------------------------------- */
export { CameraSearchButton } from './components/CameraSearchButton';
export type { CameraSearchButtonProps } from './components/CameraSearchButton';

/* ---- views (route-level) ----------------------------------------------------------------- */
export { ImageSearchView } from './view/ImageSearchView';
export { ImageSearchResultsSkeleton } from './view/ImageSearchResultsSkeleton';
export type { ImageSearchResultsSkeletonProps } from './view/ImageSearchResultsSkeleton';

/* ---- hooks ------------------------------------------------------------------------------- */
export { useImageSearchFlow, IMAGE_SEARCH_PREVIEWS } from './hooks/use-image-search-flow';
export type { ImageSearchStage, UseImageSearchFlowResult } from './hooks/use-image-search-flow';

export { useImageProducts } from './hooks/use-image-products';
export type { UseImageProductsArgs, UseImageProductsResult } from './hooks/use-image-products';

export { useRecognition } from './hooks/use-recognition';
export type { RecognizeInput, UseRecognitionResult } from './hooks/use-recognition';

export { useCapturedFrame } from './hooks/use-captured-frame';
export type { UseCapturedFrameResult } from './hooks/use-captured-frame';

/* ---- data ------------------------------------------------------------------------------- */
export { imageSearchRepository } from './data/image_search.repository';
export { parseImageRecognition, labelPercent, topLabel } from './data/models/recognition';
export type { ImageRecognition, RecognizedLabel } from './data/models/recognition';

export { prepareFrame, releaseFrame, ACCEPT_ATTRIBUTE } from './data/image-frame';
export type { CapturedFrame, FrameRejection, FrameResult } from './data/image-frame';

export { MAX_IMAGE_BYTES, RECOGNIZE_LATENCY_MS } from './data/image_search.fixtures';

export { imageSearchKeys } from './image_search.query-keys';
export { imageSearchRoutes } from './image_search.routes';
export type { ImageSearchRoute } from './image_search.routes';
export {
  IMAGE_SEARCH_FLAG,
  IMAGE_SEARCH_MOCK_MODULE,
  imageSearchEnabled,
} from './image_search.flags';
