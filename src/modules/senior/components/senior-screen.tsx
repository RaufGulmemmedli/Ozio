'use client';

/**
 * The scope every senior screen is wrapped in.
 *
 * It does two things: mounts `useSeniorMode()` (which writes `data-senior`,
 * `data-senior-contrast` and `--oz-senior-pref-scale` on `<html>`) and puts `senior.module.css`'s
 * `.scope` class on this subtree, which is where the larger type scale, the bigger targets and the
 * high-contrast tokens actually apply.
 *
 * That split is deliberate: the *preference* is global and persisted, the *stylesheet* is scoped,
 * so switching Sadə rejim on can never reflow another module's screen — and
 * `src/app/globals.css` is never edited.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

import { useSeniorMode } from '../hooks/use-senior-mode';
import styles from '../senior.module.css';

export interface SeniorScreenProps {
  children: ReactNode;
  className?: string;
}

export function SeniorScreen({ children, className }: SeniorScreenProps) {
  // Mounted for its effect: it applies (or clears) the attributes the stylesheet keys off.
  useSeniorMode();

  return (
    <div className={cn(styles.scope, 'flex w-full flex-col gap-8', className)}>{children}</div>
  );
}

/** The one hand-set display size on these screens (the payday countdown). */
export const seniorDisplayClass = styles.display;

/** The live sample on `/senior/mode`, which previews the chosen scale on its own. */
export const seniorSampleClass = styles.sample;

/**
 * Put on a `brand`-filled block that carries small white text. In Sadə rejim the fill moves to
 * `brand-dark`, which lifts white text from 3.9:1 (light) / 3.2:1 (dark) to 5.6:1 in both.
 */
export const seniorOnBrandClass = styles.onBrand;
