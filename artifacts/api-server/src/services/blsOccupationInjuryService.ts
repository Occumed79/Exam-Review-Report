import { parseFirstWorksheetXlsx, type SpreadsheetCell, type SpreadsheetRow } from "./zipSpreadsheet";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20_000;
const SOC_PATTERN = /^\d{2}-\d{4}(?:\.\d{2})?$/;

export type InjuryMetric = {
  label: string;
  value: number;
};

export type InjuryDatasetResult = {
  id: string;
  label: string;
  dimension: "nature" | "body-part" | "source" | "event" | "industry" | "fatal-event" | "fatal-rate";
  measure: "count" | "rate";
  unit: string;
  referencePeriod: string;
  sourceUrl: string;
  status: "available" | "unavailable";
  occupation?: string;
  matchedSocCode?: string;
  matchLevel?: "exact" | "major-group";
  total?: number;
  top: InjuryMetric[];
  error?: string;
};

type TableDefinition = Omit<InjuryDatasetResult, "status" | "occupation" | "matchedSocCode" | "matchLevel" | "total" | "top" | "error">;

type ParsedOccupationRow = {
  occupation: string;
  socCode: string;
  metrics: InjuryMetric[];
};

type CachedTable = {
  expiresAt: number;
  rows: ParsedOccupationRow[];
};

const TABLES: TableDefinition[] = [
  {
    id: "R9",
    label: "Nonfatal cases by nature",
    dimension: "nature",
    measure: "count",
    unit: "estimated cases",
    referencePeriod: "2023-2024",
    sourceUrl: "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/case-and-demographic-characteristics-table-r9-2023-2024.xlsx",
  },
  {
    id: "R10",
    label: "Nonfatal cases by body part",
    dimension: "body-part",
    measure: "count",
    unit: "estimated cases",
    referencePeriod: "2023-2024",
    sourceUrl: "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/case-and-demographic-characteristics-table-r10-2023-2024.xlsx",
  },
  {
    id: "R11",
    label: "Nonfatal cases by source",
    dimension: "source",
    measure: "count",
    unit: "estimated cases",
    referencePeriod: "2023-2024",
    sourceUrl: "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/case-and-demographic-characteristics-table-r11-2023-2024.xlsx",
  },
  {
    id: "R12",
    label: "Nonfatal cases by event / exposure",
    dimension: "event",
    measure: "count",
    unit: "estimated cases",
    referencePeriod: "2023-2024",
    sourceUrl: "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/case-and-demographic-characteristics-table-r12-2023-2024.xlsx",
  },
  {
    id: "R44",
    label: "Nonfatal cases by industry division",
    dimension: "industry",
    measure: "count",
    unit: "estimated cases",
    referencePeriod: "2023-2024",
    sourceUrl: "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/case-and-demographic-characteristics-table-r44-2023-2024.xlsx",
  },
  {
    id: "R98",
    label: "Nonfatal rates by nature",
    dimension: "nature",
    measure: "rate",
    unit: "per 10,000 full-time workers",
    referencePeriod: "2023-2024",
    sourceUrl: "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/case-and-demographic-characteristics-table-r98-2023-2024.xlsx",
  },
  {
    id: "R100",
    label: "Nonfatal rates by event / exposure",
    dimension: "event",
    measure: "rate",
    unit: "per 10,000 full-time workers",
    referencePeriod: "2023-2024",
    sourceUrl: "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/case-and-demographic-characteristics-table-r100-2023-2024.xlsx",
  },
  {
    id: "CFOI-A5-2024",
    label: "Fatal injuries by event / exposure",
    dimension: "fatal-event",
    measure: "count",
    unit: "fatal injuries",
    referencePeriod: "2024",
    sourceUrl: "https://www.bls.gov/iif/fatal-injuries-tables/fatal-occupational-injuries-table-a-5-2024.xlsx",
  },
  {
    id: "CFOI-RATE-2024",
    label: "Fatal injury rate",
    dimension: "fatal-rate",
    measure: "rate",
    unit: "per 100,000 full-time equivalent workers",
    referencePeriod: "2024",
    sourceUrl: "https://www.bls.gov/iif/fatal-injuries-tables/fatal-occupational-injuries-hours-based-rates-2024.xlsx",
  },
];

const cache = new Map<string, CachedTable>();

function normalizeText(value: SpreadsheetCell | undefined): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
}

function normalizeSoc(code: string): string {
  const clean = code.trim();
  const match = clean.match(/^(\d{2}-\d{4})/);
  return match?.[1] ?? clean;
}

function numericValue(value: SpreadsheetCell | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const clean = value.replace(/,/g, "").trim();
  if (!clean || /^[-–—]+$/.test(clean)) return null;
  const direct = Number(clean);
  if (Number.isFinite(direct)) return direct;
  const footnoted = clean.match(/(?:\([^)]*\))?\s*(-?\d+(?:\.\d+)?)$/);
  return footnoted ? Number(footnoted[1]) : null;
}

function rowSocCell(row: SpreadsheetRow): { column: number; code: string } | null {
  for (const [column, value] of row.cells) {
    const text = normalizeText(value);
    if (SOC_PATTERN.test(text)) return { column, code: normalizeSoc(text) };
  }
  return null;
}

function headerForColumn(headerRows: SpreadsheetRow[], column: number): string {
  const parts: string[] = [];
  for (let index = headerRows.length - 1; index >= 0 && parts.length < 2; index -= 1) {
    const text = normalizeText(headerRows[index].cells.get(column));
    if (!text || text.length > 160) continue;
    if (/^(occupation|occupation code|soc code|code|number|rate)$/i.test(text)) continue;
    if (/^(table|source:|footnotes?|notes?:)/i.test(text)) continue;
    if (!parts.includes(text)) parts.push(text);
  }
  return parts.reverse().join(" — ") || `Column ${column + 1}`;
}

function parseOccupationRows(buffer: Buffer): ParsedOccupationRow[] {
  const sheetRows = parseFirstWorksheetXlsx(buffer);
  const firstDataIndex = sheetRows.findIndex((row) => rowSocCell(row));
  if (firstDataIndex < 0) throw new Error("BLS worksheet did not contain recognizable SOC rows.");

  const headerRows = sheetRows.slice(0, firstDataIndex);
  const firstSoc = rowSocCell(sheetRows[firstDataIndex]);
  if (!firstSoc) throw new Error("Unable to identify the occupation-code column.");
  const codeColumn = firstSoc.column;
  const allColumns = sheetRows.flatMap((row) => [...row.cells.keys()]);
  const maxColumn = allColumns.length ? Math.max(...allColumns) : codeColumn;
  const headers = new Map<number, string>();
  for (let column = codeColumn + 1; column <= maxColumn; column += 1) headers.set(column, headerForColumn(headerRows, column));

  const parsed: ParsedOccupationRow[] = [];
  for (const row of sheetRows.slice(firstDataIndex)) {
    const soc = rowSocCell(row);
    if (!soc) continue;
    let occupation = "";
    for (let column = soc.column - 1; column >= 0; column -= 1) {
      const text = normalizeText(row.cells.get(column));
      if (text) {
        occupation = text;
        break;
      }
    }
    if (!occupation) occupation = soc.code;

    const metrics: InjuryMetric[] = [];
    for (let column = codeColumn + 1; column <= maxColumn; column += 1) {
      const value = numericValue(row.cells.get(column));
      if (value === null) continue;
      metrics.push({ label: headers.get(column) ?? `Column ${column + 1}`, value });
    }
    parsed.push({ occupation, socCode: soc.code, metrics });
  }

  if (!parsed.length) throw new Error("BLS worksheet contained no usable occupation data rows.");
  return parsed;
}

async function fetchTable(definition: TableDefinition): Promise<ParsedOccupationRow[]> {
  const cached = cache.get(definition.id);
  if (cached && cached.expiresAt > Date.now()) return cached.rows;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(definition.sourceUrl, {
      headers: {
        Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*;q=0.8",
        "User-Agent": "ExamReviewerToolkit/1.0 occupational-injury-evidence",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`BLS table ${definition.id} returned ${response.status}.`);
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType && !contentType.includes("spreadsheet") && !contentType.includes("octet-stream")) {
      throw new Error(`BLS table ${definition.id} returned unexpected content type ${contentType}.`);
    }
    const rows = parseOccupationRows(Buffer.from(await response.arrayBuffer()));
    cache.set(definition.id, { expiresAt: Date.now() + CACHE_TTL_MS, rows });
    return rows;
  } finally {
    clearTimeout(timer);
  }
}

function findOccupationRow(rows: ParsedOccupationRow[], requestedCode: string) {
  const normalized = normalizeSoc(requestedCode);
  const exact = rows.find((row) => normalizeSoc(row.socCode) === normalized);
  if (exact) return { row: exact, matchLevel: "exact" as const };
  const majorCode = `${normalized.slice(0, 2)}-0000`;
  const major = rows.find((row) => normalizeSoc(row.socCode) === majorCode);
  return major ? { row: major, matchLevel: "major-group" as const } : null;
}

function summarizeMetrics(metrics: InjuryMetric[]) {
  const totalMetric = metrics.find((metric) => /(^|—|\s)total( rate| cases?|$)/i.test(metric.label))
    ?? metrics.find((metric) => /^total/i.test(metric.label));
  const top = metrics
    .filter((metric) => metric !== totalMetric)
    .filter((metric) => !/all other|nonclassif|not reported/i.test(metric.label))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  return { total: totalMetric?.value, top };
}

async function resolveDataset(definition: TableDefinition, requestedCode: string): Promise<InjuryDatasetResult> {
  try {
    const rows = await fetchTable(definition);
    const match = findOccupationRow(rows, requestedCode);
    if (!match) return { ...definition, status: "unavailable", top: [], error: "No matching detailed or major-group SOC row was published in this table." };
    const summary = summarizeMetrics(match.row.metrics);
    return {
      ...definition,
      status: "available",
      occupation: match.row.occupation,
      matchedSocCode: match.row.socCode,
      matchLevel: match.matchLevel,
      total: summary.total,
      top: summary.top,
    };
  } catch (error) {
    return { ...definition, status: "unavailable", top: [], error: error instanceof Error ? error.message : "Unable to load the BLS dataset." };
  }
}

const INDUSTRY_NAICS_MAP: Array<{ pattern: RegExp; sectors: string[] }> = [
  { pattern: /agriculture|forestry|fishing|hunting/i, sectors: ["11"] },
  { pattern: /mining|quarrying|oil and gas/i, sectors: ["21"] },
  { pattern: /utilities/i, sectors: ["22"] },
  { pattern: /construction/i, sectors: ["23"] },
  { pattern: /manufacturing/i, sectors: ["31", "32", "33"] },
  { pattern: /wholesale trade/i, sectors: ["42"] },
  { pattern: /retail trade/i, sectors: ["44", "45"] },
  { pattern: /transportation|warehousing/i, sectors: ["48", "49"] },
  { pattern: /information/i, sectors: ["51"] },
  { pattern: /finance|insurance/i, sectors: ["52"] },
  { pattern: /real estate|rental|leasing/i, sectors: ["53"] },
  { pattern: /professional|scientific|technical/i, sectors: ["54"] },
  { pattern: /management of companies/i, sectors: ["55"] },
  { pattern: /administrative|support|waste/i, sectors: ["56"] },
  { pattern: /educational services/i, sectors: ["61"] },
  { pattern: /health care|social assistance/i, sectors: ["62"] },
  { pattern: /arts|entertainment|recreation/i, sectors: ["71"] },
  { pattern: /accommodation|food services/i, sectors: ["72"] },
  { pattern: /other services/i, sectors: ["81"] },
  { pattern: /public administration/i, sectors: ["92"] },
];

function suggestedNaicsSectors(datasets: InjuryDatasetResult[]): string[] {
  const industry = datasets.find((dataset) => dataset.id === "R44" && dataset.status === "available");
  if (!industry) return [];
  const sectors: string[] = [];
  for (const metric of industry.top) {
    const mapping = INDUSTRY_NAICS_MAP.find(({ pattern }) => pattern.test(metric.label));
    for (const sector of mapping?.sectors ?? []) if (!sectors.includes(sector)) sectors.push(sector);
    if (sectors.length >= 6) break;
  }
  return sectors;
}

export function getBlsMeasuredInjuryStatus() {
  return {
    configured: true,
    source: "U.S. Bureau of Labor Statistics SOII/CFOI public release tables",
    referencePeriods: ["SOII 2023-2024", "CFOI 2024"],
    cacheHours: CACHE_TTL_MS / 3_600_000,
    note: "Occupation-level measured counts and rates are loaded from BLS public XLSX release tables; a BLS API key is not required for these files.",
  };
}

export async function getOccupationInjuryEvidence(socCode: string) {
  const normalized = normalizeSoc(socCode);
  if (!/^\d{2}-\d{4}$/.test(normalized)) throw new Error("Invalid SOC/O*NET-SOC code.");

  const datasets = await Promise.all(TABLES.map((definition) => resolveDataset(definition, normalized)));
  const available = datasets.filter((dataset) => dataset.status === "available");
  const matchedOccupation = available.find((dataset) => dataset.matchLevel === "exact")?.occupation ?? available[0]?.occupation ?? null;

  return {
    ok: true,
    requestedSocCode: socCode,
    normalizedSocCode: normalized,
    matchedOccupation,
    checkedAt: new Date().toISOString(),
    datasets,
    suggestedNaicsSectors: suggestedNaicsSectors(datasets),
    source: {
      agency: "U.S. Bureau of Labor Statistics",
      program: "Survey of Occupational Injuries and Illnesses / Census of Fatal Occupational Injuries",
      landingPage: "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables.htm",
      fatalLandingPage: "https://www.bls.gov/iif/fatal-injuries-tables.htm",
    },
    caveats: [
      "SOII occupation counts and rates are survey estimates and may be suppressed when publication criteria are not met.",
      "SOII case-and-demographic measures exclude work-related fatalities and have coverage limitations defined by BLS.",
      "A major-group SOC row is used only when a detailed occupation row is not published; the response labels that fallback explicitly.",
      "CFOI fatal injury counts and rates are separate from nonfatal SOII measures and should not be combined into one rate.",
    ],
  };
}
