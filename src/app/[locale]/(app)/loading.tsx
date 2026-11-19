import { ShellSkeleton } from "./_shell-skeleton";

/**
 * Segment-level fallback for the whole `(app)` group. A screen that ships its own
 * mirror skeleton should add `loading.tsx` next to its `page.tsx` (or render the
 * skeleton from its view); this is the generic shell-shaped stand-in so no route
 * ever flashes a blank area (BUILD-CONTRACT rule 3).
 */
export default function AppLoading() {
  return <ShellSkeleton />;
}
