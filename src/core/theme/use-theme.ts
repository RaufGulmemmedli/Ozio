"use client";

import { useContext } from "react";

import {
  ThemeContext,
  type ResolvedTheme,
  type ThemePref,
} from "./theme-provider";

export type UseThemeResult = {
  pref: ThemePref;
  resolved: ResolvedTheme;
  setPref: (pref: ThemePref) => void;
  /** Jump to the opposite of what is on screen right now (leaves `system`). */
  toggle: () => void;
};

export function useTheme(): UseThemeResult {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error(
      "useTheme() must be used inside <ThemeProvider> (mounted in src/app/[locale]/layout.tsx).",
    );
  }

  return {
    pref: ctx.pref,
    resolved: ctx.resolved,
    setPref: ctx.setPref,
    toggle: () => ctx.setPref(ctx.resolved === "dark" ? "light" : "dark"),
  };
}
