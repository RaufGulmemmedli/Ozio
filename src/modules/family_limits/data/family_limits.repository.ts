/**
 * The only thing the family_limits hooks import.
 *
 * Written as if a real backend were already behind it: `Result<DomainModel>` out, parsers that
 * never throw, no money arithmetic.
 */
import { ok, type Result } from '@/core/network';

import { familyLimitsRemote } from './family_limits.remote';
import {
  parseLimitMember,
  parseLimitMembers,
  type LimitDraft,
  type LimitMember,
  type LimitMembers,
} from './models/limit-member';

export interface FamilyLimitsRepository {
  members(locale: string, signal?: AbortSignal): Promise<Result<LimitMembers>>;
  member(id: string, locale: string, signal?: AbortSignal): Promise<Result<LimitMember>>;
  /** Only `enabled`, `period`, `limit` and `categories` are editable. */
  save(id: string, draft: LimitDraft, locale: string, signal?: AbortSignal): Promise<Result<LimitMember>>;
}

export const familyLimitsRepository: FamilyLimitsRepository = {
  async members(locale, signal) {
    const res = await familyLimitsRemote.members(locale, signal);
    if (!res.ok) return res;
    return ok(parseLimitMembers(res.value.data));
  },

  async member(id, locale, signal) {
    const res = await familyLimitsRemote.member(id, locale, signal);
    if (!res.ok) return res;
    return ok(parseLimitMember(res.value.data));
  },

  async save(id, draft, locale, signal) {
    const res = await familyLimitsRemote.save(id, draft, locale, signal);
    if (!res.ok) return res;
    return ok(parseLimitMember(res.value.data));
  },
};
