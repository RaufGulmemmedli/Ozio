import type { Metadata } from "next";
import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

/**
 * `full` layout (02-routing.md): splash / intro / permission steps run
 * full-bleed with no chrome at all. The page renders its own
 * `<main id="main">` (the skip-link target).
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OnboardingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div className="flex min-h-dvh flex-col bg-bg">{children}</div>;
}
