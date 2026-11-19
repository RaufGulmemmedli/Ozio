"use client";

import {
  createContext,
  useMemo,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";

import { THEME_COOKIE } from "./theme-script";

export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export type ThemeContextValue = {
  /** What the user chose. Default `system`. */
  pref: ThemePref;
  /** What `pref` currently resolves to against `prefers-color-scheme`. */
  resolved: ResolvedTheme;
  setPref: (pref: ThemePref) => void;
};

/** @internal — consume through `useTheme()`. */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = "(prefers-color-scheme: dark)";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const isPref = (value: string | undefined): value is ThemePref =>
  value === "light" || value === "dark" || value === "system";

/*
 * <html> IS the store.
 *
 * `<ThemeScript>` writes `data-theme` / `data-theme-pref` / `color-scheme` before
 * first paint, so React must read from the DOM rather than keep a second copy of
 * the truth — that is what `useSyncExternalStore` is for, and it also means the
 * hydration render uses the server snapshot and no attribute is ever clobbered.
 */

const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};

/** `"<pref>:<resolved>"` — a primitive, so the snapshot is stable by value. */
const SERVER_SNAPSHOT = "system:light";

function getSnapshot(): string {
  const root = document.documentElement;
  const pref = isPref(root.dataset.themePref) ? root.dataset.themePref : "system";
  const resolved = root.dataset.theme === "dark" ? "dark" : "light";
  return `${pref}:${resolved}`;
}

function getServerSnapshot(): string {
  return SERVER_SNAPSHOT;
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

/** Applies `pref` to <html> (what every token in globals.css reads). */
function applyPref(pref: ThemePref): void {
  const root = document.documentElement;
  const dark = pref === "dark" || (pref === "system" && systemPrefersDark());
  root.dataset.themePref = pref;
  root.dataset.theme = dark ? "dark" : "light";
  root.style.colorScheme = dark ? "dark" : "light";
}

function currentPref(): ThemePref {
  const fromDom = document.documentElement.dataset.themePref;
  return isPref(fromDom) ? fromDom : "system";
}

/** 1 year, SameSite=Lax — so SSR and `<ThemeScript>` resolve the same value. */
function persist(pref: ThemePref): void {
  document.cookie = `${THEME_COOKIE}=${pref};path=/;max-age=${ONE_YEAR_SECONDS};samesite=lax`;
}

function setPref(pref: ThemePref): void {
  applyPref(pref);
  persist(pref);
  emit();
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  // Keep following the OS while the preference is `system`, and refresh the
  // cookie's year so a returning visitor still gets a flash-free first paint.
  const mq = window.matchMedia(DARK_QUERY);
  const onSystemChange = () => {
    if (currentPref() === "system") applyPref("system");
    emit();
  };
  mq.addEventListener("change", onSystemChange);
  persist(currentPref());

  return () => {
    listeners.delete(onStoreChange);
    mq.removeEventListener("change", onSystemChange);
  };
}

/**
 * Publishes the theme preference to the tree. Mounted once by
 * `@/core/query/providers` (which the root `[locale]` layout renders).
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<ThemeContextValue>(() => {
    const [pref, resolved] = snapshot.split(":");
    return {
      pref: isPref(pref) ? pref : "system",
      resolved: resolved === "dark" ? "dark" : "light",
      setPref,
    };
  }, [snapshot]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
