/** Mirror skeleton for `<RestaurantView>`: the hero card, then two menu sections. */

import { Shimmer } from '@/shared/skeleton';

export function RestaurantSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8" aria-hidden="true">
      <Shimmer>
        <div className="flex w-full flex-col gap-3">
          <div className="oz-bone h-4 w-56 rounded-pill" />
          <div className="oz-bone h-9 w-64 rounded-pill" />
          <div className="oz-bone h-4 w-48 rounded-pill" />
        </div>

        <div className="mt-8 flex w-full flex-col gap-5 rounded-card bg-surface p-5 lg:p-6">
          <div className="flex w-full flex-row items-center gap-4">
            <div className="oz-bone size-16 shrink-0 rounded-[20px]" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="oz-bone h-7 w-24 rounded-pill" />
              <div className="oz-bone h-4 w-48 rounded-pill" />
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="oz-bone h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>

        {Array.from({ length: 2 }, (_, section) => (
          <div key={section} className="mt-8 flex w-full flex-col gap-4">
            <div className="oz-bone h-6 w-40 rounded-pill" />
            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex w-full flex-row gap-4 rounded-card bg-surface p-4">
                  <div className="oz-bone size-20 shrink-0 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="oz-bone h-5 w-2/3 rounded-pill" />
                    <div className="oz-bone h-4 w-full rounded-pill" />
                    <div className="oz-bone h-5 w-20 rounded-pill" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Shimmer>
    </div>
  );
}
