import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

import { locales } from '@/core/i18n';

/**
 * The per-locale OG card for every `(marketing)` route (02-routing.md: "OG image
 * per locale"). Generated with `ImageResponse` rather than shipping PNGs, so the
 * three language variants stay in sync with the `meta.*` copy automatically.
 *
 * Satori renders this, and it cannot read CSS variables or load the self-hosted
 * font file through `@font-face`, so:
 *   · the five colours below are copied from `src/app/globals.css` with the token
 *     each one mirrors named next to it — the one place in this module where a
 *     hex literal is correct, exactly as `src/app/icon.tsx` already does;
 *   · the logo's pinwheel "plus" mark is rebuilt from rounded bars, because
 *     Satori supports only flexbox and a CSS subset, not `<svg>` paths from
 *     `public/logo.svg`;
 *   · type falls back to the system sans Satori bundles. Loading Geologica here
 *     would mean reading `public/fonts/Geologica.ttf` per request at the edge for
 *     an image no human reads at full size.
 *
 * `generateImageMetadata` is not needed: one image per locale segment is what the
 * route already produces, since `[locale]` is part of the path.
 */

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Ozio';

/** Prerendered next to the pages, one per locale. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const BG = '#F4F1EC'; // --oz-bg
const INK = '#111111'; // --oz-ink
const INK2 = '#5C5852'; // --oz-ink-2
const BRAND = '#EE3768'; // --oz-brand
const YELLOW = '#FFD43B'; // --oz-yellow
const WHITE = '#FFFFFF';

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: 'meta' });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BG,
          padding: 72,
        }}
      >
        {/* brand mark + wordmark stand-in */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              position: 'relative',
              width: 64,
              height: 64,
              borderRadius: 999,
              background: BRAND,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 29,
                top: 18,
                width: 6,
                height: 28,
                borderRadius: 3,
                background: WHITE,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 18,
                top: 29,
                width: 28,
                height: 6,
                borderRadius: 3,
                background: WHITE,
              }}
            />
          </div>
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 800, color: INK }}>ozio</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 40,
              padding: '0 18px',
              borderRadius: 999,
              background: YELLOW,
              color: INK,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {meta('home.title').split('—')[0]?.trim() ?? 'Ozio'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 940 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -2,
              color: INK,
            }}
          >
            {meta('home.title')}
          </div>
          <div style={{ display: 'flex', fontSize: 28, lineHeight: 1.4, color: INK2 }}>
            {meta('home.description').slice(0, 150)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', width: 220, height: 10, borderRadius: 999, background: BRAND }} />
          <div style={{ display: 'flex', width: 90, height: 10, borderRadius: 999, background: YELLOW }} />
          <div style={{ display: 'flex', width: 48, height: 10, borderRadius: 999, background: INK }} />
        </div>
      </div>
    ),
    size,
  );
}
