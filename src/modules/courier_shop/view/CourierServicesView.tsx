'use client';

/**
 * `/courier-services` — the hub (`kuryer-xidmetleri-hub.html`, node `s8119`).
 *
 * Static: three service tiles and the demo banner, no data screen, so no skeleton / empty / error.
 *
 * Below the drawn row it also links the other two courier packages, each behind its own flag, as
 * the build brief asks. Those tiles are **not** in the export — they are the entry points the
 * neighbouring modules own:
 *
 * `// TODO(courier_plus):` `import { CourierPlusEntry } from '@/modules/courier_plus'` (agent W6)
 * `// TODO(courier):` `import { CourierEntry } from '@/modules/courier'` (agent W5)
 *
 * Neither module exists yet, so a disabled tile is rendered in its place; swapping in the real
 * entry component is a one-line change per tile.
 */
import { useTranslations } from 'next-intl';

import { useFlag } from '@/core/config';
import { paths } from '@/core/routes';
import { Bike, Truck } from '@/shared/lucide';

import { SERVICE_ICON } from '../components/icons';
import { ServiceTile } from '../components/service-tiles';
import { ShopScreen } from '../components/shop-chrome';

export function CourierServicesView() {
  const t = useTranslations('courier_shop');
  const courierPlusOn = useFlag('courierPlus');
  const courierOn = useFlag('courier');

  return (
    <ShopScreen crumb={t('hub.crumb')} title={t('hub.title')} subtitle={t('hub.subtitle')}>
      <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row">
        <ServiceTile
          tone="block"
          icon={SERVICE_ICON.bag}
          title={t('hub.bag.title')}
          body={t('hub.bag.body')}
          cta={t('hub.bag.cta')}
          href={paths.courierBag}
        />
        <ServiceTile
          tone="brand"
          icon={SERVICE_ICON.fit}
          title={t('hub.fit.title')}
          body={t('hub.fit.body')}
          cta={t('hub.fit.cta')}
          href={paths.courierFit}
        />
        <ServiceTile
          tone="surface"
          icon={SERVICE_ICON.expert}
          title={t('hub.expert.title')}
          body={t('hub.expert.body')}
          cta={t('hub.expert.cta')}
          href={paths.courierExpert}
        />
      </div>

      {courierPlusOn || courierOn ? (
        <section aria-labelledby="courier-shop-more" className="flex w-full flex-col gap-4">
          <h2 id="courier-shop-more" className="m-0 text-h4 font-extrabold text-ink">
            {t('hub.more.title')}
          </h2>
          <div className="flex w-full flex-col items-stretch gap-4 md:flex-row">
            {courierPlusOn ? (
              // TODO(courier_plus): replace with <CourierPlusEntry /> from '@/modules/courier_plus'
              <ServiceTile
                tone="surface"
                icon={Truck}
                title={t('hub.more.courierPlus.title')}
                body={t('hub.more.courierPlus.body')}
                cta={t('hub.more.soon')}
                href={paths.courierPlus}
                disabled
              />
            ) : null}
            {courierOn ? (
              // TODO(courier): replace with the courier entry from '@/modules/courier'
              <ServiceTile
                tone="surface"
                icon={Bike}
                title={t('hub.more.courier.title')}
                body={t('hub.more.courier.body')}
                cta={t('hub.more.soon')}
                href={paths.courier}
                disabled
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </ShopScreen>
  );
}
