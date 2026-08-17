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

const OPERATIONAL_TERMS = [
  "outbreak",
  "epidemic",
  "disease",
  "public health",
  "hospital",
  "healthcare",
  "medical",
  "earthquake",
  "flood",
  "wildfire",
  "hurricane",
  "typhoon",
  "cyclone",
  "tsunami",
  "drought",
  "heat wave",
  "extreme heat",
  "extreme cold",
  "disaster",
  "evacuation",
  "infrastructure",
  "transportation",
  "airport",
  "port",
  "border",
  "conflict",
  "attack",
  "strike",
  "security",
  "civil unrest",
  "protest",
  "emergency",
] as const;

const NOISE_TERMS = [
  "bitcoin",
  "cryptocurrency",
  "crypto market",
  "stock market",
  "share price",
  "celebrity",
  "fashion",
  "football",
  "basketball",
  "movie review",
  "box office",
  "gaming",
] as const;

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
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function idFor(item: Omit<NewsItem, "id">) {
  return createHash("sha256")
    .update(`${item.url.toLowerCase()}\n${item.title.toLowerCase()}`)
    .digest("hex")
    .slice(0, 24);
}

function newsDataItem(raw: unknown): NewsItem | null {
  const value = record(raw);
  const source = text(value.source_name) || text(value.source_id);
  const base = {
    title: text(value.title),
    description: text(value.description),
    url: text(value.link),
    imageUrl: text(value.image_url),
    publishedAt: text(value.pubDate),
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
    url: text(value.href) || text(value.url),
    imageUrl: text(value.image) || text(value.image_url),
    publishedAt: text(value.published_at) || text(value.publishedAt),
    sourceName: text(source.name) || text(source.domain) || text(value.source),
    provider: "apitube" as const,
    countries: strings(value.countries),
  };
  return base.title && base.url ? { id: idFor(base), ...base } : null;
}

function compactQuery(query: string) {
  return query
    .replace(/[()]/g, " ")
    .replace(/\bAND\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function queryGroups(query: string) {
  const groups = [...query.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]);
  if (groups.length < 2) return [];
  return groups.map((group) =>
    group
      .split(/\s+OR\s+/i)
      .map((part) => part.replace(/["']/g, "").trim().toLowerCase())
      .filter(Boolean),
  );
}

function eventScore(group: string[]) {
  return group.filter((term) =>
    OPERATIONAL_TERMS.some((known) => term.includes(known)),
  ).length;
}

function operationalTerms(query: string) {
  const groups = queryGroups(query);
  if (groups.length) {
    const best = [...groups].sort((a, b) => eventScore(b) - eventScore(a))[0] ?? [];
    if (eventScore(best)) return best;
  }
  const lower = query.toLowerCase();
  const matched = OPERATIONAL_TERMS.filter((term) => lower.includes(term));
  return matched.length ? [...matched] : compactQuery(query).split(/\s+/).slice(0, 8);
}

function geographyTerms(query: string) {
  const groups = queryGroups(query);
  if (!groups.length) return [];
  return [...groups].sort((a, b) => eventScore(a) - eventScore(b))[0] ?? [];
}

function newsDataQuery(query: string) {
  const terms = operationalTerms(query).slice(0, 8);
  const rendered = terms.map((term) =>
    /\s/.test(term) ? `"${term.replace(/"/g, "")}"` : term,
  );
  return (rendered.join(" OR ") || compactQuery(query)).slice(0, 500);
}

function apiTubeTitleQuery(query: string) {
  // APITube documents `title` as a comma-separated enriched search filter.
  // Do not pass the app's Boolean NewsData expression into this field.
  const terms = [...operationalTerms(query).slice(0, 9), ...geographyTerms(query).slice(0, 7)];
  return Array.from(
    new Set(
      terms
        .map((term) => term.replace(/["']/g, "").replace(/\s+/g, " ").trim())
        .filter(Boolean),
    ),
  )
    .join(",")
    .slice(0, 500);
}

function isOperationallyRelevant(item: NewsItem, query: string, country: string) {
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  if (NOISE_TERMS.some((term) => haystack.includes(term))) return false;
  if (!OPERATIONAL_TERMS.some((term) => haystack.includes(term))) return false;

  const geo = geographyTerms(query);
  if (!geo.length) return true;
  if (geo.some((term) => haystack.includes(term))) return true;
  if (
    country &&
    item.countries.some((value) => value.toLowerCase() === country.toLowerCase())
  ) {
    return true;
  }
  return false;
}

async function fromNewsData(query: string, country: string): Promise<NewsItem[]> {
  const key = keys().newsdata;
  if (!key) throw new Error("NewsData.io is not configured.");

  const run = async (q: string, titleOnly = false) => {
    const url = new URL("https://newsdata.io/api/1/latest");
    url.searchParams.set("apikey", key);
    url.searchParams.set(titleOnly ? "qInTitle" : "q", q);
    url.searchParams.set("language", "en");
    if (country) url.searchParams.set("country", country.toLowerCase());
    const payload = record(await fetchJson("NewsData.io", url));
    return (Array.isArray(payload.results) ? payload.results : [])
      .map(newsDataItem)
      .filter((item): item is NewsItem => Boolean(item));
  };

  const primary = newsDataQuery(query);
  try {
    return await run(primary);
  } catch (firstError) {
    // Some NewsData plans reject complex Boolean expressions with 422. Retry
    // with a smaller documented qInTitle OR expression, then a single term.
    const terms = operationalTerms(query);
    const fallback = terms
      .slice(0, 4)
      .map((term) => (/\s/.test(term) ? `"${term}"` : term))
      .join(" OR ");
    if (fallback && fallback !== primary) {
      try {
        return await run(fallback, true);
      } catch {
        // Continue to the simplest provider-supported request below.
      }
    }
    const single = terms[0]?.replace(/["']/g, "").trim();
    if (single) return run(single);
    throw firstError;
  }
}

async function fromApiTube(query: string, country: string): Promise<NewsItem[]> {
  const key = keys().apitube;
  if (!key) throw new Error("APITube is not configured.");
  const title = apiTubeTitleQuery(query);
  if (!title) throw new Error("APITube query did not contain usable search terms.");

  const url = new URL("https://api.apitube.io/v1/news/everything");
  url.searchParams.set("api_key", key);
  url.searchParams.set("title", title);
  url.searchParams.set("sort.by", "published_at");
  url.searchParams.set("sort.order", "desc");
  url.searchParams.set("per_page", "50");
  if (country) url.searchParams.set("source.country.code", country.toLowerCase());
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
  settled.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value
      .filter((item) => isOperationallyRelevant(item, query, country))
      .forEach((item) => {
        if (!byId.has(item.id)) byId.set(item.id, item);
      });
  });

  if (!health.some((provider) => provider.ok)) {
    throw new Error(
      health
        .map((provider) => `${provider.provider}: ${provider.error}`)
        .join("; "),
    );
  }

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
