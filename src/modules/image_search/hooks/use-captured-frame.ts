'use client';

/**
 * Holds the one captured frame and guarantees its object URL is released — when it is replaced,
 * when the screen is left, and when the tab is closed.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  prepareFrame,
  releaseFrame,
  type CapturedFrame,
  type FrameRejection,
} from '../data/image-frame';

export interface UseCapturedFrameResult {
  frame: CapturedFrame | null;
  /** Why the last pick was refused, or `null`. Cleared by the next `accept()`. */
  rejection: FrameRejection | null;
  /** `true` while the picked file is being validated / downscaled. */
  preparing: boolean;
  /** Validates + downscales, then stores the frame. Returns it, or `null` when refused. */
  accept: (file: Blob) => Promise<CapturedFrame | null>;
  /** Drops the frame and releases its URL. */
  clear: () => void;
}

export function useCapturedFrame(): UseCapturedFrameResult {
  const [frame, setFrame] = useState<CapturedFrame | null>(null);
  const [rejection, setRejection] = useState<FrameRejection | null>(null);
  const [preparing, setPreparing] = useState(false);

  // A ref so the unmount cleanup sees the latest frame without re-running (and so re-releasing)
  // on every change. Written in an effect, never during render.
  const current = useRef<CapturedFrame | null>(null);

  useEffect(() => {
    current.current = frame;
  }, [frame]);

  useEffect(
    () => () => {
      releaseFrame(current.current);
      current.current = null;
    },
    [],
  );

  const clear = useCallback(() => {
    setFrame((prev) => {
      releaseFrame(prev);
      return null;
    });
    setRejection(null);
  }, []);

  const accept = useCallback(async (file: Blob): Promise<CapturedFrame | null> => {
    setPreparing(true);
    setRejection(null);
    try {
      const result = await prepareFrame(file);
      if (!result.ok) {
        setRejection(result.reason);
        return null;
      }
      setFrame((prev) => {
        releaseFrame(prev);
        return result.frame;
      });
      return result.frame;
    } finally {
      setPreparing(false);
    }
  }, []);

  return { frame, rejection, preparing, accept, clear };
}
