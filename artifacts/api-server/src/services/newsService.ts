import { createHash } from "node:crypto";
import { fetchJson, isoNow, record, text } from "../lib/upstream";

export type NewsItem = {
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

function keys() {
  return {
    newsdata: process.env.NEWS_DATA_IO_KEY?.trim(),
    apitube: process.env.APITUBE_NEWS_API_KEY?.trim(),
  };
}
export function getNewsStatus() {
  const key = keys();
  return {
    newsData: {
      configured: Boolean(key.newsdata),
      source: "NewsData.io",
      health: key.newsdata ? "configured" : "not_configured",
    },
    apiTube: {
      configured: Boolean(key.apitube),
      source: "APITube",
      health: key.apitube ? "configured" : "not_configured",
    },
  };
}
function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map(
          (item) =>
            text(item) || text(record(item).name) || text(record(item).code),
        )
        .filter(Boolean)
    : [];
}
function httpUrl(value: unknown) {
  const candidate = text(value);
  try {
    const url = new URL(candidate);
    return /^https?:$/.test(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}
function timestamp(value: unknown) {
  const candidate = text(value);
  if (!candidate) return "";
  const date = new Date(candidate);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString();
}
function canonicalUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ].forEach((key) => url.searchParams.delete(key));
  return url.toString().replace(/\/$/, "").toLowerCase();
}
function normalizedTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function idFor(item: Omit<NewsItem, "id">) {
  return createHash("sha256")
    .update(`${canonicalUrl(item.url)}\n${normalizedTitle(item.title)}`)
    .digest("hex")
    .slice(0, 24);
}
function newsDataItem(raw: unknown): NewsItem | null {
  const value = record(raw);
  const source = text(value.source_name) || text(value.source_id);
  const base = {
    title: text(value.title),
    description: text(value.description),
    url: httpUrl(value.link),
    imageUrl: httpUrl(value.image_url),
    publishedAt: timestamp(value.pubDate),
    sourceName: source,
    provider: "newsdata.io" as const,
    countries: strings(value.country),
  };
  return base.title && base.url ? { id: idFor(base), ...base } : null;
}
function apiTubeItem(raw: unknown): NewsItem | null {
  const value = record(raw);
  const source = record(value.source);
  const base = {
    title: text(value.title),
    description: text(value.description) || text(value.summary),
    url: httpUrl(value.href) || httpUrl(value.url),
    imageUrl: httpUrl(value.image) || httpUrl(value.image_url),
    publishedAt: timestamp(value.published_at) || timestamp(value.publishedAt),
    sourceName: text(source.name) || text(value.source),
    provider: "apitube" as const,
    countries: strings(value.countries),
  };
  return base.title && base.url ? { id: idFor(base), ...base } : null;
}

async function fromNewsData(
  query: string,
  country: string,
): Promise<NewsItem[]> {
  const key = keys().newsdata;
  if (!key) throw new Error("NewsData.io is not configured.");
  const url = new URL("https://newsdata.io/api/1/latest");
  url.searchParams.set("apikey", key);
  url.searchParams.set("q", query);
  if (country) url.searchParams.set("country", country);
  const payload = record(await fetchJson("NewsData.io", url));
  return (Array.isArray(payload.results) ? payload.results : [])
    .map(newsDataItem)
    .filter((item): item is NewsItem => Boolean(item));
}
async function fromApiTube(
  query: string,
  country: string,
): Promise<NewsItem[]> {
  const key = keys().apitube;
  if (!key) throw new Error("APITube is not configured.");
  const url = new URL("https://api.apitube.io/v1/news/everything");
  url.searchParams.set("api_key", key);
  url.searchParams.set("q", query);
  if (country) url.searchParams.set("country", country);
  const payload = record(await fetchJson("APITube", url));
  const raw = Array.isArray(payload.results)
    ? payload.results
    : Array.isArray(payload.data)
      ? payload.data
      : [];
  return raw.map(apiTubeItem).filter((item): item is NewsItem => Boolean(item));
}

export async function searchNews(query: string, country: string) {
  const providers = [
    { name: "NewsData.io", run: () => fromNewsData(query, country) },
    { name: "APITube", run: () => fromApiTube(query, country) },
  ];
  const settled = await Promise.allSettled(
    providers.map((provider) => provider.run()),
  );
  const health = settled.map((result, index) => ({
    provider: providers[index].name,
    ok: result.status === "fulfilled",
    itemCount: result.status === "fulfilled" ? result.value.length : 0,
    error:
      result.status === "rejected"
        ? result.reason instanceof Error
          ? result.reason.message
          : "Provider failed."
        : undefined,
  }));
  const byId = new Map<string, NewsItem>();
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  settled.forEach((result) => {
    if (result.status === "fulfilled")
      result.value.forEach((item) => {
        const url = canonicalUrl(item.url);
        const title = normalizedTitle(item.title);
        if (seenUrls.has(url) || seenTitles.has(title)) return;
        seenUrls.add(url);
        seenTitles.add(title);
        byId.set(item.id, item);
      });
  });
  if (!health.some((provider) => provider.ok))
    throw new Error(
      health
        .map((provider) => `${provider.provider}: ${provider.error}`)
        .join("; "),
    );
  return {
    source: "NewsData.io + APITube",
    retrievedAt: isoNow(),
    query,
    country: country || null,
    partial: health.some((provider) => !provider.ok),
    providerHealth: health,
    items: [...byId.values()].sort(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id),
    ),
  };
}
