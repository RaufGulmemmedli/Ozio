'use client';

/**
 * The captured frame — **client-side only, for the lifetime of the page**.
 *
 * Contract this file exists to keep:
 *  - the picked / shot image is held as a `Blob` plus an `objectURL` and is **never uploaded**;
 *  - `POST v1/file/upload` is a plain upload, not a recogniser, so it is never called;
 *  - the frame is downscaled in a `<canvas>` before anything is handed to the recognition mock, and
 *    only its **metadata** (bytes, width, height, mime type) is sent;
 *  - every `objectURL` is released through `releaseFrame()`, which the view calls on unmount and
 *    whenever a new frame replaces an old one;
 *  - nothing is written to `localStorage`, `IndexedDB` or a cookie, so the image cannot outlive the
 *    session.
 */
import {
  ACCEPTED_IMAGE_TYPES,
  DOWNSCALE_MAX_EDGE,
  MAX_IMAGE_BYTES,
} from './image_search.fixtures';

export type FrameRejection = 'tooLarge' | 'wrongType' | 'unreadable';

export interface CapturedFrame {
  /** The downscaled frame. Kept in memory only. */
  blob: Blob;
  /** `URL.createObjectURL(blob)` — released by `releaseFrame`. */
  objectUrl: string;
  width: number;
  height: number;
  byteSize: number;
  mimeType: string;
}

export type FrameResult =
  | { ok: true; frame: CapturedFrame }
  | { ok: false; reason: FrameRejection };

const isAcceptedType = (type: string): boolean =>
  (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);

/** `accept` for the file input, from the same single list the validation uses. */
export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(',');

function fitWithin(width: number, height: number, maxEdge: number): { w: number; h: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge || longest === 0) return { w: width, h: height };
  const scale = maxEdge / longest;
  return { w: Math.max(1, Math.round(width * scale)), h: Math.max(1, Math.round(height * scale)) };
}

/** `createImageBitmap` where it exists, an `<img>` + object URL everywhere else. */
async function decode(blob: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    };
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode failed'));
      el.src = url;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });
}

/**
 * Validates and downscales one picked / shot image.
 *
 * The 10 MB cap is checked on the **source** (screen spec §2), the longest edge is capped at
 * `DOWNSCALE_MAX_EDGE`, and the result is re-encoded as JPEG so a 12-megapixel phone shot does not
 * sit in memory at full size. Returns a rejection reason instead of throwing.
 */
export async function prepareFrame(file: Blob): Promise<FrameResult> {
  if (file.size <= 0) return { ok: false, reason: 'unreadable' };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: 'tooLarge' };
  if (file.type && !isAcceptedType(file.type)) return { ok: false, reason: 'wrongType' };

  let decoded: Awaited<ReturnType<typeof decode>> | null = null;
  try {
    decoded = await decode(file);
    const { w, h } = fitWithin(decoded.width, decoded.height, DOWNSCALE_MAX_EDGE);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, reason: 'unreadable' };
    ctx.drawImage(decoded.source, 0, 0, w, h);

    const mimeType = 'image/jpeg';
    const blob = (await toBlob(canvas, mimeType, 0.82)) ?? file;
    // The canvas itself is dropped with this scope; only the small blob survives.
    canvas.width = 0;
    canvas.height = 0;

    return {
      ok: true,
      frame: {
        blob,
        objectUrl: URL.createObjectURL(blob),
        width: w,
        height: h,
        byteSize: blob.size,
        mimeType,
      },
    };
  } catch {
    return { ok: false, reason: 'unreadable' };
  } finally {
    decoded?.release();
  }
}

/** Releases the object URL. Safe to call twice and with `null`. */
export function releaseFrame(frame: CapturedFrame | null | undefined): void {
  if (!frame) return;
  try {
    URL.revokeObjectURL(frame.objectUrl);
  } catch {
    // already revoked / no URL support — nothing to clean up
  }
}
