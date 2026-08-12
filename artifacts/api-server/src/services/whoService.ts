import { fetchJson, isoNow, record, text } from "../lib/upstream";

const GHO = "https://ghoapi.azureedge.net/api";
const XMART = "https://xmart-api-public.who.int/";
export const WHO_INDICATORS = [
  "WHOSIS_000001",
  "WHOSIS_000015",
  "WHS4_100",
  "WHS6_102",
  "RS_194",
  "AIR_11",
] as const;
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

export async function getWhoIndicators(country: string, indicators: string[]) {
  const selected = indicators.length ? indicators : [...WHO_INDICATORS];
  const allowed = selected
    .filter((value) => /^[A-Za-z0-9_.-]{2,80}$/.test(value))
    .slice(0, 20);
  const countryCode = country.toUpperCase();
  const filter = `SpatialDim eq '${countryCode}' and (${allowed.map((item) => `IndicatorCode eq '${item}'`).join(" or ")})`;
  const url = new URL(`${GHO}/Numeric`);
  url.searchParams.set("$filter", filter);
  url.searchParams.set("$format", "json");
  url.searchParams.set("$top", "500");
  const payload = record(await fetchJson("WHO GHO", url));
  const values = Array.isArray(payload.value) ? payload.value : [];
  return {
    source: "WHO Global Health Observatory",
    sourceUrl: GHO,
    retrievedAt: isoNow(),
    country: countryCode,
    indicators: values
      .map((raw) => {
        const value = record(raw);
        return {
          indicatorCode: text(value.IndicatorCode),
          indicatorName: text(value.IndicatorName) || text(value.IndicatorCode),
          value:
            typeof value.NumericValue === "number" ? value.NumericValue : null,
          displayValue: text(value.Value),
          unit: text(value.TimeDimensionValue) === "%" ? "%" : text(value.Unit),
          country: text(value.SpatialDim) || countryCode,
          dataYear: Number(value.TimeDim) || null,
        };
      })
      .filter(
        (item) => item.indicatorCode && item.value !== null && item.dataYear,
      )
      .sort((a, b) => (b.dataYear ?? 0) - (a.dataYear ?? 0)),
  };
}
