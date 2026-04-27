import { authOptions } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import {
  getOrCreateCustomer,
  getProSubscriptionExpiry,
  getShipCredits,
  hasActiveProSubscription,
} from "@/lib/stripe";
import { withErrorHandler } from "@/lib/with-error-handler";
import type { PaymentStatus } from "@/types";
import { getServerSession } from "next-auth";

const logger = createLogger({ route: "GET /api/credits" });

export const GET = withErrorHandler(async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    logger.warn("Unauthorized credits request");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const name = session.user.name || email;

  logger.info("Fetching payment status", { email });

  try {
    const customerId = await getOrCreateCustomer(email, name);
    const credits = await getShipCredits(customerId);
    const hasPro = await hasActiveProSubscription(customerId);
    const proExpiresAt = hasPro ? await getProSubscriptionExpiry(customerId) : undefined;

    const plan: "none" | "credit" | "pro" = hasPro ? "pro" : credits > 0 ? "credit" : "none";

    const response: PaymentStatus = {
      plan,
      credits,
      proExpiresAt,
      stripeCustomerId: customerId,
    };

    logger.info("Payment status retrieved", { plan, credits, hasPro });

    return Response.json(response, { status: 200 });
  } catch (error) {
    logger.error("Failed to fetch payment status", { error });
    throw error;
  }
});
