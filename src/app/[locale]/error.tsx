"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/core/i18n";
import { paths } from "@/core/routes";
import { OzioLogo } from "@/shared/brand";
import { TriangleAlert } from "@/shared/lucide";

/**
 * 500 boundary for everything under `[locale]` — design node `Snz2r`
 * (`html/landing/web-xeta-500.html`, states-catalog §1.3). Per
 * 06-i18n-theming.md the 500 screen uses the **static** logo + retry, no Lottie.
 *
 * `error.tsx` must be a Client Component, so it cannot export `metadata`; the
 * noindex hint is rendered as a <meta> element (React 19 hoists it into <head>).
 *
 * TODO(shared): switch to `<ErrorState failure={…} onRetry={reset} />` from
 * `@/shared/states` — its API takes a `Failure` from `@/core/network`, not a
 * plain `Error`, so a boundary error has to be wrapped first
 * (05-states-and-skeletons.md).
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("shell");
  const common = useTranslations("common");

  return (
    <main
      id="main"
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-7 bg-block px-page py-24 text-center text-on-block"
    >
      <meta name="robots" content="noindex, nofollow" />

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

      <h1 className="text-h1-app font-extrabold">{t("error.title")}</h1>
      <p className="max-w-[520px] text-body-l text-on-block2">{t("error.text")}</p>
      {error.digest ? (
        <p className="text-caption text-on-block3">
          {t("error.requestId", { id: error.digest })}
        </p>
      ) : null}

      {/* TODO(shared): both actions want <Button variant="brand"|"white" size="2xl">. */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="flex h-14 items-center justify-center rounded-pill bg-brand px-8 text-body font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          {common("retry")}
        </button>
        <Link
          href={paths.contact}
          className="flex h-14 items-center justify-center rounded-pill bg-white px-8 text-body font-semibold text-block transition-colors hover:bg-surface2"
        >
          {t("error.support")}
        </Link>
      </div>
    </main>
  );
}
