import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { OzioLogo } from "@/shared/brand";

/**
 * `auth-split` layout (02-routing.md): two equal columns at ≥768, single column
 * below. The brand column is a `brand` fill with the White XL logo (height 40,
 * 06-i18n-theming.md) plus the two decorative blobs from the design
 * (`html/auth/giris.html`: yellow 460 top-right, ink 420 bottom-left).
 *
 * Side note: the design export and `screens/auth.md` put the brand panel on the
 * LEFT ("Brand Panel (left, brand-pink) + Form Panel (right)"), while the F6 brief
 * described it as "form left, brand right". The export wins; flip the single
 * constant below to switch, nothing else changes.
 */
const BRAND_PANEL_SIDE: "left" | "right" = "left";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shell");

  const brandOrder = BRAND_PANEL_SIDE === "left" ? "md:order-1" : "md:order-2";
  const formOrder = BRAND_PANEL_SIDE === "left" ? "md:order-2" : "md:order-1";

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Brand panel — hidden below 768 (07-responsive-a11y-perf.md). */}
      <aside
        aria-hidden
        className={`relative hidden overflow-hidden bg-brand text-white md:flex md:w-1/2 md:flex-col md:justify-between md:p-16 ${brandOrder}`}
      >
        <div className="absolute -top-40 right-[-40px] size-[460px] rounded-pill bg-yellow" />
        <div className="absolute -left-36 bottom-[-80px] size-[420px] rounded-pill bg-block" />
        <div className="relative">
          <OzioLogo size="xl" tone="white" decorative className="w-[281px] max-w-full" />
        </div>
        <p className="relative max-w-[480px] text-h2 font-extrabold leading-tight">
          {t("auth.tagline")}
        </p>
      </aside>

      {/* Form panel */}
      <div className={`flex flex-1 flex-col ${formOrder}`}>
        {/* <768: the brand panel is hidden, so the logo moves on top of the form. */}
        <div className="flex items-center px-5 pt-6 md:hidden">
          <OzioLogo size="s" tone="brand" />
        </div>
        {/* The page renders its own <main id="main"> (the skip-link target). */}
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 md:px-16">
          <div className="flex w-full max-w-[420px] flex-col">{children}</div>
        </div>
      </div>
    </div>
  );
}
