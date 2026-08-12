export class UpstreamError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public readonly status = 502,
  ) {
    super(message);
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchJson(
  provider: string,
  url: URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Exam-Reviewer/1.0",
        ...init.headers,
      },
    });
    if (!response.ok) {
      // Do not relay upstream bodies: they can contain credentials or provider internals.
      throw new UpstreamError(
        provider,
        `${provider} request failed (${response.status}).`,
        response.status === 429 ? 503 : 502,
      );
    }
    const contentType =
      response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("json"))
      throw new UpstreamError(
        provider,
        `${provider} returned a non-JSON response.`,
      );
    return await response.json();
  } catch (error) {
    if (error instanceof UpstreamError) throw error;
    if (error instanceof Error && error.name === "AbortError")
      throw new UpstreamError(provider, `${provider} timed out.`, 504);
    throw new UpstreamError(provider, `${provider} is unavailable.`);
  } finally {
    clearTimeout(timer);
  }
}

export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isoNow(): string {
  return new Date().toISOString();
}
