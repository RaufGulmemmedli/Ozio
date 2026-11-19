import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

/**
 * Locale-aware navigation. Every internal link/redirect goes through these —
 * plain `next/link` would drop the `/ru` / `/en` prefix.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
