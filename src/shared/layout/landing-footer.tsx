/**
 * Marketing footer — node `l87V9f` in `html/landing/landing-desktop.html`.
 *
 * Fill `block`, padding 72/120/40/120 (tablet 56/32/32, mobile 32/20), gap 48,
 * 4 columns space-between (brand 300 | Ozio | Dəstək | Əlaqə). Column titles
 * 14/700 `yellow` with +1 px tracking, links 15/400 white (hover `yellow`),
 * copyright 13 `on-block3`.
 *
 * No `'use client'`: the marketing routes ship as little JS as possible
 * (architecture/07 §Performance).
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { OzioLogo } from '@/shared/brand/ozio-logo';

export interface FooterLink {
  id: string;
  label: string;
  /** Internal path, or an absolute `tel:` / `mailto:` href. */
  href?: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface LandingFooterProps {
  /** Overrides the three canvas columns. */
  columns?: FooterColumn[];
  tagline?: string;
  copyright?: string;
  className?: string;
}

export function LandingFooter({ columns, tagline, copyright, className }: LandingFooterProps) {
  const t = useTranslations('shell');

  const defaultColumns: FooterColumn[] = [
    {
      id: 'ozio',
      title: t('footer.columns.ozio'),
      links: [
        { id: 'cashback', href: paths.cashback, label: t('landing.links.cashback') },
        { id: 'market', href: paths.delivery, label: t('landing.links.market') },
        { id: 'ten', href: paths.ten, label: t('landing.links.ten') },
        { id: 'partners', href: paths.partners, label: t('landing.links.partners') },
      ],
    },
    {
      id: 'support',
      title: t('footer.columns.support'),
      links: [
        { id: 'faq', href: `${paths.landing}#faq`, label: t('landing.links.faq') },
        { id: 'contact', href: paths.contact, label: t('footer.links.contact') },
        { id: 'terms', href: paths.terms, label: t('footer.links.terms') },
        { id: 'privacy', href: paths.privacy, label: t('footer.links.privacy') },
      ],
    },
    {
      id: 'contact',
      title: t('footer.columns.contact'),
      links: [
        { id: 'phone', href: 'tel:+994120000000', label: t('footer.contact.phone') },
        { id: 'email', href: 'mailto:info@ozio10.az', label: t('footer.contact.email') },
        { id: 'address', label: t('footer.contact.address') },
      ],
    },
  ];

  const cols = columns ?? defaultColumns;
  const linkClass =
    'text-body-sm font-normal text-white transition-colors duration-[var(--oz-dur-fast)] hover:text-yellow';

  return (
    <footer
      className={cn(
        'flex w-full flex-col gap-8 bg-block px-page pb-8 pt-8 md:gap-12 md:pt-14 lg:pb-10 lg:pt-[72px]',
        className,
      )}
    >
      <div className="flex w-full flex-col gap-8 md:flex-row md:justify-between">
        <div className="flex max-w-[300px] flex-col gap-4">
          <OzioLogo size="m" tone="white" />
          <p className="m-0 text-body-sm leading-[23px] text-on-block2">
            {tagline ?? t('footer.tagline')}
          </p>
        </div>

        {cols.map((column) => (
          <div key={column.id} className="flex flex-col gap-[14px]">
            <p className="m-0 text-label font-bold tracking-[1px] text-yellow">{column.title}</p>
            {column.links.map((link) =>
              link.href ? (
                link.href.startsWith('tel:') || link.href.startsWith('mailto:') ? (
                  <a key={link.id} href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.id} href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                )
              ) : (
                <span key={link.id} className="text-body-sm text-white">
                  {link.label}
                </span>
              ),
            )}
          </div>
        ))}
      </div>

      <p className="m-0 text-caption text-on-block3">{copyright ?? t('footer.copyright')}</p>
    </footer>
  );
}
