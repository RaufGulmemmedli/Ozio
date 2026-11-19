import { ImageResponse } from "next/og";

/**
 * Favicon: the logo's "plus" mark in white on a brand circle.
 *
 * `#EE3768` mirrors `--oz-brand` from `src/app/globals.css` — an ImageResponse is
 * rendered by Satori and cannot read CSS variables. Satori only supports flexbox
 * and a subset of CSS, so the pinwheel plus of `public/logo.svg` is rebuilt from
 * two rounded bars rather than its 4 paths.
 */

const BRAND = "#EE3768"; // --oz-brand
const WHITE = "#FFFFFF";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND,
          borderRadius: "50%",
        }}
      >
        <div style={{ display: "flex", position: "relative", width: 20, height: 20 }}>
          <div
            style={{
              position: "absolute",
              left: 7,
              top: 0,
              width: 6,
              height: 20,
              borderRadius: 3,
              background: WHITE,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 7,
              width: 20,
              height: 6,
              borderRadius: 3,
              background: WHITE,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
