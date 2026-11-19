/**
 * The referral domain — the honest version.
 *
 * There is **no referral API at all**. The only real datum is `ref_code` on
 * `GET v1/profile/me`, and it is **null on the live test account** (api/profile.md,
 * api/mock-modules.md §8). So:
 *
 * - `code` comes from the real `ref_code` when the server sends one, otherwise from the mock's
 *   sample code — and `codeSource` records which, so the screen can label it honestly;
 * - when neither exists, the screen is `referral-unavailable.html`, which is a **first-class
 *   state**, not an edge case: it is what a real account shows today;
 * - the invited-friends list and the reward amount are mock only. The screen spec is explicit that
 *   nothing backs them.
 */
import { asList, asObj, money, nullableStr, str } from '@/core/network';

export type InvitedStatus = 'rewarded' | 'pending';

export interface InvitedFriend {
  id: string;
  /** "Aysel M." — a display name, as the fixture sends it. */
  name: string;
  /** The avatar letter; derived here so no component slices strings. */
  initial: string;
  status: InvitedStatus;
  /** AZN earned for this invite; `0` while pending. Rendered through `useFormat().money`. */
  reward: number;
}

export interface ReferralProgramme {
  /** The sample code the mock supplies, used only when the real `ref_code` is empty. */
  sampleCode: string;
  /** AZN per successful invite, for the third step card ("İlk alışdan sonra ikinizə 3 ₼"). */
  rewardPerInvite: number;
  invited: InvitedFriend[];
}

export type CodeSource = 'profile' | 'sample';

export interface Referral {
  /** The code to show, or `''` → render `referral-unavailable.html`. */
  code: string;
  codeSource: CodeSource;
  rewardPerInvite: number;
  invited: InvitedFriend[];
  /** How many invites are drawn in the card header. */
  invitedCount: number;
}

export const EMPTY_PROGRAMME: ReferralProgramme = {
  sampleCode: '',
  rewardPerInvite: 0,
  invited: [],
};

/** First letter of the display name, uppercased. Empty name → `'?'`. */
const initialOf = (name: string): string => {
  const first = name.trim().charAt(0);
  return first ? first.toLocaleUpperCase('az-AZ') : '?';
};

export function parseReferralProgramme(data: unknown): ReferralProgramme {
  const root = asObj(data);
  return {
    sampleCode: str(root.sample_code ?? root.sampleCode).trim(),
    rewardPerInvite: money(root.reward_per_invite ?? root.rewardPerInvite),
    invited: asList(root.invited)
      .map((row, i) => {
        const o = asObj(row);
        const name = str(o.name);
        const reward = money(o.reward);
        return {
          id: str(o.id, `f${i}`),
          name,
          initial: initialOf(name),
          status: (str(o.status) === 'rewarded' || reward > 0
            ? 'rewarded'
            : 'pending') as InvitedStatus,
          reward,
        };
      })
      .filter((friend) => friend.name.length > 0),
  };
}

/** `GET v1/profile/me` → `ref_code`, trimmed. `null` on live, which is the documented case. */
export function parseRefCode(profileData: unknown): string {
  return (nullableStr(asObj(profileData).ref_code) ?? '').trim();
}

/**
 * Combines the real code with the mock programme.
 *
 * The real code always wins. When the profile has none — which is what live does today — the
 * sample code is used and `codeSource: 'sample'` tells the view to keep saying so.
 */
export function buildReferral(refCode: string, programme: ReferralProgramme): Referral {
  const real = refCode.trim();
  const code = real || programme.sampleCode;
  return {
    code,
    codeSource: real ? 'profile' : 'sample',
    rewardPerInvite: programme.rewardPerInvite,
    invited: programme.invited,
    invitedCount: programme.invited.length,
  };
}
