'use client';

/**
 * Store / partner logo tile.
 *
 * assets.md §Imagery: the API image when there is one, otherwise an
 * initial-letter tile — 56x56, radius 18, `brand` fill, 24/800 white.
 */

import NextImage from 'next/image';
import { useState } from 'react';

import { cn } from '@/core/lib/cn';

export interface StoreLogoProps {
  /** API CDN url; null/failed → initial-letter tile. */
  src?: string | null;
  /** Store or partner name — supplies the initial and the accessible name. */
  name: string;
  /** Square side in px. Default 56 (the measured store tile). */
  size?: number;
  /** Corner radius in px. Default 18. */
  radius?: number;
  /** `true` when a sibling already names the store (list rows). */
  decorative?: boolean;
  className?: string;
}

function initialOf(name: string): string {
  const first = [...name.trim()][0] ?? '?';
  return first.toUpperCase();
}

export function StoreLogo({
  src,
  name,
  size = 56,
  radius = 18,
  decorative = false,
  className,
}: StoreLogoProps) {
  const [failed, setFailed] = useState(false);
  const showInitial = !src || failed;

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden',
        showInitial ? 'grid place-items-center bg-brand' : 'bg-surface2',
        className,
      )}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      {showInitial ? (
        <span
          aria-hidden={decorative ? true : undefined}
          className="font-extrabold leading-none text-white"
          style={{ fontSize: Math.round(size * (24 / 56)) }}
        >
          {initialOf(name)}
        </span>
      ) : (
        /*
         * `object-contain`, on a white tile with a little padding — NOT `object-cover`.
         *
         * Every `logo` the catalogue sends is a wordmark on a white field ("bolmart", "MEGASTORE
         * SUPERMARKET", …), several times wider than it is tall. Filling a square with `cover`
         * scaled it until only the middle letters were left, so a row of stores read "olma",
         * "GASTO", "enta". Contained, the whole mark fits and the store is identifiable, which is
         * the only thing this tile is for.
         */
        <NextImage
          src={src}
          alt={decorative ? '' : name}
          fill
          sizes={`${size}px`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="bg-white object-contain p-[8%]"
        />
      )}
      {showInitial && !decorative ? <span className="sr-only">{name}</span> : null}
    </div>
  );
}
