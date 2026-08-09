const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

function apiKey(): string | undefined {
  return process.env.BLS_API_KEY?.trim() || undefined;
}

export function getBlsStatus() {
  return {
    configured: Boolean(apiKey()),
    authMode: apiKey() ? "registered-v2" : "public-v1",
    source: "U.S. Bureau of Labor Statistics Public Data API",
    note: "Exact occupation-level injury rates require verified BLS series/table mappings before display.",
  };
}

export async function fetchBlsTimeseries(seriesIds: string[], startYear: number, endYear: number) {
  const uniqueSeries = [...new Set(seriesIds.map((value) => value.trim()).filter(Boolean))].slice(0, 50);
  if (!uniqueSeries.length) throw new Error("At least one BLS series ID is required.");

  const body: Record<string, unknown> = {
    seriesid: uniqueSeries,
    startyear: String(startYear),
    endyear: String(endYear),
  };

  const key = apiKey();
  if (key) body.registrationKey = key;

  const response = await fetch(BLS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`BLS request failed (${response.status}).`);
  return response.json() as Promise<unknown>;
}
