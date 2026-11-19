"use client";

import { useTranslations } from "next-intl";

import { ConfirmDialogHost, SnackbarHost, Toaster } from "@/shared/ui";
import { GuestPrompt } from "@/shared/states";

/**
 * The app-wide overlay hosts, mounted exactly once by `(app)/layout.tsx`.
 *
 * Each of these is a singleton driven by a store, so the imperative APIs do
 * nothing at all until its host is on screen:
 *
 * - `<Toaster>`          — `toast.success|error|info(...)`
 * - `<SnackbarHost>`     — `snackbar.show(...)` (the cart's undo-remove)
 * - `<ConfirmDialogHost>`— `confirmDialog(...)`; **without it the promise never
 *                          resolves**, so a destructive confirm silently does nothing
 * - `<GuestPrompt>`      — `requireAuth(...)` flips the store; this renders it,
 *                          so a guest tapping "add to cart" actually sees a prompt
 *
 * Two module agents each shipped a private copy of these hosts because nothing
 * mounted them centrally. Those copies are redundant now and are being removed.
 *
 * The bottom offset clears the mobile tab-bar pill (68px tall, sitting 28px from
 * the bottom) plus the safe area, so toasts never hide the nav.
 */
const PILL_OFFSET = "calc(68px + 28px + env(safe-area-inset-bottom))";

export function OverlayHosts() {
  const t = useTranslations("common");

  return (
    <>
      <Toaster offsetBottom={PILL_OFFSET} closeLabel={t("close")} />
      <SnackbarHost offsetBottom={PILL_OFFSET} />
      <ConfirmDialogHost />
      <GuestPrompt
        title={t("guest.title")}
        body={t("guest.body")}
        primaryLabel={t("signIn")}
        secondaryLabel={t("cancel")}
      />
    </>
  );
}
