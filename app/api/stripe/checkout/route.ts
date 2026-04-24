import { authOptions } from "@/lib/auth";
import { createLogger, generateRequestId } from "@/lib/logger";
import { STRIPE_PRICES, getOrCreateCustomer, stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { z } from "zod";

const checkoutSchema = z.object({
  /** Accept plan type — never trust client-supplied price IDs */
  plan: z.enum(["credit", "pro", "proAnnual", "team"]),
  repoFullName: z.string().optional(),
});

const PLAN_CONFIG = {
  credit: {
    priceId: STRIPE_PRICES.credit,
    mode: "payment" as const,
    type: "ship_credit",
    quantity: "1",
  },
  pro: {
    priceId: STRIPE_PRICES.pro,
    mode: "subscription" as const,
    type: "pro_subscription",
    quantity: "1",
  },
  proAnnual: {
    priceId: STRIPE_PRICES.proAnnual,
    mode: "subscription" as const,
    type: "pro_annual_subscription",
    quantity: "1",
  },
  team: {
    priceId: STRIPE_PRICES.team,
    mode: "subscription" as const,
    type: "team_subscription",
    quantity: "1",
  },
} as const;

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const logger = createLogger({
    requestId,
    route: "POST /api/stripe/checkout",
  });

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    logger.warn("Unauthorized Stripe checkout request");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { plan, repoFullName } = checkoutSchema.parse(body);

    const user = session.user as { email?: string; name?: string };
    const email = user.email || "";
    const name = user.name || "";

    if (!email) {
      return Response.json({ error: "User email required" }, { status: 400 });
    }

    const planConfig = PLAN_CONFIG[plan];
    const { priceId, mode, type, quantity } = planConfig;

    if (!priceId) {
      return Response.json(
        { error: `Stripe price not configured for plan: ${plan}` },
        { status: 500 }
      );
    }

    const customerId = await getOrCreateCustomer(email, name);
    const isSubscription = mode === "subscription";
    const origin =
      request.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${origin}/repos${
        repoFullName ? `/${repoFullName}?payment=success` : "?payment=success"
      }`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      metadata: {
        type,
        quantity,
        used: "0",
        repoFullName: repoFullName || "",
        userId: email,
        plan,
      },
      ...(!isSubscription
        ? {
            payment_intent_data: {
              metadata: {
                type,
                quantity,
                used: "0",
                repoFullName: repoFullName || "",
                userId: email,
                plan,
              },
            },
          }
        : {}),
    });

    logger.info("Created Stripe checkout session", {
      plan,
      customerId,
      email,
      repoFullName: repoFullName || undefined,
      mode,
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    logger.error("Stripe checkout error", undefined, error);
    return Response.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
