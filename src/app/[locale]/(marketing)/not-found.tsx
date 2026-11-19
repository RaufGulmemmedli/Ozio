import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link } from "@/core/i18n";
import { paths } from "@/core/routes";
import { Lottie404 } from "@/shared/brand";
import { MapPin } from "@/shared/lucide";

/**
 * 404 — design node `iY3D5` (`html/landing/web-404.html`, states-catalog §1.3):
 * full-bleed `block` panel, the brand Lottie holding in its 60–186 range, numeral
 * 96/800, map-pin chip 64, title 36/800, text 18/400 `on-block2`, Primary + White
 * actions. Rendered inside the landing layout (header + footer), per 02-routing.md.
 *
 * `text-block` is the label colour on the white button: near-black in both themes,
 * which is what the design's White button variant needs.
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");

  return {
    title: t("notFound.title"),
    description: t("notFound.description"),
    robots: { index: false, follow: false },
  };
}

export default async function MarketingNotFound() {
  const t = await getTranslations("shell");

  return (
    <main
      id="main"
      className="flex min-h-[600px] flex-1 flex-col items-center justify-center gap-7 bg-block px-page py-24 text-center text-on-block"
    >
      <Lottie404 />

      <div className="flex items-center gap-[14px]">
        <span className="text-display-404 font-extrabold leading-none">404</span>
        <span
          aria-hidden
          className="flex size-16 items-center justify-center rounded-pill bg-brand text-white"
        >
          <MapPin size={30} strokeWidth={1.75} />
        </span>
      </div>

      <h1 className="text-h1-app font-extrabold">{t("notFound.title")}</h1>
      <p className="max-w-[520px] text-body-l text-on-block2">{t("notFound.text")}</p>

      {/* TODO(shared): both CTAs want <Button variant="brand"|"white" size="2xl" as="a">. */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={paths.landing}
          className="flex h-14 items-center justify-center rounded-pill bg-brand px-8 text-body font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          {t("notFound.primary")}
        </Link>
        <Link
          href={paths.delivery}
          className="flex h-14 items-center justify-center rounded-pill bg-white px-8 text-body font-semibold text-block transition-colors hover:bg-surface2"
        >
          {t("notFound.secondary")}
        </Link>
      </div>
    </main>
  );
}
