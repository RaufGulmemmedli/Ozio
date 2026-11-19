/**
 * Download band — node `YOqDs` / `jCox6` (layout.md §3, components.md §11).
 *
 * Desktop: a 1200×360 `brand` panel at radius 48, padding 0/72, row
 * space-between with gap 48; headline 52/800 in a 560-wide column, two 60-high
 * store pills, and a 200×200 white QR tile at radius 28 with "Skan et" 14/600.
 * Mobile: radius 32, padding 28. The QR is dropped below 1024
 * (`screens/landing.md` responsive table: "Download — no QR" at 768/390).
 *
 * The QR is generated at render time by `<QrCodeView>` from `@/shared/media`
 * (no client JS, no image) and encodes the configured smart link.
 */
import { cn } from '@/core/lib/cn';
import { Container } from '@/shared/layout/container';
import { QrCodeView } from '@/shared/media/qr-code-view';

import { appLinks } from '../content/app-links';
import { StoreBadges } from './StoreBadges';
import { typePanelTitle } from './type';

export interface DownloadPanelProps {
  title: string;
  appStoreLabel: string;
  googlePlayLabel: string;
  appStoreAria: string;
  googlePlayAria: string;
  qrCaption: string;
  qrLabel: string;
  /** `aria-labelledby` target; the band is also the `#download` anchor. */
  id?: string;
  className?: string;
}

export function DownloadPanel({
  title,
  appStoreLabel,
  googlePlayLabel,
  appStoreAria,
  googlePlayAria,
  qrCaption,
  qrLabel,
  id = 'download',
  className,
}: DownloadPanelProps) {
  const headingId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={headingId} className={cn('w-full', className)}>
      <Container>
        <div
          className={cn(
            'flex flex-col gap-7 rounded-modal bg-brand p-7',
            'md:gap-10 md:rounded-2xl md:px-12 md:py-14',
            'lg:flex-row lg:items-center lg:justify-between',
            'min-[1200px]:min-h-[360px] min-[1200px]:px-18 min-[1200px]:py-0',
          )}
        >
          <div className="flex flex-col gap-6 lg:max-w-[560px]">
            <h2 id={headingId} className={cn('m-0 text-white', typePanelTitle)}>
              {title}
            </h2>
            <StoreBadges
              appStoreHref={appLinks.appStore}
              googlePlayHref={appLinks.googlePlay}
              appStoreLabel={appStoreLabel}
              googlePlayLabel={googlePlayLabel}
              appStoreAria={appStoreAria}
              googlePlayAria={googlePlayAria}
            />
          </div>

          <QrCodeView
            value={appLinks.smartLink}
            label={qrLabel}
            size={200}
            caption={qrCaption}
            className="hidden shrink-0 lg:flex"
          />
        </div>
      </Container>
    </section>
  );
}
