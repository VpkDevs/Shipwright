import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Get or create the Stripe instance
 * Lazy-loads to allow env var to be set during testing
 */
function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeInstance = new Stripe(stripeSecretKey);
  }
  return stripeInstance;
}

export const stripe = new Proxy(new Stripe("sk_test_"), {
  get(_target, prop) {
    return Reflect.get(getStripeInstance(), prop);
  },
}) as Stripe;

/**
 * Stripe price IDs for different plan tiers
 * These must be created in the Stripe dashboard
 */
export const STRIPE_PRICES = {
  /** One-time ship credit ($5) */
  credit: process.env.STRIPE_PRICE_CREDIT || "",
  /** Monthly pro subscription ($15/mo) */
  pro: process.env.STRIPE_PRICE_PRO || "",
  /** Annual pro subscription ($150/yr) */
  proAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
  /** Team subscription ($250/mo) */
  team: process.env.STRIPE_PRICE_TEAM || "",
};

/**
 * Get or create a Stripe customer for the given email/name
 * Idempotent: returns existing customer if one already exists
 */
export async function getOrCreateCustomer(email: string, name: string): Promise<string> {
  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
  });

  return customer.id;
}

/**
 * Get remaining ship credits for a customer
 * Stores credits in customer metadata as "ship_credits"
 */
export async function getShipCredits(customerId: string): Promise<number> {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    return 0;
  }
  const credits = customer.metadata?.ship_credits;
  return credits ? Number.parseInt(credits, 10) : 0;
}

/**
 * Consume one ship credit from a customer
 * Returns the new credit count
 */
export async function consumeShipCredit(customerId: string): Promise<number> {
  const currentCredits = await getShipCredits(customerId);
  const newCredits = Math.max(0, currentCredits - 1);

  await stripe.customers.update(customerId, {
    metadata: {
      ship_credits: String(newCredits),
    },
  });

  return newCredits;
}

/**
 * Add ship credits to a customer
 * Used after successful payment
 */
export async function addShipCredits(customerId: string, amount: number): Promise<number> {
  const currentCredits = await getShipCredits(customerId);
  const newCredits = currentCredits + amount;

  await stripe.customers.update(customerId, {
    metadata: {
      ship_credits: String(newCredits),
    },
  });

  return newCredits;
}

/**
 * Check if a customer has an active pro or team subscription
 */
export async function hasActiveProSubscription(customerId: string): Promise<boolean> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 100,
  });

  // Check if any subscription is for a pro or team plan
  return subscriptions.data.some((sub) => {
    return sub.items.data.some((item) => {
      const priceId = item.price.id;
      return (
        priceId === STRIPE_PRICES.pro ||
        priceId === STRIPE_PRICES.proAnnual ||
        priceId === STRIPE_PRICES.team
      );
    });
  });
}

/**
 * Get the expiry date of a customer's pro subscription
 * Returns ISO date string or undefined if no active subscription
 */
export async function getProSubscriptionExpiry(customerId: string): Promise<string | undefined> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 100,
  });

  const proSubscription = subscriptions.data.find((sub) => {
    return sub.items.data.some((item) => {
      const priceId = item.price.id;
      return (
        priceId === STRIPE_PRICES.pro ||
        priceId === STRIPE_PRICES.proAnnual ||
        priceId === STRIPE_PRICES.team
      );
    });
  });

  if (proSubscription) {
    const currentPeriodEnd = (proSubscription as any).current_period_end;
    if (currentPeriodEnd) {
      return new Date(currentPeriodEnd * 1000).toISOString();
    }
  }

  return undefined;
}
