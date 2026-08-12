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
  const metadataUrl = new URL(`${GHO}/Indicator`);
  metadataUrl.searchParams.set(
    "$filter",
    allowed.map((item) => `IndicatorCode eq '${item}'`).join(" or "),
  );
  metadataUrl.searchParams.set("$format", "json");
  const [payloadRaw, metadataRaw] = await Promise.all([
    fetchJson("WHO GHO", url),
    fetchJson("WHO GHO", metadataUrl),
  ]);
  const payload = record(payloadRaw);
  const metadata = record(metadataRaw);
  const names = new Map(
    (Array.isArray(metadata.value) ? metadata.value : []).map((raw) => {
      const item = record(raw);
      return [text(item.IndicatorCode), text(item.IndicatorName)] as const;
    }),
  );
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
          indicatorName:
            names.get(text(value.IndicatorCode)) || text(value.IndicatorCode),
          value: Number.isFinite(Number(value.NumericValue))
            ? Number(value.NumericValue)
            : null,
          displayValue: text(value.Value),
          unit: text(value.Unit),
          country: text(value.SpatialDim) || countryCode,
          dataYear: Number(value.TimeDim) || null,
        };
      })
      .filter(
        (item) => item.indicatorCode && item.value !== null && item.dataYear,
      )
      .sort((a, b) => (b.dataYear ?? 0) - (a.dataYear ?? 0))
      .filter(
        (item, index, all) =>
          all.findIndex(
            (candidate) => candidate.indicatorCode === item.indicatorCode,
          ) === index,
      ),
  };
}
