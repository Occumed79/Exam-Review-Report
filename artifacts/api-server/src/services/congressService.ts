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
const BILL_TYPE_PATH: Record<string, string> = {
  hr: "house-bill",
  s: "senate-bill",
  hjres: "house-joint-resolution",
  sjres: "senate-joint-resolution",
  hconres: "house-concurrent-resolution",
  sconres: "senate-concurrent-resolution",
  hres: "house-resolution",
  sres: "senate-resolution",
};

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
  url.searchParams.set("limit", "50");
  url.searchParams.set("sort", "updateDate+desc");
  const payload = record(await fetchJson("Congress.gov", url));
  const bills = Array.isArray(payload.bills) ? payload.bills : [];
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(
      (term) =>
        term.length > 2 && !["and", "the", "for", "with"].includes(term),
    );
  return {
    source: "Congress.gov API v3",
    retrievedAt: isoNow(),
    query,
    items: bills
      .map((raw) => {
        const bill = record(raw);
        const latest = record(bill.latestAction);
        const congress = Number(bill.congress) || null;
        const type = text(bill.type).toLowerCase();
        const number = text(bill.number);
        return {
          congress,
          number,
          type: type.toUpperCase(),
          title: text(bill.title),
          url:
            congress && number && BILL_TYPE_PATH[type]
              ? `https://www.congress.gov/bill/${congress}th-congress/${BILL_TYPE_PATH[type]}/${encodeURIComponent(number)}`
              : "https://www.congress.gov/",
          updateDate: text(bill.updateDate),
          latestAction: text(latest.text),
          latestActionDate: text(latest.actionDate),
        };
      })
      .filter(
        (bill) =>
          bill.title &&
          bill.number &&
          terms.some((term) =>
            `${bill.title} ${bill.latestAction}`.toLowerCase().includes(term),
          ),
      )
      .slice(0, limit),
  };
}
