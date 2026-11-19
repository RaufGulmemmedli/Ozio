"use client";

// global-error replaces the root layout, so it gets no inherited stylesheet —
// the tokens have to be imported here as well. globals.css is never edited.
import "./globals.css";

import { OzioLogo } from "@/shared/brand";
import { TriangleAlert } from "@/shared/lucide";

/**
 * Last-resort 500: it renders when the root layout itself failed, which means
 * there is no `NextIntlClientProvider`, no theme provider and no messages above
 * it. Hence the three az strings below are deliberately literal (every other
 * string in the app goes through next-intl, BUILD-CONTRACT rule 2) and there is
 * no Lottie — per 06-i18n-theming.md the 500 screen uses the static logo + retry.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // No <ThemeScript> here (it may be the very thing that failed); globals.css
  // falls back to `prefers-color-scheme`, and this panel is dark in both themes.
  return (
    <html lang="az">
      <body className="min-h-dvh bg-block text-on-block">
        <main
          id="main"
          role="alert"
          className="flex min-h-dvh flex-col items-center justify-center gap-7 px-5 py-24 text-center"
        >
          <OzioLogo size="m" tone="white" />

          <div className="flex items-center gap-[14px]">
            <span className="text-display-404 font-extrabold leading-none">500</span>
            <span
              aria-hidden
              className="flex size-16 items-center justify-center rounded-pill bg-brand text-white"
            >
              <TriangleAlert size={30} strokeWidth={1.75} />
            </span>
          </div>

          <h1 className="text-h1-app font-extrabold">Xəta baş verdi</h1>
          <p className="max-w-[520px] text-body-l text-on-block2">
            Serverdə gözlənilməz xəta baş verdi. Komandamız artıq bunun üzərindədir, bir azdan
            yenidən cəhd edin.
          </p>
          {error.digest ? (
            <p className="text-caption text-on-block3">Sorğu ID: {error.digest}</p>
          ) : null}

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex h-14 items-center justify-center rounded-pill bg-brand px-8 text-body font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Səhifəni yenilə
          </button>
        </main>
      </body>
    </html>
  );
}
