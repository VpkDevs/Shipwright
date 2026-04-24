import { appendAnalyticsEvent, readAnalyticsEvents } from "@/lib/analytics-store";
import { authOptions } from "@/lib/auth";
import { createLogger, generateRequestId } from "@/lib/logger";
import { getClientIp } from "@/lib/rate-limit";
import { getServerSession } from "next-auth";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const analyticsEventNames = [
  "homepage_cta_clicked",
  "pricing_cta_clicked",
  "pricing_plan_selected",
  "repo_paywall_clicked",
  "checkout_started",
] as const;

const analyticsSchema = z.object({
  name: z.enum(analyticsEventNames),
  properties: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

const analyticsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  name: z.enum(analyticsEventNames).optional(),
});

export async function GET(request: Request) {
  const requestId = generateRequestId();
  const logger = createLogger({
    requestId,
    route: "GET /api/analytics",
  });

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    logger.warn("Unauthorized analytics read request");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const query = analyticsQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const events = await readAnalyticsEvents({
      limit: query.limit,
      name: query.name,
    });

    logger.info("Analytics events fetched", {
      count: events.length,
      name: query.name,
      limit: query.limit,
      user: session.user.email || "anonymous",
    });

    return Response.json({ events });
  } catch (error) {
    logger.error("Analytics read error", undefined, error);
    return Response.json({ error: "Failed to load analytics events" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const logger = createLogger({
    requestId,
    route: "POST /api/analytics",
  });

  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const payload = analyticsSchema.parse(body);
    const event = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      name: payload.name,
      properties: payload.properties,
      userEmail: session?.user?.email || "anonymous",
      ipAddress: getClientIp(request.headers),
      userAgent: request.headers.get("user-agent") || undefined,
      pathname:
        payload.properties && typeof payload.properties.pathname === "string"
          ? payload.properties.pathname
          : undefined,
      requestId,
    };

    await appendAnalyticsEvent(event);

    logger.info("Analytics event", {
      event: payload.name,
      properties: payload.properties,
      user: event.userEmail,
      eventId: event.id,
    });

    return Response.json({ ok: true, eventId: event.id });
  } catch (error) {
    logger.error("Analytics capture error", undefined, error);
    return Response.json({ ok: false }, { status: 400 });
  }
}
