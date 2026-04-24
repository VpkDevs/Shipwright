import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { AnalyticsEventName } from "@/lib/analytics";

export interface PersistedAnalyticsEvent {
  id: string;
  timestamp: string;
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null>;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  pathname?: string;
  requestId?: string;
}

export interface AnalyticsReadOptions {
  limit?: number;
  name?: AnalyticsEventName;
}

export function getAnalyticsStoragePath(): string {
  return (
    process.env.ANALYTICS_STORAGE_PATH ||
    path.join(process.cwd(), ".data", "analytics", "events.jsonl")
  );
}

async function ensureAnalyticsStorage(): Promise<string> {
  const filePath = getAnalyticsStoragePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  return filePath;
}

export async function appendAnalyticsEvent(event: PersistedAnalyticsEvent): Promise<void> {
  const filePath = await ensureAnalyticsStorage();
  await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
}

export async function readAnalyticsEvents(
  options: AnalyticsReadOptions = {}
): Promise<PersistedAnalyticsEvent[]> {
  const { limit = 100, name } = options;

  try {
    const contents = await readFile(getAnalyticsStoragePath(), "utf8");
    const events = contents
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as PersistedAnalyticsEvent)
      .filter((event) => (name ? event.name === name : true))
      .reverse();

    return events.slice(0, limit);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
