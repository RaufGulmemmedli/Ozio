/**
 * `GET v1/sliders/images` (verified) — **empty on live since at least 2026-11-12**, so the item
 * shape is unconfirmed. The parser therefore accepts every key the Flutter banner model tolerates
 * and drops a row that carries no image at all; an empty list is the *normal* state and the view
 * shows the deliberate promo-slider empty variant.
 */
import { asObj, int, nullableStr, str } from '@/core/network';

export interface HomeSlide {
  id: number | null;
  imageUrl: string | null;
  title: string | null;
  subtitle: string | null;
  /** Server-supplied deep link / url, or null when the slide is not clickable. */
  href: string | null;
}

const pick = (o: Record<string, unknown>, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

export function parseHomeSlide(raw: unknown): HomeSlide {
  const o = asObj(raw);
  const image = asObj(pick(o, ['image', 'uploads', 'upload']) ?? {});
  return {
    id: pick(o, ['id', 'slider_id', 'popup_id', 'source_id']) === undefined ? null : int(pick(o, ['id', 'slider_id', 'popup_id', 'source_id'])),
    imageUrl: nullableStr(
      pick(o, ['object_key', 'image_url', 'image', 'custom_url']) ?? pick(image, ['object_key', 'image_url', 'url']),
    ),
    title: nullableStr(pick(o, ['title', 'name', 'short_text'])),
    subtitle: nullableStr(pick(o, ['description', 'subtitle', 'text'])),
    href: nullableStr(pick(o, ['redirect_url', 'link', 'custom_url'])),
  };
}

/** Rows with no image are useless to the slider — drop them rather than render a grey box. */
export const isRenderableSlide = (slide: HomeSlide): boolean =>
  Boolean(slide.imageUrl) || Boolean(str(slide.title));
