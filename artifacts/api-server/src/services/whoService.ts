import { fetchJson, isoNow, record, text } from "../lib/upstream";

const GHO = "https://ghoapi.azureedge.net/api";
const XMART = "https://xmart-api-public.who.int/";

type IndicatorDefinition = {
  name: string;
  unit: string;
  min: number;
  max: number;
};

// Keep this catalog intentionally small and medically useful. The codes below
// are WHO GHO indicator codes, not labels inferred from similarly named series.
const INDICATOR_CATALOG = {
  WHOSIS_000001: {
    name: "Life expectancy at birth",
    unit: "years",
    min: 0,
    max: 120,
  },
  WHOSIS_000002: {
    name: "Healthy life expectancy at birth",
    unit: "years",
    min: 0,
    max: 120,
  },
  WHS4_100: {
    name: "Hospital beds",
    unit: "per 10,000 population",
    min: 0,
    max: 1000,
  },
  WHS6_102: {
    name: "Medical doctors",
    unit: "per 10,000 population",
    min: 0,
    max: 1000,
  },
  UHC_INDEX_REPORTED: {
    name: "Universal health coverage service coverage index",
    unit: "index (0–100)",
    min: 0,
    max: 100,
  },
  PHE_HHAIR_PROP_POP_CLEAN_FUELS: {
    name: "Population using clean fuels and technologies for cooking",
    unit: "%",
    min: 0,
    max: 100,
  },
} as const satisfies Record<string, IndicatorDefinition>;

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

function isAggregateDimension(value: unknown) {
  const dim = text(value).trim().toUpperCase();
  if (!dim) return true;
  return (
    dim === "ALL" ||
    dim === "TOTAL" ||
    dim === "BTSX" ||
    dim === "SEX_BTSX" ||
    dim.endsWith("_TOTL") ||
    dim.endsWith("_TOTAL") ||
    dim.endsWith("_BTSX")
  );
}

function chooseLatestRow(rows: unknown[]) {
  const normalized = rows
    .map(record)
    .filter((row) => Number.isFinite(Number(row.NumericValue)) && Number(row.TimeDim))
    .sort((a, b) => Number(b.TimeDim) - Number(a.TimeDim));

  if (!normalized.length) return null;

  const latestYear = Number(normalized[0].TimeDim);
  const latest = normalized.filter((row) => Number(row.TimeDim) === latestYear);

  return (
    latest.find(
      (row) =>
        isAggregateDimension(row.Dim1) &&
        isAggregateDimension(row.Dim2) &&
        isAggregateDimension(row.Dim3),
    ) ?? latest[0]
  );
}

function displayValue(row: Record<string, unknown>, numericValue: number) {
  const formatted = text(row.Value).trim();
  return formatted || String(numericValue);
}

async function fetchIndicator(
  countryCode: string,
  indicatorCode: keyof typeof INDICATOR_CATALOG,
): Promise<NormalizedIndicator | null> {
  const url = new URL(`${GHO}/${indicatorCode}`);
  url.searchParams.set("$filter", `SpatialDim eq '${countryCode}'`);
  url.searchParams.set("$orderby", "TimeDim desc");
  url.searchParams.set("$top", "40");
  url.searchParams.set("$format", "json");

  const payload = record(await fetchJson(`WHO GHO ${indicatorCode}`, url));
  const values = Array.isArray(payload.value) ? payload.value : [];
  const row = chooseLatestRow(values);
  if (!row) return null;

  const numericValue = Number(row.NumericValue);
  const dataYear = Number(row.TimeDim);
  const catalog = INDICATOR_CATALOG[indicatorCode];

  if (
    !Number.isFinite(numericValue) ||
    !Number.isFinite(dataYear) ||
    numericValue < catalog.min ||
    numericValue > catalog.max
  ) {
    return null;
  }

  return {
    indicatorCode,
    indicatorName: catalog.name,
    value: numericValue,
    displayValue: displayValue(row, numericValue),
    unit: catalog.unit,
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
