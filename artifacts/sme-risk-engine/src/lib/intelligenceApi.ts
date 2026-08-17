export type ProviderHealth = {
  configured: boolean;
  source: string;
  health: string;
};
export type IntelligenceProviderStatus = {
  ok: boolean;
  checkedAt: string;
  providers: ProviderStatusRecord[];
  congress: ProviderHealth & { accountConfigured: boolean };
  regulations: ProviderHealth & { accountConfigured: boolean };
  newsData: ProviderHealth;
  apiTube: ProviderHealth;
  who: ProviderHealth & { authentication: string };
};
export type ProviderStatusRecord = {
  id: string;
  name: string;
  status: "connected" | "public" | "not_configured" | "error" | "degraded";
  configured: boolean;
  authentication: "required" | "public";
  checkedAt: string;
  lastSuccessfulResponse: string | null;
  error?: string;
};
export type IntelligenceNewsItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  sourceName: string;
  provider: "newsdata.io" | "apitube";
  countries: string[];
};
export type WhoIndicator = {
  indicatorCode: string;
  indicatorName: string;
  value: number;
  displayValue: string;
  unit: string;
  country: string;
  dataYear: number;
};

export type WhoOutbreakItem = {
  id: string;
  title: string;
  publishedAt: string;
  summary: string;
  url: string;
  matchedArea: string;
  provider: "WHO Disease Outbreak News";
};
export type GdacsEventItem = {
  id: string;
  title: string;
  eventType: string;
  alertLevel: string;
  country: string;
  fromDate: string;
  toDate: string;
  url: string;
  latitude: number | null;
  longitude: number | null;
  provider: "GDACS";
};
export type UsgsEarthquakeItem = {
  id: string;
  title: string;
  place: string;
  magnitude: number | null;
  occurredAt: string;
  updatedAt: string;
  url: string;
  tsunami: boolean;
  latitude: number | null;
  longitude: number | null;
  depthKm: number | null;
  provider: "USGS Earthquake Catalog";
};
export type AorPublicSourceHealth = {
  provider: "WHO Disease Outbreak News" | "GDACS" | "USGS Earthquake Catalog";
  ok: boolean;
  itemCount: number;
  error?: string;
};
export type AorPublicIntelligenceResponse = {
  ok: true;
  source: string;
  retrievedAt: string;
  command: string;
  commandLabel: string;
  partial: boolean;
  sourceHealth: AorPublicSourceHealth[];
  outbreaks: WhoOutbreakItem[];
  disasters: GdacsEventItem[];
  earthquakes: UsgsEarthquakeItem[];
};

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    headers: { Accept: "application/json" },
    signal,
  });
  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}
function params(values: Record<string, string | number | undefined>) {
  const result = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") result.set(key, String(value));
  });
  return result;
}

export function fetchIntelligenceProviders(
  refresh = false,
  signal?: AbortSignal,
) {
  return request<IntelligenceProviderStatus>(
    `/api/intelligence/status${refresh ? "?refresh=1" : ""}`,
    signal,
  );
}
export function fetchAorPublicIntelligence(
  command: string,
  limit = 12,
  signal?: AbortSignal,
) {
  return request<AorPublicIntelligenceResponse>(
    `/api/intelligence/aor-public?${params({ command, limit })}`,
    signal,
  );
}
export function searchCongressIntelligence(
  query: string,
  limit = 20,
  signal?: AbortSignal,
) {
  return request<{
    ok: true;
    source: string;
    retrievedAt: string;
    query: string;
    items: unknown[];
  }>(`/api/intelligence/congress?${params({ q: query, limit })}`, signal);
}
export function searchRegulatoryIntelligence(
  query: string,
  agency?: string,
  limit = 20,
  signal?: AbortSignal,
) {
  return request<{
    ok: true;
    source: string;
    retrievedAt: string;
    query: string;
    items: unknown[];
  }>(
    `/api/intelligence/regulations?${params({ q: query, agency, limit })}`,
    signal,
  );
}
export function searchNewsIntelligence(
  query: string,
  country?: string,
  signal?: AbortSignal,
) {
  return request<{
    ok: true;
    source: string;
    retrievedAt: string;
    partial: boolean;
    providerHealth: Array<{
      provider: string;
      ok: boolean;
      itemCount: number;
      error?: string;
    }>;
    items: IntelligenceNewsItem[];
  }>(`/api/intelligence/news?${params({ q: query, country })}`, signal);
}
export function fetchWhoIndicators(
  country: string,
  indicators: string[] = [],
  signal?: AbortSignal,
) {
  return request<{
    ok: true;
    source: string;
    sourceUrl: string;
    retrievedAt: string;
    country: string;
    indicators: WhoIndicator[];
  }>(
    `/api/intelligence/who?${params({ country, indicators: indicators.join(",") })}`,
    signal,
  );
}
