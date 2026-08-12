import { fetchJson, isoNow, record, text } from "../lib/upstream";

const BASE = "https://api.regulations.gov/v4/documents";
const TOPICS = [
  "DoD",
  "OSHA",
  "HHS",
  "occupational medicine",
  "workplace safety",
  "respiratory protection",
  "medical screening",
];

const ALLOWED_AGENCIES = new Set([
  "DOD",
  "OSHA",
  "HHS",
  "CDC",
  "DOL",
  "DOT",
  "FAA",
  "DHS",
]);

const POLICY_TERMS = [
  "defense",
  "military",
  "contractor",
  "deployment",
  "occupational",
  "workplace safety",
  "respiratory protection",
  "medical screening",
  "medical examination",
  "public health",
  "health and safety",
  "emergency response",
  "hazard",
  "exposure",
  "fitness",
];

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "command",
  "united",
  "states",
  "health",
  "security",
  "defense",
]);

function credentials() {
  return {
    key: process.env.REGULATIONS_GOV_API_KEY?.trim(),
    accountId: process.env.REGULATIONS_GOV_ACCOUNT_ID?.trim(),
  };
}

export function getRegulationsStatus() {
  const auth = credentials();
  return {
    configured: Boolean(auth.key),
    accountConfigured: Boolean(auth.accountId),
    source: "Regulations.gov API v4",
    health: auth.key ? "configured" : "not_configured",
    topics: TOPICS,
  };
}

function queryTokens(query: string) {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token)),
    ),
  );
}

function relevance(title: string, query: string) {
  const normalized = title.toLowerCase();
  const policyHits = POLICY_TERMS.filter((term) => normalized.includes(term)).length;
  const queryHits = queryTokens(query).filter((term) => normalized.includes(term)).length;
  return { policyHits, queryHits, score: policyHits + queryHits * 2 };
}

function isRecent(value: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return false;
  const cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 5);
  return date >= cutoff;
}

export async function searchRegulations(
  query: string,
  agency: string,
  limit: number,
) {
  const { key } = credentials();
  if (!key) throw new Error("Regulations.gov is not configured on the server.");

  const normalizedAgency = agency.trim().toUpperCase();
  const url = new URL(BASE);
  url.searchParams.set("filter[searchTerm]", query);
  if (normalizedAgency) url.searchParams.set("filter[agencyId]", normalizedAgency);
  url.searchParams.set("page[size]", "50");
  url.searchParams.set("sort", "-postedDate");

  const payload = record(
    await fetchJson("Regulations.gov", url, { headers: { "X-Api-Key": key } }),
  );
  const data = Array.isArray(payload.data) ? payload.data : [];

  const items = data
    .map((raw) => {
      const item = record(raw);
      const attributes = record(item.attributes);
      const id = text(item.id);
      const title = text(attributes.title);
      const agencyId = text(attributes.agencyId).toUpperCase();
      const objectId = text(attributes.objectId) || id;
      return {
        id,
        documentType: text(attributes.documentType),
        title,
        postedDate: text(attributes.postedDate),
        agencyId,
        docketId: text(attributes.docketId),
        url: objectId
          ? `https://www.regulations.gov/document/${encodeURIComponent(objectId)}`
          : "",
        relevance: relevance(title, query),
      };
    })
    .filter((item) => item.id && item.title && isRecent(item.postedDate))
    .filter((item) =>
      normalizedAgency
        ? item.agencyId === normalizedAgency
        : ALLOWED_AGENCIES.has(item.agencyId),
    )
    .filter(
      (item) =>
        item.relevance.policyHits > 0 || item.relevance.queryHits > 0,
    )
    .sort((a, b) => {
      if (b.relevance.score !== a.relevance.score) {
        return b.relevance.score - a.relevance.score;
      }
      return b.postedDate.localeCompare(a.postedDate);
    })
    .slice(0, Math.min(limit, 50))
    .map(({ relevance: _relevance, ...item }) => item);

  return {
    source: "Regulations.gov API v4",
    retrievedAt: isoNow(),
    query,
    agency: normalizedAgency || null,
    items,
  };
}
