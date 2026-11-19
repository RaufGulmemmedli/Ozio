import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/core/i18n/request.ts");

/** Hosts allowed for next/image. Set NEXT_PUBLIC_IMAGE_HOSTS=a.com,b.com to extend. */
const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "api.ozio10.az,cdn.ozio10.az")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // `cacheComponents` (Next 16 default from create-next-app) rejects the
  // `dynamic`/`runtime` route-segment config that the BFF proxy and the auth
  // route handlers require, and it forces every dynamic read (cookies, headers,
  // searchParams) under an explicit Suspense/`use cache` boundary. This app is a
  // client-heavy, cookie-authenticated shell, so it is off on purpose.
  // Re-enabling it is a separate, deliberate migration.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      // Scoped to the ONE global stylesheet on purpose.
      //
      // create-next-app generates this rule as `"*.css"`, which also captures
      // `*.module.css`: the Tailwind loader returns plain CSS, so Turbopack
      // never builds the CSS-module class map, the module's default export comes
      // back EMPTY and every `styles.foo` renders as no class at all — silently.
      // That took out `src/shared/ui/ui.module.css`, which positions every
      // modal, drawer, sheet, scrim, toast, snackbar, menu and tooltip plus the
      // responsive <Grid>, and `src/modules/senior/senior.module.css`, i.e. the
      // whole senior-mode type scale. Keep this key pointing at globals.css.
      "./src/app/globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    // Flutter used singular /order/...; keep one noun on the web (02-routing.md).
    return [
      { source: "/order/:path*", destination: "/orders/:path*", permanent: true },
      { source: "/address/:path*", destination: "/addresses/:path*", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
