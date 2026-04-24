export type AnalyticsEventName =
  | "homepage_cta_clicked"
  | "pricing_cta_clicked"
  | "pricing_plan_selected"
  | "repo_paywall_clicked"
  | "checkout_started";

export interface AnalyticsPayload {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null | undefined>;
}

export async function trackEvent(payload: AnalyticsPayload): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const properties = {
      pathname: window.location.pathname,
      ...payload.properties,
    };

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        properties,
      }),
      keepalive: true,
    });
  } catch {
    // analytics should never block UX
  }
}
