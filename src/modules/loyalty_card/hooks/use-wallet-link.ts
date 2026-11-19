'use client';

/**
 * `useWalletLink()` — the two "add to wallet" buttons (KT3).
 *
 * **Google Wallet** is real: `GET v1/wallet/google` (verified) answers a bare
 * `{ url }` with no envelope. The url is a `pay.google.com` save link carrying
 * a signed JWT, so it is opened externally in a new tab and **never logged**,
 * never put in a query string and never kept in the query cache.
 * The `POST` variant is unverified and not needed.
 *
 * **Apple Wallet** has no endpoint at all. Rather than fake a `.pkpass`, the
 * button is shown only on Apple platforms and points at the mobile app
 * (`/#download`), which is where the pass is actually issued.
 *
 * Platform detection happens after mount, so the server render and the first
 * client render agree.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { useMutation } from '@tanstack/react-query';

import type { Failure } from '@/core/network';
import { unwrap } from '@/core/network';

import { loyaltyCardRepository } from '../data/loyalty_card.repository';

export interface WalletPlatform {
  /** Android or iOS — where a Google Wallet save link can actually be saved. */
  isMobile: boolean;
  /** iOS / iPadOS / macOS — where an Apple Wallet pass would be usable. */
  isApple: boolean;
}

const UNKNOWN_PLATFORM: WalletPlatform = { isMobile: false, isApple: false };

function detectPlatform(): WalletPlatform {
  if (typeof navigator === 'undefined') return UNKNOWN_PLATFORM;
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  // iPadOS 13+ reports as a Mac with a touch screen.
  const isIpadOs =
    /Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1;
  return {
    isMobile: isIos || isAndroid || isIpadOs,
    isApple: isIos || isIpadOs || /Mac OS X|Macintosh/i.test(ua),
  };
}

/* The platform never changes while the tab is open, so the snapshot is computed
 * once and handed back by reference. `useSyncExternalStore` with a `null`-ish
 * server snapshot is what keeps SSR and the hydrating render identical without
 * a `setState` in an effect. */
let platformSnapshot: WalletPlatform | null = null;

const getPlatform = (): WalletPlatform => {
  platformSnapshot ??= detectPlatform();
  return platformSnapshot;
};

/** The server renders neither button; they appear on the first client commit. */
const getServerPlatform = (): WalletPlatform => UNKNOWN_PLATFORM;

/** The value never changes, so nothing ever has to be notified. */
const subscribePlatform = (): (() => void) => () => undefined;

export interface UseWalletLinkResult {
  /** Render the Google Wallet button. */
  canGoogle: boolean;
  /** Render the Apple Wallet button. */
  canApple: boolean;
  /** Where the Apple button goes — the mobile app, never a fabricated pass. */
  appleHref: string;
  /** Fetches the save link and opens it in a new tab. */
  openGoogleWallet: () => void;
  isPending: boolean;
  error: Failure | null;
  reset: () => void;
}

/** The app-download anchor the sidebar promo card also uses. */
export const APP_DOWNLOAD_HREF = '/#download';

export function useWalletLink(): UseWalletLinkResult {
  const platform = useSyncExternalStore(subscribePlatform, getPlatform, getServerPlatform);

  const mutation = useMutation<string, Failure, void>({
    mutationKey: ['loyalty_card', 'wallet', 'google'],
    mutationFn: () => unwrap(loyaltyCardRepository.googleWalletUrl()),
    retry: false,
    onSuccess: (url) => {
      // Opened, never logged: the url carries a signed JWT for this account.
      if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
    },
  });

  const openGoogleWallet = useCallback(() => {
    mutation.mutate();
  }, [mutation]);

  return {
    canGoogle: platform.isMobile,
    canApple: platform.isApple,
    appleHref: APP_DOWNLOAD_HREF,
    openGoogleWallet,
    isPending: mutation.isPending,
    error: mutation.error ?? null,
    reset: mutation.reset,
  };
}
