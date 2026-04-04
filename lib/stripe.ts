import Stripe from "stripe";

/** Lazy Stripe client — only instantiated when first used */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });
  return _stripe;
}

/** @deprecated use getStripe() — kept for any direct imports */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/** Price IDs — set these in your .env.local */
export const STRIPE_PRICES = {
  /** $5 one-time Ship Credit */
  credit: process.env.STRIPE_PRICE_CREDIT || "",
  /** $15/month Pro subscription */
  pro: process.env.STRIPE_PRICE_PRO || "",
} as const;

/**
 * Retrieve or create a Stripe customer for the given GitHub user email.
 */
export async function getOrCreateCustomer(
  email: string,
  name?: string
): Promise<string> {
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }
  const customer = await stripe.customers.create({ email, name });
  return customer.id;
}

/**
 * Check whether a customer has an active Pro subscription.
 */
export async function hasActiveProSubscription(
  customerId: string
): Promise<boolean> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 10,
  });
  return subscriptions.data.some((sub) =>
    sub.items.data.some((item) => item.price.id === STRIPE_PRICES.pro)
  );
}

/**
 * Count unconsumed one-time Ship Credits for a customer.
 * We track credits via Stripe Payment Intents metadata.
 */
export async function getShipCredits(customerId: string): Promise<number> {
  const payments = await stripe.paymentIntents.list({
    customer: customerId,
    limit: 100,
  });

  let credits = 0;
  for (const pi of payments.data) {
    if (
      pi.status === "succeeded" &&
      pi.metadata?.type === "ship_credit"
    ) {
      const used = Number(pi.metadata?.used || "0");
      const qty = Number(pi.metadata?.quantity || "1");
      credits += qty - used;
    }
  }
  return Math.max(0, credits);
}

/**
 * Mark one Ship Credit as consumed for a customer.
 * Finds the oldest unused credit payment and increments its `used` counter.
 */
export async function consumeShipCredit(customerId: string): Promise<boolean> {
  const payments = await stripe.paymentIntents.list({
    customer: customerId,
    limit: 100,
  });

  for (const pi of payments.data) {
    if (
      pi.status === "succeeded" &&
      pi.metadata?.type === "ship_credit"
    ) {
      const used = Number(pi.metadata?.used || "0");
      const qty = Number(pi.metadata?.quantity || "1");
      if (used < qty) {
        await stripe.paymentIntents.update(pi.id, {
          metadata: { ...pi.metadata, used: String(used + 1) },
        });
        return true;
      }
    }
  }
  return false;
}
