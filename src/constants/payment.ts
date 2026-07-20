/**
 * Temporary development mock payment amount (in pence / minor units).
 *
 * TODO: Remove this constant once the backend exposes schedule.paymentAmount.
 *
 * The UI automatically prefers (in order):
 *   1. schedule.paymentAmount  — future backend field (pence)
 *   2. schedule.estimatedAmount — existing backend field (pounds → converted to pence)
 *   3. MOCK_PAYMENT_AMOUNT     — this constant (pence, for dev/testing only)
 *
 * 50000 = £500.00
 */
export const MOCK_PAYMENT_AMOUNT = 50000;

/**
 * Resolves the correct payment amount (in pence) for a schedule.
 *
 * Priority:
 *   schedule.paymentAmount (pence) → schedule.estimatedAmount (£ × 100) → MOCK_PAYMENT_AMOUNT
 *
 * Once the backend returns schedule.paymentAmount, this function will use it
 * automatically with no further changes required.
 */
export const resolvePaymentAmount = (schedule: {
  paymentAmount?: number | null;
  estimatedAmount?: number | null;
} | null | undefined): number => {
  if (schedule?.paymentAmount != null) {
    return schedule.paymentAmount; // already in pence
  }
  if (schedule?.estimatedAmount != null && schedule.estimatedAmount > 0) {
    return Math.round(schedule.estimatedAmount * 100); // £ → pence
  }
  return MOCK_PAYMENT_AMOUNT;
};
