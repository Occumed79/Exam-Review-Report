import { fetchJson, record, text } from "../lib/upstream";

const PUBMED = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const RXNORM = "https://rxnav.nlm.nih.gov/REST";

export async function searchPubMed(query: string, limit: number) {
  const searchUrl = new URL(`${PUBMED}/esearch.fcgi`);
  searchUrl.search = new URLSearchParams({
    db: "pubmed",
    retmode: "json",
    retmax: String(limit),
    sort: "relevance",
    term: query,
  }).toString();
  const search = record(await fetchJson("PubMed", searchUrl));
  const result = record(search.esearchresult);
  const ids = (Array.isArray(result.idlist) ? result.idlist : [])
    .map(text)
    .filter((id) => /^\d+$/.test(id))
    .slice(0, limit);
  if (!ids.length) return [];
  const summaryUrl = new URL(`${PUBMED}/esummary.fcgi`);
  summaryUrl.search = new URLSearchParams({
    db: "pubmed",
    retmode: "json",
    id: ids.join(","),
  }).toString();
  const summary = record(await fetchJson("PubMed", summaryUrl));
  const records = record(summary.result);
  return ids.map((pmid) => {
    const item = record(records[pmid]);
    const publicationDate = text(item.pubdate);
    return {
      pmid,
      title: text(item.title) || `PMID ${pmid}`,
      journal: text(item.fulljournalname) || text(item.source),
      year: publicationDate.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? "",
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
  });
}

export async function searchRxNorm(term: string, limit: number) {
  const url = new URL(`${RXNORM}/approximateTerm.json`);
  url.search = new URLSearchParams({
    term,
    maxEntries: String(limit),
    option: "1",
  }).toString();
  const payload = record(await fetchJson("RxNorm", url));
  const group = record(payload.approximateGroup);
  const candidates = Array.isArray(group.candidate) ? group.candidate : [];
  const seen = new Set<string>();
  return candidates
    .flatMap((raw) => {
      const item = record(raw);
      const rxcui = text(item.rxcui);
      const name = text(item.name);
      if (!/^\d+$/.test(rxcui) || !name || seen.has(rxcui)) return [];
      seen.add(rxcui);
      const parsed = Number(item.score);
      return [{ rxcui, name, score: Number.isFinite(parsed) ? parsed : null }];
    })
    .slice(0, limit);
}
