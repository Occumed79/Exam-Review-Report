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

const POLICY_TERMS = [
  "defense",
  "military",
  "armed forces",
  "national defense authorization",
  "department of defense",
  "dod",
  "ndaa",
  "defense contractor",
  "contractor",
  "deployment",
  "occupational health",
  "workplace safety",
  "medical",
  "public health",
  "emergency response",
  "disaster relief",
  "security assistance",
  "foreign assistance",
  "appropriation",
];

const QUERY_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "into",
  "command",
  "united",
  "states",
  "health",
  "security",
  "defense",
]);

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

function currentCongress() {
  const year = new Date().getUTCFullYear();
  return Math.floor((year - 1789) / 2) + 1;
}

function queryTokens(query: string) {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 3 && !QUERY_STOPWORDS.has(token)),
    ),
  );
}

function relevanceScore(title: string, latestAction: string, query: string) {
  const haystack = `${title} ${latestAction}`.toLowerCase();
  const policyHits = POLICY_TERMS.filter((term) => haystack.includes(term)).length;
  const queryHits = queryTokens(query).filter((term) => haystack.includes(term)).length;
  return { policyHits, queryHits, score: policyHits + queryHits * 2 };
}

function congressUrl(congress: number, type: string, number: string) {
  const slug: Record<string, string> = {
    HR: "house-bill",
    S: "senate-bill",
    HJRES: "house-joint-resolution",
    SJRES: "senate-joint-resolution",
    HCONRES: "house-concurrent-resolution",
    SCONRES: "senate-concurrent-resolution",
    HRES: "house-resolution",
    SRES: "senate-resolution",
  };
  const typeSlug = slug[type.toUpperCase()];
  return typeSlug
    ? `https://www.congress.gov/bill/${congress}th-congress/${typeSlug}/${encodeURIComponent(number)}`
    : "https://www.congress.gov/";
}

async function fetchBillPage(congress: number, key: string, offset: number) {
  const url = new URL(`${BASE}/bill/${congress}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "250");
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", "updateDate+desc");
  const payload = record(await fetchJson("Congress.gov", url));
  return Array.isArray(payload.bills) ? payload.bills : [];
}

export async function searchCongress(query: string, limit: number) {
  const { key } = credentials();
  if (!key) throw new Error("Congress.gov is not configured on the server.");

  // Congress.gov does not expose full-text keyword search on the bill list.
  // Read the newest 500 records from the current Congress (two API pages) and
  // apply deterministic occupational/defense relevance locally.
  const congress = currentCongress();
  const pages = await Promise.all([
    fetchBillPage(congress, key, 0),
    fetchBillPage(congress, key, 250),
  ]);
  const bills = pages.flat();

  const items = bills
    .map((raw) => {
      const bill = record(raw);
      const latest = record(bill.latestAction);
      const billCongress = Number(bill.congress) || congress;
      const number = text(bill.number);
      const type = text(bill.type);
      const title = text(bill.title);
      const latestAction = text(latest.text);
      const relevance = relevanceScore(title, latestAction, query);
      return {
        congress: billCongress,
        number,
        type,
        title,
        url: congressUrl(billCongress, type, number),
        updateDate: text(bill.updateDate),
        latestAction,
        latestActionDate: text(latest.actionDate),
        relevance,
      };
    })
    .filter((bill) => bill.title && bill.number)
    .filter(
      (bill) =>
        bill.relevance.policyHits > 0 &&
        (bill.relevance.queryHits > 0 || bill.relevance.policyHits >= 2),
    )
    .sort((a, b) => {
      if (b.relevance.score !== a.relevance.score) {
        return b.relevance.score - a.relevance.score;
      }
      return (b.updateDate || b.latestActionDate).localeCompare(
        a.updateDate || a.latestActionDate,
      );
    })
    .slice(0, Math.min(limit, 50))
    .map(({ relevance: _relevance, ...bill }) => bill);

  return {
    source: "Congress.gov API v3",
    retrievedAt: isoNow(),
    query,
    congress,
    scanned: bills.length,
    items,
  };
}
