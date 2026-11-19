'use client';

/**
 * `<ProductQuickView>` — what the intercepted route
 * `(app)/@modal/(.)market/product/[id]/page.tsx` renders when a product is opened from a store,
 * search or category page.
 *
 * - **≥768**: a centred quick view over the page underneath — gallery beside a condensed info
 *   column, plus a link to the full page. Radix Dialog supplies the focus trap, Esc, the scroll
 *   lock and focus restore to the card that opened it.
 * - **<768**: the full page, rendered as a full-screen layer (same focus trap, same `router.back()`
 *   dismissal) rather than a bottom sheet — the product page is too tall for one.
 * - **direct URL hit**: this component is never mounted; `@modal/default.tsx` renders `null` and
 *   `(app)/market/product/[id]/page.tsx` renders the real page.
 */
import { useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { getPathname, useRouter } from '@/core/i18n/navigation';
import { useIsMobile } from '@/core/lib/use-breakpoint';
import { ArrowRight, X } from '@/shared/lucide';
import { IconButton, Modal } from '@/shared/ui';
// `ModalPrimitive` (the Radix Dialog root) is exported by the modal module, not by the barrel.
import { ModalPrimitive } from '@/shared/ui/modal';

import { productPath } from '../product.routes';
import { ProductView } from '../view/product-view';

export interface ProductQuickViewProps {
  variantId: number | null;
  storeId: number | null;
}

export function ProductQuickView({ variantId, storeId }: ProductQuickViewProps) {
  const t = useTranslations('product');
  const locale = useLocale();
  const router = useRouter();
  const isMobile = useIsMobile();

  const close = useCallback(
    (open: boolean) => {
      if (!open) router.back();
    },
    [router],
  );

  /**
   * Leaving the quick view, under its own steam rather than from the Dialog's `onOpenChange`.
   *
   * `router.back()` is the same dismissal Esc and the close button use: this component IS the
   * intercepted route, so popping the history entry is what un-intercepts it and reveals the page
   * underneath, with the product already in the cart and the header badge updated.
   */
  const dismiss = useCallback(() => {
    router.back();
  }, [router]);

  /**
   * Locale-prefixed, because the link below is a plain <a> (a real document load) and so has to
   * carry the prefix itself — `productPath()` returns the bare path. With `localePrefix:
   * 'as-needed'` this is `/market/...` on az and `/ru/market/...` / `/en/market/...` elsewhere.
   */
  const fullHref = useMemo(() => {
    if (variantId === null || storeId === null) return null;
    const path = productPath(variantId, storeId);
    const [pathname = path, query = ''] = path.split('?');
    return `${getPathname({ href: pathname, locale })}${query ? `?${query}` : ''}`;
  }, [variantId, storeId, locale]);

  if (isMobile) {
    return (
      <ModalPrimitive.Root open onOpenChange={close}>
        <ModalPrimitive.Portal>
          <ModalPrimitive.Overlay className="fixed inset-0 z-[60] bg-bg" />
          <ModalPrimitive.Content
            className="fixed inset-0 z-[61] flex flex-col overflow-y-auto bg-bg outline-none"
            aria-label={t('quickView.title')}
          >
            <ModalPrimitive.Title className="sr-only">{t('quickView.title')}</ModalPrimitive.Title>
            <div className="sticky top-0 z-10 flex w-full flex-row justify-end bg-bg px-5 py-3">
              <ModalPrimitive.Close asChild>
                <IconButton aria-label={t('quickView.close')} size={44} tone="surface">
                  <X aria-hidden="true" />
                </IconButton>
              </ModalPrimitive.Close>
            </div>
            <div className="w-full px-5 pb-[120px]">
              <ProductView variantId={variantId} storeId={storeId} onAddedToCart={dismiss} />
            </div>
          </ModalPrimitive.Content>
        </ModalPrimitive.Portal>
      </ModalPrimitive.Root>
    );
  }

  return (
    <Modal
      open
      onOpenChange={close}
      title={t('quickView.title')}
      titleHidden
      size="l"
      closeLabel={t('quickView.close')}
      footer={
        fullHref ? (
          /*
           * A plain <a>, deliberately — NOT the locale-aware <Link>.
           *
           * This modal IS the intercepted route for `fullHref`, so a client-side navigation to
           * that same URL is a no-op: the router matches the interception again and the modal
           * just stays open, which is exactly what "the full-page link does nothing" looked
           * like. A real document load is the documented way out of an intercepted route, and
           * it renders the page itself rather than the interception.
           *
           * `fullHref` is built with `getPathname` above, so it already carries the active
           * locale prefix and nothing is lost by stepping outside next-intl's Link here.
           */
          <a
            href={fullHref}
            className="flex flex-row items-center gap-1.5 text-body-sm font-bold text-brand hover:text-brand-dark"
          >
            {t('quickView.openFull')}
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        ) : undefined
      }
    >
      <ProductView variantId={variantId} storeId={storeId} compact onAddedToCart={dismiss} />
    </Modal>
  );
}
