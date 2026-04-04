import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, getOrCreateCustomer } from "@/lib/stripe";
import { createLogger, generateRequestId } from "@/lib/logger";

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const logger = createLogger({
    requestId,
    route: "POST /api/stripe/portal",
  });

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    logger.warn("Unauthorized Stripe portal request");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user as { email?: string; name?: string };
    const email = user.email || "";

    if (!email) {
      return Response.json({ error: "User email required" }, { status: 400 });
    }

    const customerId = await getOrCreateCustomer(email, user.name || "");
    const origin =
      request.headers.get("origin") ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/repos`,
    });

    logger.info("Created Stripe billing portal session", {
      customerId,
      email,
    });

    return Response.json({ url: portalSession.url });
  } catch (error) {
    logger.error("Stripe portal error", undefined, error);
    return Response.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
