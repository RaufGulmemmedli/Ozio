/**
 * The payment-method choice on OD1 (`/checkout/payment`).
 *
 * `orders/checkout` takes `payment_method: "cash" | "card"` (verified). The design also offers
 * **"Kartla qapıda"** (the courier brings a POS terminal) — that option has **no known wire value**
 * (screens/app-orders.md "Design defects"), so it is sent as `cash` (payment happens at the door,
 * not through the gateway) and the choice is kept locally so the UI can still show what the user
 * picked. Confirm with the backend before relying on it.
 */
export type PaymentMethodChoice = 'card' | 'cash' | 'cardAtDoor';

export type WirePaymentMethod = 'card' | 'cash';

export function wirePaymentMethod(choice: PaymentMethodChoice): WirePaymentMethod {
  // `cardAtDoor` has no documented value; "pay at the door" is the closest verified one.
  return choice === 'card' ? 'card' : 'cash';
}
