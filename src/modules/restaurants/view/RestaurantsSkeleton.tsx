/**
 * The mirror skeleton for `<RestaurantsView>`.
 *
 * Same boxes, same gaps, same grid as the real screen, so nothing moves when the data lands
 * (BUILD-CONTRACT rule 3: skeletons, never spinners, for screen loading).
 */

import { Shimmer } from '@/shared/skeleton';

export function RestaurantsSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8" aria-hidden="true">
      <Shimmer>
        <div className="flex w-full flex-col gap-3">
          <div className="oz-bone h-4 w-40 rounded-pill" />
          <div className="oz-bone h-9 w-56 rounded-pill" />
          <div className="oz-bone h-4 w-28 rounded-pill" />
        </div>

        <div className="mt-8 flex w-full flex-row items-start gap-6">
          <div className="oz-bone hidden h-[520px] w-60 shrink-0 rounded-card lg:block" />

          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <div className="flex w-full flex-row items-center justify-between">
              <div className="oz-bone h-10 w-28 rounded-pill lg:invisible" />
              <div className="oz-bone h-10 w-44 rounded-pill" />
            </div>

            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex w-full flex-col gap-4 rounded-card bg-surface p-4">
                  <div className="oz-bone h-32 w-full rounded-lg" />
                  <div className="flex w-full flex-col gap-2">
                    <div className="oz-bone h-5 w-2/3 rounded-pill" />
                    <div className="oz-bone h-4 w-1/2 rounded-pill" />
                    <div className="oz-bone h-4 w-3/4 rounded-pill" />
                    <div className="oz-bone mt-1 h-7 w-28 rounded-pill" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Shimmer>
    </div>
  );
}
