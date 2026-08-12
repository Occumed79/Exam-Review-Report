const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

function apiKey(): string | undefined {
  return process.env.BLS_API_KEY?.trim() || undefined;
}

export function getBlsStatus() {
  return {
    configured: true,
    authMode: apiKey() ? "registered-v2" : "public-release-files",
    source: "U.S. Bureau of Labor Statistics SOII/CFOI public data",
    measuredTables: true,
    note: apiKey()
      ? "Measured occupation injury tables use BLS public release files; the configured API key remains available for time-series requests."
      : "Measured occupation injury tables use BLS public release files and do not require a BLS API key.",
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  let response: Response;
  try {
    response = await fetch(BLS_API_URL, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body), signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("BLS request timed out.");
    throw new Error("BLS is temporarily unavailable.");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new Error(`BLS request failed (${response.status}).`);
  return response.json() as Promise<unknown>;
}
