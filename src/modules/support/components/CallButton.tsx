'use client';

/**
 * `Button Zəng et` (`support-chat-unavailable.html`): the 52-high soft pill that dials support.
 *
 * A plain `<a href="tel:…">`, **not** `<StateButton href>` / `<Link>`: those go through next-intl
 * navigation, which would turn `tel:*0101` into `/az/tel:*0101`. Anything that is not an in-app
 * route has to stay an ordinary anchor.
 */
import { cn } from '@/core/lib/cn';
import { Phone } from '@/shared/lucide';

export interface CallButtonProps {
  /** Display number, e.g. "*0101". The `tel:` target is derived from it. */
  phone: string;
  label: string;
  className?: string;
}

export function CallButton({ phone, label, className }: CallButtonProps) {
  return (
    <a
      href={`tel:${phone.replace(/\s+/g, '')}`}
      className={cn(
        'inline-flex h-[52px] w-fit flex-row items-center justify-center gap-2.5 rounded-pill px-7',
        'bg-surface2 text-body font-semibold text-ink transition-colors',
        className,
      )}
    >
      <Phone aria-hidden="true" size={18} className="shrink-0" />
      {label}
    </a>
  );
}
