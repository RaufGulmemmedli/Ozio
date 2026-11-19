'use client';

/**
 * The receipt scanner.
 *
 * **The captured image never leaves the browser.** The flow is:
 *
 *  1. a `File` arrives from `<input type="file" accept="image/*" capture="environment">`, or a
 *     frame is grabbed from a `getUserMedia` preview;
 *  2. `downscaleImage()` draws it into a `<canvas>` at most `MAX_EDGE` px on its long side and
 *     exports a JPEG blob — so even the request body is a reduced copy, never the original photo;
 *  3. the blob goes to `/api/mock/viral/receipts/scan`, which **MSW answers inside the page's own
 *     service worker**. There is no network hop, and `remote.mock()` cannot address the real host.
 *  4. every object URL this hook creates is revoked, including on unmount.
 *
 * `POST v1/file/upload` is deliberately not involved: `api/README.md` says it is a plain file
 * store, not a recognition endpoint, so sending a receipt there would upload a user's shopping to
 * a bucket for nothing.
 */
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { useLocaleKey } from '@/core/query';

import { viralRepository, type ScanReceiptBody } from '../data/viral.repository';
import type { ReceiptCartResult, ScannedReceipt } from '../data/models/receipt';

/** The long edge the capture is reduced to before it is handed over. */
export const MAX_EDGE = 1280;
/** JPEG quality for the downscaled copy. */
const JPEG_QUALITY = 0.82;

export interface DownscaledImage extends ScanReceiptBody {
  /** An object URL for the preview thumbnail. The caller must not revoke it; this hook does. */
  previewUrl: string;
}

/**
 * Draws a `Blob`/`File` into a canvas at most `MAX_EDGE` on its long side and returns a JPEG copy.
 *
 * `createImageBitmap` is used where available (it decodes off the main thread); the `<img>` path is
 * the fallback. Either way the decode happens in this page and the pixels go nowhere else.
 */
export async function downscaleImage(source: Blob): Promise<DownscaledImage> {
  const bitmap = await loadBitmap(source);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (result) => resolve(result ?? new Blob([], { type: 'image/jpeg' })),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });

  return { blob, width, height, previewUrl: URL.createObjectURL(blob) };
}

type Decoded = ImageBitmap | HTMLImageElement;

async function loadBitmap(source: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(source);
    } catch {
      // Some browsers refuse exotic formats here; fall through to the <img> decode.
    }
  }
  const url = URL.createObjectURL(source);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    // The decoded bitmap no longer needs the URL.
    URL.revokeObjectURL(url);
  }
}

export interface UseReceiptScan {
  /** The downscaled capture, or `null` before anything is picked. */
  capture: DownscaledImage | null;
  /** Downscales a picked file and keeps it as the current capture. */
  take: (file: Blob) => Promise<DownscaledImage | null>;
  /** Drops the capture and revokes its object URL. */
  clear: () => void;
  /** `true` while the canvas work is running. */
  preparing: boolean;
  /** Set when the file could not be decoded at all (not a server failure). */
  decodeFailed: boolean;
  scan: UseMutationResult<ScannedReceipt, Failure, ScanReceiptBody>;
}

export function useReceiptScan(): UseReceiptScan {
  const locale = useLocaleKey();

  const [capture, setCapture] = useState<DownscaledImage | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [decodeFailed, setDecodeFailed] = useState(false);

  // Every URL this hook hands out, so unmount can revoke all of them.
  const urls = useRef<Set<string>>(new Set());

  useEffect(
    () => () => {
      for (const url of urls.current) URL.revokeObjectURL(url);
      urls.current.clear();
    },
    [],
  );

  const clear = useCallback(() => {
    setCapture((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous.previewUrl);
        urls.current.delete(previous.previewUrl);
      }
      return null;
    });
    setDecodeFailed(false);
  }, []);

  const take = useCallback(
    async (file: Blob): Promise<DownscaledImage | null> => {
      setPreparing(true);
      setDecodeFailed(false);
      try {
        const next = await downscaleImage(file);
        urls.current.add(next.previewUrl);
        setCapture((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous.previewUrl);
            urls.current.delete(previous.previewUrl);
          }
          return next;
        });
        return next;
      } catch {
        setDecodeFailed(true);
        return null;
      } finally {
        setPreparing(false);
      }
    },
    [],
  );

  const scan = useMutation<ScannedReceipt, Failure, ScanReceiptBody>({
    mutationFn: (body) => unwrap(viralRepository.scanReceipt(body, locale)),
  });

  return { capture, take, clear, preparing, decodeFailed, scan };
}

/** "Səbətə at" — the mock answers with what would go in the cart. **Nothing is ordered.** */
export function useAddReceiptToCart(): UseMutationResult<ReceiptCartResult, Failure, void> {
  const locale = useLocaleKey();

  return useMutation<ReceiptCartResult, Failure, void>({
    mutationFn: () => unwrap(viralRepository.addReceiptToCart(locale)),
  });
}
