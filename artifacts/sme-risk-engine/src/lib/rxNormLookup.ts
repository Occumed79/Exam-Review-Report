export type RxNormCandidate = {
  rxcui: string;
  name: string;
  score: number | null;
};

const RXNORM_BASE = 'https://rxnav.nlm.nih.gov/REST';

type RecordLike = Record<string, unknown>;

function record(value: unknown): RecordLike {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordLike : {};
}

export async function searchRxNorm(term: string, maxEntries = 8): Promise<RxNormCandidate[]> {
  const clean = term.trim();
  if (clean.length < 2) return [];

  const response = await fetch(`${RXNORM_BASE}/approximateTerm.json?term=${encodeURIComponent(clean)}&maxEntries=${maxEntries}&option=1`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`RxNorm returned ${response.status}.`);
  const payload = record(await response.json());
  const group = record(payload.approximateGroup);
  const rawCandidates = Array.isArray(group.candidate) ? group.candidate : [];

  const seen = new Set<string>();
  const candidates: RxNormCandidate[] = [];
  for (const item of rawCandidates) {
    const candidate = record(item);
    const rxcui = typeof candidate.rxcui === 'string' ? candidate.rxcui : '';
    const name = typeof candidate.name === 'string' ? candidate.name : '';
    const score = typeof candidate.score === 'string' ? Number.parseFloat(candidate.score) : null;
    if (!rxcui || !name || seen.has(rxcui)) continue;
    seen.add(rxcui);
    candidates.push({ rxcui, name, score: Number.isFinite(score) ? score : null });
  }
  return candidates.slice(0, maxEntries);
}

export function rxNormUrl(rxcui: string): string {
  return `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${encodeURIComponent(rxcui)}`;
}
