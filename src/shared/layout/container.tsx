/**
 * Landing container (layout.md §3): `width: min(100% - 2*var(--oz-page-x), 1200px)`
 * centred — i.e. 1200 wide only from 1440 up, 120 px gutters at 1440,
 * 32 at 768 and 20 at 390 (the token is switched in `globals.css`).
 *
 * Uses the `oz-container` utility already declared in `globals.css`.
 */
import type { ElementType, ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

export interface ContainerProps {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
}

export function Container({ as: Tag = 'div', children, className }: ContainerProps) {
  return <Tag className={cn('oz-container', className)}>{children}</Tag>;
}
