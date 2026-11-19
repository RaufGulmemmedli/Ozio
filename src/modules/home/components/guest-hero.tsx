'use client';

/**
 * Guest home (AU8, `app-qonaq-rejimi.html`).
 *
 * Guest Banner: `block` fill, `rounded-xl` (28), 96 high, padding-inline 32, gap 20; yellow icon
 * disc 52 (radius 26); title 20/700 `on-block`, body 14/400 at 75%; brand "Daxil ol" pill 52 and a
 * white "Qeydiyyat" pill 52.
 * Locked Row: two `surface` cards, 220 high, radius 28, padding 28, gap 12 — icon chip 52/16,
 * title 22/700, body 15/400/23, and a `cta` pill 46 high.
 */
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { CreditCard, Package, User, type LucideIcon } from '@/shared/lucide';
import { LinkButton } from './link-button';

export interface GuestHeroLabels {
  bannerTitle: string;
  bannerBody: string;
  signIn: string;
  register: string;
  cardTitle: string;
  cardBody: string;
  ordersTitle: string;
  ordersBody: string;
}

export function GuestHero({ labels, className }: { labels: GuestHeroLabels; className?: string }) {
  const loginHref = `${paths.login}?next=${encodeURIComponent(paths.home)}`;

  return (
    <div className={cn('flex w-full flex-col gap-6', className)}>
      <section className="flex w-full flex-col gap-5 rounded-xl bg-block px-6 py-6 text-on-block lg:h-24 lg:flex-row lg:items-center lg:px-8 lg:py-0">
        <span
          aria-hidden
          className="flex size-[52px] shrink-0 items-center justify-center rounded-pill bg-yellow text-on-yellow"
        >
          <User className="size-6" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-h4 font-bold">{labels.bannerTitle}</p>
          <p className="text-label text-on-block/75">{labels.bannerBody}</p>
        </div>
        <div className="flex shrink-0 flex-row gap-3">
          <LinkButton href={loginHref} variant="brand" size="xl">
            {labels.signIn}
          </LinkButton>
          <LinkButton href={paths.register} variant="white" size="xl">
            {labels.register}
          </LinkButton>
        </div>
      </section>

      <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <LockedCard
          icon={CreditCard}
          tone="brand"
          title={labels.cardTitle}
          body={labels.cardBody}
          ctaLabel={labels.signIn}
          href={loginHref}
        />
        <LockedCard
          icon={Package}
          tone="sky"
          title={labels.ordersTitle}
          body={labels.ordersBody}
          ctaLabel={labels.signIn}
          href={loginHref}
        />
      </div>
    </div>
  );
}

const LOCKED_TONES = {
  brand: 'bg-brand-soft text-brand',
  sky: 'bg-sky-soft text-sky',
} as const;

function LockedCard({
  icon: Icon,
  tone,
  title,
  body,
  ctaLabel,
  href,
}: {
  icon: LucideIcon;
  tone: keyof typeof LOCKED_TONES;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
}) {
  return (
    <section className="flex flex-col justify-center gap-3 rounded-xl bg-surface p-7 lg:h-[220px]">
      <div className="flex w-full flex-row items-center gap-3.5">
        <span
          aria-hidden
          className={cn('flex size-[52px] shrink-0 items-center justify-center rounded-[16px]', LOCKED_TONES[tone])}
        >
          <Icon className="size-6" />
        </span>
        <h2 className="text-[22px] font-bold text-ink">{title}</h2>
      </div>
      <p className="max-w-[420px] text-body-sm leading-[23px] text-ink2">{body}</p>
      <LinkButton href={href} variant="primary" size="lg" className="self-start">
        {ctaLabel}
      </LinkButton>
    </section>
  );
}
