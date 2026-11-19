import { CouponModal } from '@/modules/coupons';

/** Intercepted route: modal L at >=768, bottom sheet below (see `<CouponModal>`). */
export default async function CouponModalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CouponModal id={id} />;
}
