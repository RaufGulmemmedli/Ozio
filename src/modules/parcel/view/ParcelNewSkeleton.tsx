'use client';

/**
 * Mirror skeleton for `/parcel/new` (`paAxF` → `baglama-yeni-yuklenir.html`), i.e. stage
 * `SendStage.loading` while the rules and the saved addresses arrive.
 *
 * Same two-column grid, same card paddings and gaps as the loaded form, so there is no shift:
 * two address cards (title bone + full-width input bone + three input bones), the parcel card
 * (four preset bones, four input bones, a toggle bone), the payment card (three method bones) and
 * the dark quote panel with **translucent** bones over its real fill.
 */
import { Bone, Shimmer } from '@/shared/skeleton';

export function ParcelNewSkeleton({ label }: { label?: string }) {
  return (
    <Shimmer
      label={label}
      className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-start"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <AddressCardBones />
        <AddressCardBones />

        {/* Bağlama */}
        <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
          <Bone w={120} h={20} r="sm" />
          <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Bone key={i} w="100%" h={84} r="lg" />
            ))}
          </div>
          <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Bone w={80} h={13} r="xs" />
                <Bone w="100%" h={56} r="md" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Bone w={140} h={13} r="xs" />
            <Bone w="100%" h={56} r="md" />
          </div>
          <Bone w="100%" h={56} r="lg" />
        </div>

        {/* Ödəniş */}
        <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
          <Bone w={100} h={20} r="sm" />
          <div className="flex flex-row gap-2.5">
            <Bone w={168} h={44} r="pill" />
            <Bone w={150} h={44} r="pill" />
          </div>
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Bone key={i} w="100%" h={76} r="lg" />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Bone w={130} h={13} r="xs" />
            <Bone w="100%" h={56} r="md" />
          </div>
        </div>
      </div>

      {/* Quote Column — the dark fill is real, only the bones sweep. */}
      <div className="flex w-full shrink-0 flex-col gap-5 rounded-bento bg-block p-8 lg:w-[400px]">
        <Bone w={90} h={20} r="sm" tone="white" className="opacity-[0.14]" />
        <Bone w={180} h={48} r={12} tone="white" className="opacity-[0.14]" />
        <div className="flex flex-row gap-2">
          <Bone w={84} h={30} r="pill" tone="white" className="opacity-[0.14]" />
          <Bone w={96} h={30} r="pill" tone="white" className="opacity-[0.14]" />
        </div>
        <div className="flex w-full flex-col gap-3">
          {[120, 150, 128, 140].map((w, i) => (
            <div key={i} className="flex w-full flex-row items-center justify-between">
              <Bone w={w} h={14} r="xs" tone="white" className="opacity-[0.14]" />
              <Bone w={56} h={14} r="xs" tone="white" className="opacity-[0.14]" />
            </div>
          ))}
        </div>
        <Bone w="100%" h={56} r="pill" tone="white" className="opacity-[0.14]" />
      </div>
    </Shimmer>
  );
}

function AddressCardBones() {
  return (
    <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
      <Bone w={160} h={20} r="sm" />
      <div className="flex flex-col gap-2">
        <Bone w={70} h={13} r="xs" />
        <Bone w="100%" h={56} r="md" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Bone w={[200, 110, 80][i]} h={13} r="xs" />
          <Bone w="100%" h={56} r="md" />
        </div>
      ))}
    </div>
  );
}
