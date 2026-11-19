import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { localeShortLabels, resolveLocale } from "@/core/i18n";
import { paths } from "@/core/routes";
import { MarketingHeader } from "@/modules/marketing/components/MarketingHeader";
import { BootSplash } from "@/shared/brand";
import { LandingFooter } from "@/shared/layout/landing-footer";

/**
 * `landing` layout (02-routing.md): the sticky marketing header + footer around
 * every public page. Both come from `@/shared/layout` (nodes `HLpCF` / `l87V9f`);
 * all copy and every href is passed in from here so the shared components never
 * carry route literals of their own.
 *
 * The header CTA stays logged-out on the server (`authed` false) to keep these
 * pages fully static; 02-routing.md resolves "Tətbiqə keç" client-side from
 * `/api/auth/session`. `<MarketingHeader>` from `@/modules/marketing` is the
 * small client island that does exactly that (and holds the az/ru/en menu); it
 * renders `<LandingHeader>` and nothing else.
 */

/** `/#faq` is an anchor on the landing page, so it is not a `paths` entry. */
const FAQ_HREF = "/#faq";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });

  return {
    // No `title` here: the `[locale]` layout already sets the default + the
    // `%s — Ozio` template, and re-declaring the default would run it through
    // that template ("… — Ozio — Ozio"). Marketing pages set their own title.
    description: meta("home.description"),
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "Ozio",
      locale,
      title: meta("home.title"),
      description: meta("home.description"),
    },
  };
}

export default async function MarketingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("shell");

  const navLinks = [
    { id: "cashback", href: paths.cashback, label: t("landing.links.cashback") },
    { id: "market", href: paths.delivery, label: t("landing.links.market") },
    { id: "ten", href: paths.ten, label: t("landing.links.ten") },
    { id: "partners", href: paths.partners, label: t("landing.links.partners") },
    { id: "faq", href: FAQ_HREF, label: t("landing.links.faq") },
  ];

  const footerColumns = [
    {
      id: "ozio",
      title: t("footer.columns.ozio"),
      links: navLinks.filter((link) => link.id !== "faq"),
    },
    {
      id: "support",
      title: t("footer.columns.support"),
      links: [
        { id: "faq", href: FAQ_HREF, label: t("landing.links.faq") },
        { id: "contact", href: paths.contact, label: t("footer.links.contact") },
        { id: "terms", href: paths.terms, label: t("footer.links.terms") },
        { id: "privacy", href: paths.privacy, label: t("footer.links.privacy") },
      ],
    },
    {
      id: "contact",
      title: t("footer.columns.contact"),
      links: [
        { id: "phone", label: t("footer.contact.phone") },
        { id: "email", label: t("footer.contact.email") },
        { id: "address", label: t("footer.contact.address") },
      ],
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      {/* The scooter, on the landing as well as in the app. This layout belongs to a different
          route group than the app shell, so stepping from here into the app mounts that shell and
          plays it a second time — which is the point; see <BootSplash>. */}
      <BootSplash travel />

      <MarketingHeader
        links={navLinks}
        loginHref={paths.login}
        downloadHref={`${paths.landing}#download`}
        appHref={paths.home}
        locale={resolveLocale(locale)}
        localeLabel={localeShortLabels[resolveLocale(locale)]}
      />

      {/* The section rhythm in design-system/layout.md §3 is "120px top padding, no bottom
          padding — the next section's 120 supplies the gap". The footer is not a <Section>, so
          nothing supplied that gap after the last one and the Download block sat flush against
          the black footer. This adds the same rhythm below the page content, on every marketing
          page (120 / 72 at ≤1199 / 48 at ≤767, straight from --oz-section-y). */}
      <div className="flex flex-1 flex-col pb-[var(--oz-section-y)]">{children}</div>

      <LandingFooter
        className="mt-auto"
        columns={footerColumns}
        tagline={t("footer.tagline")}
        copyright={t("footer.copyright")}
      />
    </div>
  );
}
