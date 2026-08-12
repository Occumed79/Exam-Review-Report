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

export async function searchRegulations(
  query: string,
  agency: string,
  limit: number,
) {
  const { key } = credentials();
  if (!key) throw new Error("Regulations.gov is not configured on the server.");
  const url = new URL(BASE);
  url.searchParams.set("filter[searchTerm]", query);
  if (agency) url.searchParams.set("filter[agencyId]", agency.toUpperCase());
  url.searchParams.set("page[size]", String(Math.min(limit, 50)));
  url.searchParams.set("sort", "-postedDate");
  const payload = record(
    await fetchJson("Regulations.gov", url, { headers: { "X-Api-Key": key } }),
  );
  const data = Array.isArray(payload.data) ? payload.data : [];
  return {
    source: "Regulations.gov API v4",
    retrievedAt: isoNow(),
    query,
    agency: agency || null,
    items: data
      .map((raw) => {
        const item = record(raw);
        const attributes = record(item.attributes);
        return {
          id: text(item.id),
          documentType: text(attributes.documentType),
          title: text(attributes.title),
          postedDate: text(attributes.postedDate),
          agencyId: text(attributes.agencyId),
          docketId: text(attributes.docketId),
          url: text(attributes.objectId)
            ? `https://www.regulations.gov/document/${encodeURIComponent(text(attributes.objectId))}`
            : "",
        };
      })
      .filter((item) => item.id && item.title),
  };
}
