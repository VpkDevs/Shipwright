import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, STRIPE_PRICES, getOrCreateCustomer } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  /** Accept plan type — never trust client-supplied price IDs */
  plan: z.enum(["credit", "pro"]),
  repoFullName: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
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

    // Look up price ID server-side — never trust client
    const priceId = plan === "pro" ? STRIPE_PRICES.pro : STRIPE_PRICES.credit;

    if (!priceId) {
      return Response.json(
        { error: `Stripe price not configured for plan: ${plan}` },
        { status: 500 }
      );
    }

    const customerId = await getOrCreateCustomer(email, name);
    const isSubscription = plan === "pro";
    const origin =
      request.headers.get("origin") ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${origin}/repos${
        repoFullName ? `/${repoFullName}?payment=success` : "?payment=success"
      }`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      metadata: {
        type: isSubscription ? "pro_subscription" : "ship_credit",
        quantity: "1",
        used: "0",
        repoFullName: repoFullName || "",
        userId: email,
      },
      ...(!isSubscription
        ? {
            payment_intent_data: {
              metadata: {
                type: "ship_credit",
                quantity: "1",
                used: "0",
                repoFullName: repoFullName || "",
                userId: email,
              },
            },
          }
        : {}),
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Stripe checkout error:", error);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
