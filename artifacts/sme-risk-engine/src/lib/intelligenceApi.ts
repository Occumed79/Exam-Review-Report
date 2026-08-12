export type ProviderHealth = {
  configured: boolean;
  source: string;
  health: string;
};
export type IntelligenceProviderStatus = {
  ok: boolean;
  congress: ProviderHealth & { accountConfigured: boolean };
  regulations: ProviderHealth & { accountConfigured: boolean };
  newsData: ProviderHealth;
  apiTube: ProviderHealth;
  who: ProviderHealth & { authentication: string };
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

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: { Accept: "application/json" },
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

export function fetchIntelligenceProviders() {
  return request<IntelligenceProviderStatus>("/api/intelligence/status");
}
export function searchCongressIntelligence(query: string, limit = 20) {
  return request<{
    ok: true;
    source: string;
    retrievedAt: string;
    query: string;
    items: unknown[];
  }>(`/api/intelligence/congress?${params({ q: query, limit })}`);
}
export function searchRegulatoryIntelligence(
  query: string,
  agency?: string,
  limit = 20,
) {
  return request<{
    ok: true;
    source: string;
    retrievedAt: string;
    query: string;
    items: unknown[];
  }>(`/api/intelligence/regulations?${params({ q: query, agency, limit })}`);
}
export function searchNewsIntelligence(query: string, country?: string) {
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
  }>(`/api/intelligence/news?${params({ q: query, country })}`);
}
export function fetchWhoIndicators(country: string, indicators: string[] = []) {
  return request<{
    ok: true;
    source: string;
    sourceUrl: string;
    retrievedAt: string;
    country: string;
    indicators: WhoIndicator[];
  }>(
    `/api/intelligence/who?${params({ country, indicators: indicators.join(",") })}`,
  );
}
