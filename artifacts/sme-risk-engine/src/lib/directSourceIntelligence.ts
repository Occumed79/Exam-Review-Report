export interface PubMedArticle {
  pmid: string;
  title: string;
  journal: string;
  year: string;
  url: string;
}

/** Search PubMed and resolve result metadata for the citation tools. */
export async function fetchPubMedArticles(
  query: string,
  maxResults = 4,
  signal?: AbortSignal,
): Promise<PubMedArticle[]> {
  const params = new URLSearchParams({ q: query, limit: String(maxResults) });
  const response = await fetch(`/api/medical/pubmed?${params}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof payload.error === "string"
        ? payload.error
        : "PubMed is unavailable.",
    );
  if (
    !payload ||
    typeof payload !== "object" ||
    !("items" in payload) ||
    !Array.isArray(payload.items)
  )
    return [];
  return payload.items.filter((item): item is PubMedArticle =>
    Boolean(
      item &&
      typeof item === "object" &&
      "pmid" in item &&
      typeof item.pmid === "string" &&
      "title" in item &&
      typeof item.title === "string" &&
      "url" in item &&
      typeof item.url === "string",
    ),
  );
}
