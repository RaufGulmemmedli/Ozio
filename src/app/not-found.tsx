// This 404 renders for paths the locale middleware did not rewrite (so there is
// no `[locale]` segment and therefore no document shell above it). It has to
// bring its own <html>/<body> and stylesheet; the font comes from the @font-face
// in globals.css rather than a second `next/font` instance, so this fallback
// adds no extra preload to the rest of the app.
//
// The localized 404 every visitor actually sees is
// `src/app/[locale]/(marketing)/not-found.tsx`.
import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { defaultLocale } from "@/core/i18n";
import { OzioLogo } from "@/shared/brand";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: defaultLocale, namespace: "meta" });

  return {
    title: t("notFound.title"),
    description: t("notFound.description"),
    robots: { index: false, follow: false },
  };
}

export default async function RootNotFound() {
  const meta = await getTranslations({ locale: defaultLocale, namespace: "meta" });
  const common = await getTranslations({ locale: defaultLocale, namespace: "common" });

  return (
    <html lang={defaultLocale}>
      <body className="min-h-dvh bg-block font-sans text-on-block">
        <main
          id="main"
          className="flex min-h-dvh flex-col items-center justify-center gap-7 px-5 py-24 text-center"
        >
          <OzioLogo size="m" tone="white" />
          <span className="text-display-404 font-extrabold leading-none">404</span>
          <h1 className="text-h1-app font-extrabold">{meta("notFound.title")}</h1>
          <p className="max-w-[520px] text-body-l text-on-block2">
            {meta("notFound.description")}
          </p>
          <Link
            href="/"
            className="flex h-14 items-center justify-center rounded-pill bg-brand px-8 text-body font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            {common("goHome")}
          </Link>
        </main>
      </body>
    </html>
  );
}
