import { fetchJson, isoNow, record, text } from "../lib/upstream";

const BASE = "https://api.congress.gov/v3";
const TOPICS = [
  "defense",
  "dod",
  "ndaa",
  "appropriations",
  "defense contractors",
  "deployment",
  "occupational health",
];

function credentials() {
  return {
    key: process.env.CONGRESS_GOV_API_KEY?.trim(),
    accountId: process.env.CONGRESS_GOV_ACCOUNT_ID?.trim(),
  };
}

export function getCongressStatus() {
  const auth = credentials();
  return {
    configured: Boolean(auth.key),
    accountConfigured: Boolean(auth.accountId),
    source: "Congress.gov API v3",
    health: auth.key ? "configured" : "not_configured",
    topics: TOPICS,
  };
}

export async function searchCongress(query: string, limit: number) {
  const { key } = credentials();
  if (!key) throw new Error("Congress.gov is not configured on the server.");
  const url = new URL(`${BASE}/bill`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(Math.min(limit, 50)));
  url.searchParams.set("sort", "updateDate+desc");
  // Congress.gov accepts a free-text query parameter; presets keep this route focused.
  url.searchParams.set("query", query);
  const payload = record(await fetchJson("Congress.gov", url));
  const bills = Array.isArray(payload.bills) ? payload.bills : [];
  return {
    source: "Congress.gov API v3",
    retrievedAt: isoNow(),
    query,
    items: bills
      .map((raw) => {
        const bill = record(raw);
        const latest = record(bill.latestAction);
        return {
          congress: Number(bill.congress) || null,
          number: text(bill.number),
          type: text(bill.type),
          title: text(bill.title),
          url: text(bill.url),
          updateDate: text(bill.updateDate),
          latestAction: text(latest.text),
          latestActionDate: text(latest.actionDate),
        };
      })
      .filter((bill) => bill.title && bill.number),
  };
}
