import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getOrCreateCustomer,
  hasActiveProSubscription,
  getShipCredits,
} from "@/lib/stripe";
import type { PaymentStatus } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user as { email?: string; name?: string };
    const email = user.email || "";

    if (!email) {
      // Dev mode / no email — return no credits
      const status: PaymentStatus = { plan: "none", credits: 0 };
      return Response.json(status);
    }

    const customerId = await getOrCreateCustomer(email, user.name || "");

    const [isPro, credits] = await Promise.all([
      hasActiveProSubscription(customerId),
      getShipCredits(customerId),
    ]);

    const status: PaymentStatus = {
      plan: isPro ? "pro" : credits > 0 ? "credit" : "none",
      credits,
      stripeCustomerId: customerId,
    };

    return Response.json(status);
  } catch (error) {
    console.error("Credits check error:", error);
    // On error, return no credits (fail closed — don't give free access)
    const status: PaymentStatus = { plan: "none", credits: 0 };
    return Response.json(status);
  }
}
