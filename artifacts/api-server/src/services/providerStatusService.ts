import { isoNow } from "../lib/upstream";

export type ProviderState =
  | "connected"
  | "public"
  | "not_configured"
  | "error"
  | "degraded";
export type ProviderStatus = {
  id: string;
  name: string;
  status: ProviderState;
  configured: boolean;
  authentication: "required" | "public";
  checkedAt: string;
  lastSuccessfulResponse: string | null;
  error?: string;
};
const lastSuccess = new Map<string, string>();
const TIMEOUT = 6_000;

function safeError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError")
    return "Health check timed out.";
  return error instanceof Error && /fetch failed|network/i.test(error.message)
    ? "Provider could not be reached."
    : "Provider health check failed.";
}
async function check(
  id: string,
  name: string,
  authentication: ProviderStatus["authentication"],
  configured: boolean,
  request?: () => Promise<Response>,
): Promise<ProviderStatus> {
  const checkedAt = isoNow();
  if (authentication === "required" && !configured)
    return {
      id,
      name,
      status: "not_configured",
      configured: false,
      authentication,
      checkedAt,
      lastSuccessfulResponse: lastSuccess.get(id) ?? null,
    };
  if (!request)
    return {
      id,
      name,
      status: "degraded",
      configured,
      authentication,
      checkedAt,
      lastSuccessfulResponse: lastSuccess.get(id) ?? null,
      error: "Configured; active health check is not available.",
    };
  try {
    const response = await request();
    if (!response.ok)
      return {
        id,
        name,
        status: response.status === 429 ? "degraded" : "error",
        configured,
        authentication,
        checkedAt,
        lastSuccessfulResponse: lastSuccess.get(id) ?? null,
        error:
          response.status === 429
            ? "Provider rate limit reached."
            : `Provider returned HTTP ${response.status}.`,
      };
    lastSuccess.set(id, checkedAt);
    return {
      id,
      name,
      status: authentication === "public" ? "public" : "connected",
      configured,
      authentication,
      checkedAt,
      lastSuccessfulResponse: checkedAt,
    };
  } catch (error) {
    return {
      id,
      name,
      status: "error",
      configured,
      authentication,
      checkedAt,
      lastSuccessfulResponse: lastSuccess.get(id) ?? null,
      error: safeError(error),
    };
  }
}
function get(url: string, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  return fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Exam-Reviewer/1.0",
      ...headers,
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

export async function getProviderStatuses(): Promise<ProviderStatus[]> {
  const onet =
    process.env.ONET_API_KEY?.trim() ||
    process.env.ONET_V2_API_KEY?.trim() ||
    process.env.O_NET_API_KEY?.trim();
  const congress = process.env.CONGRESS_GOV_API_KEY?.trim();
  const regulations = process.env.REGULATIONS_GOV_API_KEY?.trim();
  const news = process.env.NEWS_DATA_IO_KEY?.trim();
  const apiTube = process.env.APITUBE_NEWS_API_KEY?.trim();
  return Promise.all([
    check(
      "onet",
      "O*NET",
      "required",
      Boolean(onet),
      onet
        ? () =>
            get(
              "https://api-v2.onetcenter.org/online/search?keyword=nurse&start=1&end=1",
              { "X-API-Key": onet },
            )
        : undefined,
    ),
    check("bls", "BLS", "public", true, () =>
      get(
        "https://api.bls.gov/publicAPI/v2/timeseries/data/CEU0000000001?startyear=2024&endyear=2024",
      ),
    ),
    check("osha", "OSHA", "public", true, () =>
      get(
        "https://www.osha.gov/ords/imis/establishment.search?establishment=none",
      ),
    ),
    check("rxnorm", "RxNorm", "public", true, () =>
      get("https://rxnav.nlm.nih.gov/REST/version.json"),
    ),
    check("pubmed", "PubMed", "public", true, () =>
      get(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/einfo.fcgi?db=pubmed&retmode=json",
      ),
    ),
    check(
      "congress",
      "Congress.gov",
      "required",
      Boolean(congress),
      congress
        ? () =>
            get(
              `https://api.congress.gov/v3/bill?format=json&limit=1&api_key=${encodeURIComponent(congress)}`,
            )
        : undefined,
    ),
    check(
      "regulations",
      "Regulations.gov",
      "required",
      Boolean(regulations),
      regulations
        ? () =>
            get("https://api.regulations.gov/v4/documents?page[size]=1", {
              "X-Api-Key": regulations,
            })
        : undefined,
    ),
    check(
      "newsdata",
      "NewsData.io",
      "required",
      Boolean(news),
      news
        ? () =>
            get(
              `https://newsdata.io/api/1/latest?apikey=${encodeURIComponent(news)}&q=health`,
            )
        : undefined,
    ),
    check(
      "apitube",
      "APITube",
      "required",
      Boolean(apiTube),
      apiTube
        ? () =>
            get(
              `https://api.apitube.io/v1/news/everything?api_key=${encodeURIComponent(apiTube)}&q=health`,
            )
        : undefined,
    ),
    check("who", "WHO", "public", true, () =>
      get("https://ghoapi.azureedge.net/api/Indicator?$top=1"),
    ),
  ]);
}
