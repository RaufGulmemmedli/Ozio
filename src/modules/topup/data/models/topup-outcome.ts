/**
 * `TopupOutcome` — what `/topup/result` renders. **MOCK, and nothing is ever charged.**
 *
 * There is no payment endpoint, so `POST /api/mock/topup/pay` answers with a *business outcome*
 * (success or declined) rather than a transport error — which is also how a real card gateway
 * behaves. The repository maps that to this union; a transport failure stays a `Failure` and the
 * screen shows `<ErrorState>` instead.
 *
 * `simulated` is always `true` here, and the success screen must say so (api/mock-modules.md §5:
 * "nothing is charged or credited; result screen must say so when `simulated` and keep showing the
 * server balance"). The real balance on the result screen therefore still comes from
 * `GET v1/profile/me` — `newBalance` below is the demo's arithmetic, labelled as such.
 */
import { asObj, money, nullableNum, str } from '@/core/network';

export interface TopupReceipt {
  /** `TP-YYYYMMDD-NNNNN`. The key `/topup/result?ref=` is driven by. */
  reference: string;
  amount: number;
  /** `null` = no fee row (see `topup-quote.ts`). */
  fee: number | null;
  /** What would have left the card. */
  total: number;
  /** The demo's "new balance", or `null`. */
  newBalance: number | null;
  /** ISO 8601 UTC. */
  createdAt: string;
  /** The card label, e.g. "Visa •••• 0092", resolved when the top-up was started. */
  cardLabel: string;
  /** Always `true` in this build — there is no real charge. */
  simulated: boolean;
}

export interface TopupFailure {
  reference: string;
  amount: number;
  cardLabel: string;
  /** A machine code the failure screen prints verbatim, e.g. `CARD_DECLINED`. */
  errorCode: string;
  /**
   * The server's own sentence, when it sent one. The view prefers its own localized copy and uses
   * this only as a fallback — mock messages are English-ish and must not leak into az/ru.
   */
  message: string;
  simulated: boolean;
}

export type TopupOutcome =
  | { status: 'success'; receipt: TopupReceipt }
  | { status: 'failed'; failure: TopupFailure };

const DEFAULT_ERROR_CODE = 'TOPUP_FAILED';

export function parseTopupOutcome(data: unknown): TopupOutcome {
  const root = asObj(data);
  const reference = str(root.reference ?? root.ref);
  const amount = money(root.amount);
  const cardLabel = str(root.card_label ?? root.cardLabel);
  const failed = str(root.status).toLowerCase() === 'failed' || root.error_code !== undefined;

  if (failed) {
    return {
      status: 'failed',
      failure: {
        reference,
        amount,
        cardLabel,
        errorCode: str(root.error_code ?? root.errorCode, DEFAULT_ERROR_CODE).toUpperCase(),
        message: str(root.message),
        simulated: true,
      },
    };
  }

  const fee = nullableNum(root.fee);
  const newBalance = nullableNum(root.new_balance ?? root.newBalance);
  return {
    status: 'success',
    receipt: {
      reference,
      amount,
      fee: fee === null ? null : money(fee),
      total: root.total === undefined || root.total === null ? amount : money(root.total),
      newBalance: newBalance === null ? null : money(newBalance),
      createdAt: str(root.created_at ?? root.createdAt),
      cardLabel,
      // Hard-wired: this module can never produce a real charge.
      simulated: true,
    },
  };
}
