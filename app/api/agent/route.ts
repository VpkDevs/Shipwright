import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getOrCreateCustomer,
  hasActiveProSubscription,
  getShipCredits,
  consumeShipCredit,
} from "@/lib/stripe";
import { runOrchestrator } from "@/lib/agents/orchestrator";
import { z } from "zod";

const agentSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as { accessToken?: string }).accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Payment Gate ────────────────────────────────────────────────────────
  const user = session.user as { email?: string; name?: string; accessToken?: string };
  const email = user.email || "";

  if (!email) {
    return Response.json(
      { error: "Account email required to use AI generation. Please sign in with GitHub." },
      { status: 403 }
    );
  }

  let customerId: string;
  let isPro = false;
  let credits = 0;

  try {
    customerId = await getOrCreateCustomer(email, user.name || "");
    [isPro, credits] = await Promise.all([
      hasActiveProSubscription(customerId),
      getShipCredits(customerId),
    ]);
  } catch (err) {
    console.error("Payment check failed:", err);
    return Response.json(
      { error: "Payment verification failed. Please try again." },
      { status: 500 }
    );
  }

  const hasAccess = isPro || credits > 0;

  if (!hasAccess) {
    return Response.json(
      {
        error: "payment_required",
        message: "AI generation requires a Ship Credit ($5) or Pro subscription ($15/month).",
        plan: "none",
        credits: 0,
      },
      { status: 402 }
    );
  }

  // ── Parse Request ────────────────────────────────────────────────────────
  let owner: string;
  let repo: string;
  let description: string | undefined;

  try {
    const body = await request.json();
    ({ owner, repo, description } = agentSchema.parse(body));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request parameters" }, { status: 400 });
    }
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  // ── Run Agent ────────────────────────────────────────────────────────────
  const githubToken = user.accessToken!;
  const steps: Array<{ id: string; label: string; status: string; detail?: string }> = [];

  try {
    const result = await runOrchestrator({
      owner,
      repo,
      githubToken,
      description,
      onStep: (step) => {
        // Update or add step
        const existing = steps.find((s) => s.id === step.id);
        if (existing) {
          existing.label = step.label;
          existing.status = step.status;
          existing.detail = step.detail;
        } else {
          steps.push({ ...step });
        }
      },
    });

    // ── Consume Credit (only after successful generation) ─────────────────
    if (!isPro) {
      try {
        await consumeShipCredit(customerId);
      } catch (err) {
        // Log but don't fail — user already got their result
        console.error("Failed to consume ship credit:", err);
      }
    }

    return Response.json({
      ...result,
      steps,
      creditsRemaining: isPro ? null : Math.max(0, credits - 1),
      plan: isPro ? "pro" : "credit",
    });
  } catch (error) {
    console.error("Agent orchestrator failed:", error);
    return Response.json(
      {
        error: "AI generation failed. Please try again.",
        steps,
      },
      { status: 500 }
    );
  }
}
