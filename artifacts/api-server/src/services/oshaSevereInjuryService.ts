import { extractZipFile } from "./zipSpreadsheet";

const LANDING_URL = "https://www.osha.gov/severe-injury-reports";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 25_000;

type SirRow = {
  naics: string;
  event: string;
  source: string;
  nature: string;
  bodyPart: string;
  hospitalized: number;
  amputations: number;
  eyeLoss: number;
};

type SirCache = {
  expiresAt: number;
  downloadUrl: string;
  coverage: string;
  rows: SirRow[];
};

let cache: SirCache | null = null;

function decodeHtml(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function fetchWithTimeout(url: string, accept: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { Accept: accept, "User-Agent": "ExamReviewerToolkit/1.0 OSHA-severe-injury-context" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function currentDownload(): Promise<{ url: string; coverage: string }> {
  const response = await fetchWithTimeout(LANDING_URL, "text/html");
  if (!response.ok) throw new Error(`OSHA Severe Injury Dashboard returned ${response.status}.`);
  const html = await response.text();
  const link = html.match(/href=["']([^"']+\.zip)["'][^>]*>\s*(?:<[^>]+>\s*)*Download the full SIR data set/i)
    ?? html.match(/href=["']([^"']+\.zip)["']/i);
  if (!link) throw new Error("OSHA dashboard did not expose the current full SIR download link.");
  const coverage = html.match(/Data from\s*([^)<]+(?:through|to)[^)<]+)/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "Current published OSHA SIR coverage";
  return { url: new URL(decodeHtml(link[1]), LANDING_URL).toString(), coverage };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = "";
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const exact = headers.indexOf(candidate);
    if (exact >= 0) return exact;
  }
  for (let index = 0; index < headers.length; index += 1) {
    if (candidates.some((candidate) => headers[index].includes(candidate))) return index;
  }
  return -1;
}

function numberValue(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : /yes|true/i.test(value) ? 1 : 0;
}

function parseSirRows(csv: string): SirRow[] {
  const raw = parseCsv(csv);
  if (raw.length < 2) throw new Error("OSHA SIR CSV did not contain data rows.");
  const headers = raw[0].map(normalizeHeader);
  const column = {
    naics: findColumn(headers, ["primarynaics", "naicscode", "naics"]),
    event: findColumn(headers, ["eventtitle", "eventorexposure", "eventexposure", "event"]),
    source: findColumn(headers, ["sourcetitle", "primarysource", "source"]),
    nature: findColumn(headers, ["naturetitle", "natureofinjury", "nature"]),
    bodyPart: findColumn(headers, ["bodyparttitle", "partofbodyaffected", "partofbody", "bodypart"]),
    hospitalized: findColumn(headers, ["hospitalized", "hospitalization", "hospitalizations"]),
    amputations: findColumn(headers, ["amputations", "amputation"]),
    eyeLoss: findColumn(headers, ["lossofeye", "eyeloss", "lossesofeye"]),
  };
  if (column.naics < 0) throw new Error("OSHA SIR CSV did not contain a recognizable NAICS column.");

  return raw.slice(1).map((values) => ({
    naics: values[column.naics]?.trim() ?? "",
    event: column.event >= 0 ? values[column.event]?.trim() ?? "" : "",
    source: column.source >= 0 ? values[column.source]?.trim() ?? "" : "",
    nature: column.nature >= 0 ? values[column.nature]?.trim() ?? "" : "",
    bodyPart: column.bodyPart >= 0 ? values[column.bodyPart]?.trim() ?? "" : "",
    hospitalized: column.hospitalized >= 0 ? numberValue(values[column.hospitalized]) : 0,
    amputations: column.amputations >= 0 ? numberValue(values[column.amputations]) : 0,
    eyeLoss: column.eyeLoss >= 0 ? numberValue(values[column.eyeLoss]) : 0,
  })).filter((row) => row.naics);
}

async function loadSir(): Promise<SirCache> {
  if (cache && cache.expiresAt > Date.now()) return cache;
  const current = await currentDownload();
  const response = await fetchWithTimeout(current.url, "application/zip,application/octet-stream,*/*;q=0.8");
  if (!response.ok) throw new Error(`OSHA SIR download returned ${response.status}.`);
  const zip = Buffer.from(await response.arrayBuffer());
  const csvFile = extractZipFile(zip, (name) => name.toLowerCase().endsWith(".csv"));
  if (!csvFile) throw new Error("OSHA SIR ZIP did not contain a CSV file.");
  cache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    downloadUrl: current.url,
    coverage: current.coverage,
    rows: parseSirRows(csvFile.data.toString("utf8").replace(/^\uFEFF/, "")),
  };
  return cache;
}

function topValues(rows: SirRow[], pick: (row: SirRow) => string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = pick(row).replace(/\s+/g, " ").trim();
    if (!value || /^(unknown|unspecified|not reported)$/i.test(value)) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export async function getOshaIndustrySevereInjuryContext(sectors: string[]) {
  const selectedSectors = [...new Set(sectors.map((value) => value.trim()).filter((value) => /^\d{2}$/.test(value)))].slice(0, 8);
  if (!selectedSectors.length) throw new Error("At least one 2-digit NAICS sector is required.");

  const dataset = await loadSir();
  const rows = dataset.rows.filter((row) => selectedSectors.some((sector) => row.naics.startsWith(sector)));
  return {
    ok: true,
    sectors: selectedSectors,
    coverage: dataset.coverage,
    reportCount: rows.length,
    hospitalized: rows.reduce((sum, row) => sum + row.hospitalized, 0),
    amputations: rows.reduce((sum, row) => sum + row.amputations, 0),
    eyeLoss: rows.reduce((sum, row) => sum + row.eyeLoss, 0),
    topEvents: topValues(rows, (row) => row.event),
    topSources: topValues(rows, (row) => row.source),
    topNatures: topValues(rows, (row) => row.nature),
    topBodyParts: topValues(rows, (row) => row.bodyPart),
    source: {
      agency: "Occupational Safety and Health Administration",
      landingPage: LANDING_URL,
      downloadUrl: dataset.downloadUrl,
    },
    caveat: "OSHA Severe Injury Reports cover reportable hospitalizations, amputations, and eye losses under federal OSHA jurisdiction; they exclude State Plan jurisdiction incidents and fatalities. This is industry-sector context, not occupation-specific incidence.",
  };
}
