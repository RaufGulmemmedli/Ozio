import type { ReactNode } from "react";

/**
 * Root layout — intentionally a pass-through.
 *
 * Every route lives under `src/app/[locale]/`, and `<html lang={locale}>` has to
 * carry the active locale, so the document shell (html/body, fonts, ThemeScript,
 * providers) is rendered by `src/app/[locale]/layout.tsx` instead. This file only
 * exists so that `app/` has a root layout above the metadata routes
 * (`sitemap.ts`, `robots.ts`, `manifest.ts`, `icon.tsx`) — it must NOT render
 * `<html>`/`<body>` itself, or they would be emitted twice.
 *
 * `globals.css` is imported by `[locale]/layout.tsx` (and once more by
 * `global-error.tsx`, which replaces this layout entirely).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
