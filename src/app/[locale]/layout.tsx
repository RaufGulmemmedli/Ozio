import "../globals.css";

import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { siteUrl } from "@/core/config";
import { routing } from "@/core/i18n";
import { Providers } from "@/core/query/providers";
import { ThemeScript } from "@/core/theme";

/**
 * Geologica, self-hosted as a variable font (architecture/06-i18n-theming.md).
 * `public/fonts/Geologica.ttf` carries wght 100–900; the design uses 300–800.
 *
 * NOTE: `globals.css` declares an @font-face for the same file. globals.css is
 * frozen, so it is left alone — only <body> below sets a font family, and it uses
 * this copy, so the browser fetches the file once.
 */
const geologica = localFont({
  src: "../../../public/fonts/Geologica.ttf",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: true,
  variable: "--font-geologica",
  fallback: [
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  const shell = await getTranslations({ locale, namespace: "shell" });

  return {
    metadataBase: new URL(siteUrl),
    applicationName: "Ozio",
    title: {
      default: meta("home.title"),
      template: shell("meta.titleTemplate"),
    },
    description: meta("home.description"),
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enables static rendering for every segment below (next-intl 4).
  setRequestLocale(locale);

  // TODO(perf): 06-i18n-theming.md wants marketing messages split per page; this
  // hands the whole catalog to the client provider.
  const messages = await getMessages();
  const t = await getTranslations("common");

  return (
    <html lang={locale} className={geologica.variable} suppressHydrationWarning>
      <head>
        {/* Resolves the theme onto <html> before first paint — no flash. */}
        <ThemeScript />
      </head>
      {/*
        `suppressHydrationWarning` for the same reason <html> carries it, but a different writer:
        browser extensions tag <body> before React hydrates (a password manager / translator adds
        `__processed_<uuid>__="true"`, Grammarly `data-gr-ext-installed`, Dark Reader its own), and
        React then reports "some attributes of the server rendered HTML didn't match the client".
        It is about an attribute nothing in this app renders, on an element we do not control the
        final state of, so there is nothing to fix in the markup.

        The flag does NOT cascade: it covers this element's own attributes and text only, so every
        child is still hydration-checked normally and a real mismatch inside the app still reports.
      */}
      <body
        suppressHydrationWarning
        className={`${geologica.className} min-h-dvh bg-bg text-ink`}
      >
        {/* First focusable element on every page (07-responsive-a11y-perf.md). */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-5 focus:top-5 focus:z-50 focus:rounded-pill focus:bg-cta focus:px-6 focus:py-3 focus:text-label focus:font-semibold focus:text-on-cta"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/*
            `initialStatus="unknown"`: `cacheComponents` is enabled, so reading
            `cookies()` in this layout would be a build error outside a <Suspense>
            boundary and would drop the marketing static shell. `<Providers>`
            hydrates the session from `/api/auth/session` on first render and
            `<AuthGate>` shows the page skeleton while the status is `unknown`
            (03-auth-session.md), so there is no auth flash.
            `<Providers>` also mounts `<ThemeProvider>` from `@/core/theme`.
          */}
          <Providers initialStatus="unknown" initialUser={null}>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
