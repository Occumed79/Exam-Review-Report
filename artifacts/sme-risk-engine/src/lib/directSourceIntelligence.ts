export interface PubMedArticle {
  pmid: string;
  title: string;
  journal: string;
  year: string;
  url: string;
}

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

/** Search PubMed and resolve result metadata for the citation tools. */
export async function fetchPubMedArticles(query: string, maxResults = 4): Promise<PubMedArticle[]> {
  try {
    const encoded = encodeURIComponent(query);
    const searchResponse = await fetch(
      `${PUBMED_BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}&sort=relevance&term=${encoded}`,
    );
    if (!searchResponse.ok) return [];

    const searchData = await searchResponse.json();
    const ids: string[] = searchData?.esearchresult?.idlist || [];
    if (!ids.length) return [];

    const summaryResponse = await fetch(
      `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`,
    );
    if (!summaryResponse.ok) {
      return ids.map((pmid) => ({
        pmid,
        title: `PMID ${pmid}`,
        journal: "",
        year: "",
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      }));
    }

    const summaryData = await summaryResponse.json();
    return ids.map((pmid) => {
      const item = summaryData?.result?.[pmid];
      return {
        pmid,
        title: item?.title || `PMID ${pmid}`,
        journal: item?.source || "",
        year: item?.pubdate?.substring(0, 4) || "",
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      };
    });
  } catch {
    return [];
  }
}
