/**
 * The scripted agent.
 *
 * There is **no chat backend** (`api/mock-modules.md` §9: no endpoint, no repository, the Flutter
 * screen appends locally). So this is all there is: a greeting, a few keyword-matched answers and
 * the documented catch-all reply `supportDemoReply`. Every string carries az / ru / en.
 *
 * Nothing here claims to be a real operator — the screen's "Demo rejim" notice says so, and the
 * agent never asks for a phone number, a card number or a code (and anything of that shape the
 * user sends is masked before it is stored).
 */

export type FixtureLocale = 'az' | 'ru' | 'en';
export type Localized = Record<FixtureLocale, string>;

export const pickLocale = (value: unknown): FixtureLocale =>
  value === 'ru' || value === 'en' ? value : 'az';

export const localized = (text: Localized, locale: FixtureLocale): string => text[locale];

/** Sent once, when the thread's first message arrives. */
export const SUPPORT_GREETING: Localized = {
  az: 'Salam! Ozio dəstək xidmətidir. Sualını yaz — nümunə cavablarla kömək edim.',
  ru: 'Привет! Это поддержка Ozio. Напиши свой вопрос — отвечу демонстрационными ответами.',
  en: 'Hi! This is Ozio support. Write your question and I will help with sample answers.',
};

/** The documented catch-all (`supportDemoReply`) — the exact copy from the spec. */
export const SUPPORT_DEMO_REPLY: Localized = {
  az: 'Müraciətin üçün təşəkkür edirik! Operatorumuz tezliklə sənə cavab yazacaq.',
  ru: 'Спасибо за обращение! Наш оператор скоро вам ответит.',
  en: 'Thanks for reaching out! Our operator will reply to you shortly.',
};

export interface ScriptedReply {
  id: string;
  /** Lower-cased substrings, matched against the user's message in any of the three languages. */
  keywords: readonly string[];
  text: Localized;
}

export const SUPPORT_SCRIPT: readonly ScriptedReply[] = [
  {
    id: 'orderLate',
    keywords: ['sifariş', 'gecik', 'kuryer', 'çatdır', 'заказ', 'опазд', 'курьер', 'доставк', 'order', 'late', 'courier', 'deliver'],
    text: {
      az: 'Sifarişini yoxladım — kuryer yoldadır və çatdırılma 10–15 dəqiqə ərzində gözlənilir. Gecikmə üçün üzr istəyirik.',
      ru: 'Я проверил заказ — курьер уже в пути, доставка ожидается в течение 10–15 минут. Извините за задержку.',
      en: 'I checked your order — the courier is on the way and delivery is expected within 10–15 minutes. Sorry for the delay.',
    },
  },
  {
    id: 'bonusMissing',
    keywords: ['bonus', 'keşbek', 'kesbek', 'бонус', 'кешбэк', 'кэшбэк', 'cashback'],
    text: {
      az: 'Bonus adətən sifariş tamamlandıqdan sonra 24 saat ərzində karta yazılır. Hələ görünmürsə, sifariş nömrəsini yaz — operator yoxlayacaq.',
      ru: 'Бонус обычно начисляется на карту в течение 24 часов после завершения заказа. Если его всё ещё нет, напиши номер заказа — оператор проверит.',
      en: 'The bonus is usually credited to your card within 24 hours of the order completing. If it is still missing, send the order number and an operator will check.',
    },
  },
  {
    id: 'lottery',
    keywords: ['lotereya', 'bilet', 'tiraj', 'лотере', 'билет', 'тираж', 'lottery', 'ticket', 'draw'],
    text: {
      az: 'Biletlər hər uyğun sifarişdən sonra avtomatik verilir. Biletlərini "Lotereya" bölməsində, nəticələri isə tirajdan sonra orada görə bilərsən.',
      ru: 'Билеты выдаются автоматически после каждого подходящего заказа. Свои билеты и результаты тиража можно посмотреть в разделе «Лотерея».',
      en: 'Tickets are issued automatically after every qualifying order. You can see your tickets, and the results after the draw, in the "Lottery" section.',
    },
  },
  {
    id: 'refund',
    keywords: ['geri', 'qaytar', 'pul', 'ödəniş', 'возврат', 'верн', 'оплат', 'refund', 'money back', 'payment'],
    text: {
      az: 'Qaytarma ödənişin edildiyi karta göndərilir və bankdan asılı olaraq 3–7 iş günü çəkir. Sifariş nömrəsini yaz, izləyək.',
      ru: 'Возврат отправляется на ту же карту, которой была оплата, и занимает 3–7 рабочих дней в зависимости от банка. Напиши номер заказа — проследим.',
      en: 'A refund goes back to the card you paid with and takes 3–7 business days depending on the bank. Send the order number and we will track it.',
    },
  },
  {
    id: 'thanks',
    keywords: ['təşəkkür', 'sağ ol', 'спасибо', 'благодар', 'thanks', 'thank you'],
    text: {
      az: 'Hər zaman buradayıq! Başqa sualın olsa, yaz.',
      ru: 'Всегда рады помочь! Если будет ещё вопрос — напиши.',
      en: 'Always happy to help! Write again if anything else comes up.',
    },
  },
];

/** `mock-modules.md` keeps the demo honest: a short, human-looking pause, not instant magic. */
export const TYPING_DELAY_MS = 1_200;

/** Composer cap, so a pasted wall of text cannot be stored. */
export const MAX_MESSAGE_LENGTH = 500;

/** The scripted reply for one user message — a keyword match, else the documented catch-all. */
export function scriptedReply(text: string, locale: FixtureLocale): string {
  const needle = text.toLocaleLowerCase('en');
  for (const entry of SUPPORT_SCRIPT) {
    if (entry.keywords.some((k) => needle.includes(k))) return localized(entry.text, locale);
  }
  return localized(SUPPORT_DEMO_REPLY, locale);
}
