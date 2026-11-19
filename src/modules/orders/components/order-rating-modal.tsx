'use client';

/**
 * "Sifarişini qiymətləndir" (`app-order-rating.html` `x1riY6`) — a **modal on `/orders/[id]`**, not a
 * route (ROUTES.md lists the order-rating sheet under "Not routes (states)").
 *
 * Card 1: "Sifariş necə idi?" + 5 stars + multi-select tag chips (two rows: the export's single row
 * overflowed and was split, design defect `OWdyx`).
 * Card 2: the courier block with its own stars and chips — only when the order actually has a
 * courier.
 * Then the optional comment (≤500 chars) and "Rəyi göndər".
 *
 * `POST v2/orders/{id}/rate` is unverified and the tags have no field in the known body, so the
 * selected tag labels are appended to `comment` (see `composeComment`). Whether an order can be
 * rated twice is unknown → the submit is guarded against a double send, and an order that already
 * carries a rating opens read-only with a note.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFailureMessage } from '@/core/i18n';
import { Avatar, Button, Chip, Modal, Textarea, toast } from '@/shared/ui';
import { InlineNotice } from '@/shared/states';
import { RATE_COMMENT_MAX, useRateOrder } from '../hooks/use-rate-order';
import { formatOrderNo } from '../orders.format';
import type { OrderDetail } from '../data/models/order-detail';
import { StarRating } from './star-rating';

export interface OrderRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail;
}

const ORDER_TAGS = ['fresh', 'packaging', 'value', 'complete', 'missing'] as const;
const COURIER_TAGS = ['polite', 'onTime', 'careful', 'contact'] as const;

export function OrderRatingModal({ open, onOpenChange, order }: OrderRatingModalProps) {
  const t = useTranslations('orders');
  const failureMessage = useFailureMessage();
  const rate = useRateOrder(order.id);

  const alreadyRated = order.rating !== null && order.rating > 0;
  const hasCourier = !!order.courier.name;

  const [orderStars, setOrderStars] = useState<number | null>(order.rating ?? null);
  const [courierStars, setCourierStars] = useState<number | null>(order.courierRating ?? null);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const toggle = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));

  const valid =
    orderStars !== null && orderStars > 0 && (!hasCourier || (courierStars ?? 0) > 0);
  const sending = rate.isPending;

  const submit = () => {
    if (!valid || sending) return;
    rate.mutate(
      {
        orderRating: orderStars,
        courierRating: hasCourier ? courierStars : null,
        comment: comment.trim() || null,
        tags: tags.map((tag) =>
          ORDER_TAGS.includes(tag as (typeof ORDER_TAGS)[number])
            ? t(`rating.orderTags.${tag}`)
            : t(`rating.courierTags.${tag}`),
        ),
      },
      {
        onSuccess: () => {
          toast.success({ title: t('rating.sent') });
          onOpenChange(false);
        },
        onError: (failure) => {
          toast.error({ title: t('rating.failed'), body: failureMessage(failure) });
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="l"
      title={t('rating.title')}
      description={`${formatOrderNo(order.id)}${order.storeName ? ` · ${order.storeName}` : ''}`}
      closeLabel={t('rating.close')}
      footer={
        <>
          <Button variant="soft" size="lg" onClick={() => onOpenChange(false)}>
            {t('rating.cancel')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={submit}
            disabled={!valid}
            loading={sending}
          >
            {t('rating.submit')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-7">
        {alreadyRated ? (
          <InlineNotice tone="info">{t('rating.alreadyRated')}</InlineNotice>
        ) : null}

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="m-0 text-[22px] font-extrabold text-ink">{t('rating.orderTitle')}</h3>
              <p className="m-0 text-label text-ink2">{t('rating.orderSubtitle')}</p>
            </div>
            <StarRating
              value={orderStars}
              onChange={setOrderStars}
              label={t('rating.orderTitle')}
              disabled={sending}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {ORDER_TAGS.map((tag) => (
              <Chip
                key={tag}
                selected={tags.includes(tag)}
                aria-pressed={tags.includes(tag)}
                onClick={() => toggle(tag)}
                disabled={sending}
              >
                {t(`rating.orderTags.${tag}`)}
              </Chip>
            ))}
          </div>
        </section>

        {hasCourier ? (
          <section className="flex flex-col gap-4 border-t border-line pt-7">
            <div className="flex items-center gap-4">
              <Avatar size={56} name={order.courier.name ?? ''} tone="brand" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[18px] font-bold text-ink">
                  {t('rating.courierName', { name: order.courier.name ?? '' })}
                </span>
                {order.delivery.timeMaxMinutes ? (
                  <span className="text-label text-ink2">
                    {t('rating.deliveredIn', { count: order.delivery.timeMaxMinutes })}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-[18px] font-bold text-ink">{t('rating.courierTitle')}</span>
              <StarRating
                value={courierStars}
                onChange={setCourierStars}
                label={t('rating.courierTitle')}
                disabled={sending}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {COURIER_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  selected={tags.includes(tag)}
                  aria-pressed={tags.includes(tag)}
                  onClick={() => toggle(tag)}
                  disabled={sending}
                >
                  {t(`rating.courierTags.${tag}`)}
                </Chip>
              ))}
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-2">
          <label htmlFor="order-rating-comment" className="text-label font-semibold text-ink2">
            {t('rating.commentLabel')}
          </label>
          <Textarea
            id="order-rating-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, RATE_COMMENT_MAX))}
            placeholder={t('rating.commentPlaceholder')}
            rows={4}
            maxLength={RATE_COMMENT_MAX}
            disabled={sending}
          />
          <span className="self-end text-caption text-ink3">
            {comment.length}/{RATE_COMMENT_MAX}
          </span>
        </section>
      </div>
    </Modal>
  );
}
