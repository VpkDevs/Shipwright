import { authOptions } from "@/lib/auth";
import { createLogger, generateRequestId } from "@/lib/logger";
import { getOrCreateCustomer, stripe } from "@/lib/stripe";
import { withErrorHandler } from "@/lib/with-error-handler";
import { getServerSession } from "next-auth";

export const POST = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();
  const logger = createLogger({
    requestId,
    route: "POST /api/stripe/portal",
  });

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    logger.warn("Unauthorized portal request");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const name = session.user.name || email;

  logger.info("Creating billing portal session", { email });

  try {
    const customerId = await getOrCreateCustomer(email, name);
    const origin =
      request.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/repos`,
    });

    logger.info("Billing portal session created", {
      sessionId: portalSession.id,
    });

    return Response.json({ url: portalSession.url }, { status: 200 });
  } catch (error) {
    logger.error("Failed to create billing portal session", { error });
    throw error;
  }
});
