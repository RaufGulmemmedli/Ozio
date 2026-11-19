/**
 * `?preview=` seeds for the group_buy screens.
 *
 * `useScreenQuery` hands `seed.empty` to `?preview=empty` and `seed.data` to any other value, so
 * `?preview=expired` renders the `State · Qrupun vaxtı bitdi` panel from `gb-states.html` without
 * waiting 5 hours for a real window to close.
 *
 * These are **already-parsed domain models**, not wire rows: they stand in for a source response,
 * so like a response they carry the derived numbers rather than inviting a component to compute
 * them.
 */
import type { GroupBuyOverview, GroupDeal } from './models/group-deal';

/** A `d1`-shaped deal whose window closed one hour ago with the target unmet. */
export const PREVIEW_EXPIRED_DEAL: GroupDeal = {
  id: 'd1',
  title: 'Şəkər tozu',
  pack: '10 kq',
  iconKey: 'wheat',
  retailPrice: 18.9,
  tiers: [
    { people: 3, price: 16.6, percentOff: 12, reached: true, current: false },
    { people: 5, price: 15.1, percentOff: 20, reached: true, current: true },
    { people: 10, price: 13.6, percentOff: 28, reached: false, current: false },
  ],
  participants: [
    { name: 'Aysel', initial: 'A', isMe: false },
    { name: 'Rəşad', initial: 'R', isMe: false },
    { name: 'Leyla', initial: 'L', isMe: false },
    { name: 'Elvin', initial: 'E', isMe: false },
    { name: 'Nigar', initial: 'N', isMe: false },
    { name: 'Tural', initial: 'T', isMe: false },
  ],
  closesAt: new Date(Date.now() - 3_600_000).toISOString(),
  address: 'Nizami küç. 45, blok A',
  sameBuilding: true,
  mine: false,
  myQty: 0,
  joined: 6,
  target: 10,
  complete: false,
  missing: 4,
  progress: 0.6,
  currentPrice: 15.1,
  bestPrice: 13.6,
  discountPercent: 20,
  bestDiscountPercent: 28,
  expired: true,
  inviteLink: 'https://ozio10.az/g/d1',
};

export const PREVIEW_EXPIRED_OVERVIEW: GroupBuyOverview = {
  nearby: [PREVIEW_EXPIRED_DEAL],
  mine: [],
};
