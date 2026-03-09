import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { createLogger, generateRequestId } from "@/lib/logger";

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const baseLogger = createLogger({
    requestId,
    route: "POST /api/stripe/webhook",
  });

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    baseLogger.warn("Missing stripe-signature header");
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    baseLogger.error("STRIPE_WEBHOOK_SECRET is not set");
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    baseLogger.error("Webhook signature verification failed", undefined, err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const logger = baseLogger.child({ stripeEventType: event.type });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info("Stripe checkout.session.completed", {
          customer: session.customer,
          type: session.metadata?.type,
          repo: session.metadata?.repoFullName,
          userId: session.metadata?.userId,
          amount: session.amount_total,
        });
        // Payment intent metadata is already set during checkout creation.
        // No additional DB writes needed — we query Stripe directly for credit status.
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.metadata?.type === "ship_credit") {
          logger.info("Stripe payment_intent.succeeded for ship_credit", {
            customer: pi.customer,
            userId: pi.metadata.userId,
            repo: pi.metadata.repoFullName,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        logger.info("Stripe subscription updated", {
          customer: sub.customer,
          status: sub.status,
          currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        logger.info("Stripe subscription deleted", {
          customer: sub.customer,
          status: sub.status,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logger.warn("Stripe invoice.payment_failed", {
          customer: invoice.customer,
          amount: invoice.amount_due,
        });
        break;
      }

      default:
        // Ignore unhandled event types
        logger.debug("Unhandled Stripe webhook event type");
        break;
    }

    return Response.json({ received: true });
  } catch (err) {
    logger.error("Webhook handler error", undefined, err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
