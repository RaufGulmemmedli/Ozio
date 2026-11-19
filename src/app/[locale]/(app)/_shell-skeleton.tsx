"use client";

import { useTranslations } from "next-intl";

import { PageSkeleton } from "@/shared/skeleton";

/**
 * Shell-level loading fallback: the generic `<PageSkeleton>` preset (page header
 * + three section blocks) with the localized "Yüklənir…" announcement.
 *
 * Not a route — a `_`-prefixed file is never a route segment. Shared by
 * `loading.tsx` (server) and `<AuthGate>` (client) so both show the same thing,
 * which is why it is a Client Component.
 *
 * A screen with a real mirror skeleton ships that instead (BUILD-CONTRACT rule 3);
 * this only covers navigation transitions and the `status === 'unknown'` window.
 */
export function ShellSkeleton() {
  const t = useTranslations("common");

  return <PageSkeleton label={t("loading")} />;
}
