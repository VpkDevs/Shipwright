export type CheckoutPlan = "credit" | "pro" | "proAnnual";

export function getProCheckoutPlan(isAnnual: boolean): CheckoutPlan {
  return isAnnual ? "proAnnual" : "pro";
}
