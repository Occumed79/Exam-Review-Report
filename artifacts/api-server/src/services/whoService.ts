import { fetchJson, isoNow, record, text } from "../lib/upstream";

const GHO = "https://ghoapi.azureedge.net/api";
const XMART = "https://xmart-api-public.who.int/";

const INDICATOR_CATALOG = {
  WHOSIS_000001: { name: "Life expectancy at birth", unit: "years" },
  WHOSIS_000015: { name: "Healthy life expectancy at birth", unit: "years" },
  WHS4_100: { name: "Hospital beds", unit: "per 10,000 population" },
  WHS6_102: { name: "Medical doctors", unit: "per 10,000 population" },
  RS_194: { name: "Universal health coverage service coverage index", unit: "index" },
  AIR_11: { name: "Population using clean fuels and technologies for cooking", unit: "%" },
} as const;

export const WHO_INDICATORS = Object.keys(INDICATOR_CATALOG) as Array<
  keyof typeof INDICATOR_CATALOG
>;

export function getWhoStatus() {
  return {
    configured: true,
    authentication: "public",
    health: "available_without_credentials",
    source: "WHO GHO OData and WHO xMart public APIs",
    endpoints: [GHO, XMART],
    indicators: WHO_INDICATORS,
  };
}

type NormalizedIndicator = {
  indicatorCode: string;
  indicatorName: string;
  value: number;
  displayValue: string;
  unit: string;
  country: string;
  dataYear: number;
};

function chooseLatestRow(rows: unknown[]) {
  const normalized = rows
    .map(record)
    .filter((row) => typeof row.NumericValue === "number" && Number(row.TimeDim))
    .sort((a, b) => Number(b.TimeDim) - Number(a.TimeDim));

  return (
    normalized.find((row) => {
      const dim = text(row.Dim1).toUpperCase();
      return !dim || dim === "BTSX" || dim === "SEX_BTSX";
    }) ?? normalized[0]
  );
}

async function fetchIndicator(
  countryCode: string,
  indicatorCode: keyof typeof INDICATOR_CATALOG,
): Promise<NormalizedIndicator | null> {
  const url = new URL(`${GHO}/${indicatorCode}`);
  url.searchParams.set("$filter", `SpatialDim eq '${countryCode}'`);
  url.searchParams.set("$orderby", "TimeDim desc");
  url.searchParams.set("$top", "24");
  url.searchParams.set("$format", "json");

  const payload = record(await fetchJson(`WHO GHO ${indicatorCode}`, url));
  const values = Array.isArray(payload.value) ? payload.value : [];
  const row = chooseLatestRow(values);
  if (!row) return null;

  const numericValue = Number(row.NumericValue);
  const dataYear = Number(row.TimeDim);
  if (!Number.isFinite(numericValue) || !Number.isFinite(dataYear)) return null;

  const catalog = INDICATOR_CATALOG[indicatorCode];
  return {
    indicatorCode,
    indicatorName: text(row.IndicatorName) || catalog.name,
    value: numericValue,
    displayValue: text(row.Value) || String(numericValue),
    unit: text(row.Unit) || catalog.unit,
    country: text(row.SpatialDim) || countryCode,
    dataYear,
  };
}

export async function getWhoIndicators(country: string, indicators: string[]) {
  const countryCode = country.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(countryCode)) {
    throw new Error("WHO country must be a 3-letter ISO code.");
  }

  const requested = (indicators.length ? indicators : WHO_INDICATORS)
    .filter((value): value is keyof typeof INDICATOR_CATALOG =>
      Object.prototype.hasOwnProperty.call(INDICATOR_CATALOG, value),
    )
    .slice(0, 12);

  const settled = await Promise.allSettled(
    requested.map((indicator) => fetchIndicator(countryCode, indicator)),
  );
  const values = settled.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : [],
  );

  if (!values.length && settled.some((result) => result.status === "rejected")) {
    const firstFailure = settled.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    throw firstFailure?.reason instanceof Error
      ? firstFailure.reason
      : new Error("WHO GHO returned no usable indicator data.");
  }

  return {
    source: "WHO Global Health Observatory",
    sourceUrl: GHO,
    retrievedAt: isoNow(),
    country: countryCode,
    indicators: values.sort((a, b) => b.dataYear - a.dataYear),
  };
}
