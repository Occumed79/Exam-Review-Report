import type { ONetJob } from '@/lib/onetJobDatabase';

export type LiveOccupationMatch = {
  title: string;
  code: string;
  href?: string;
};

export type IntelligenceStatus = {
  ok: boolean;
  onet: {
    configured: boolean;
    source: string;
    authMode?: string;
    keyVariable?: string;
    note?: string;
  };
  bls: { configured: boolean; authMode: string; source: string; note: string; measuredTables?: boolean };
  osha: { publicSevereInjuryData: boolean; source: string; note: string };
  congress?: { configured: boolean; source: string; health: string; accountConfigured?: boolean };
  regulations?: { configured: boolean; source: string; health: string; accountConfigured?: boolean };
  newsData?: { configured: boolean; source: string; health: string };
  apiTube?: { configured: boolean; source: string; health: string };
  who?: { configured: boolean; source: string; health: string; authentication?: string };
};

export type InjuryMetric = { label: string; value: number };

export type InjuryDataset = {
  id: string;
  label: string;
  dimension: 'nature' | 'body-part' | 'source' | 'event' | 'industry' | 'fatal-event' | 'fatal-rate';
  measure: 'count' | 'rate';
  unit: string;
  referencePeriod: string;
  sourceUrl: string;
  status: 'available' | 'unavailable';
  occupation?: string;
  matchedSocCode?: string;
  matchLevel?: 'exact' | 'major-group';
  total?: number;
  top: InjuryMetric[];
  error?: string;
};

export type OccupationInjuryEvidence = {
  ok: boolean;
  requestedSocCode: string;
  normalizedSocCode: string;
  matchedOccupation: string | null;
  checkedAt: string;
  datasets: InjuryDataset[];
  suggestedNaicsSectors: string[];
  source: {
    agency: string;
    program: string;
    landingPage: string;
    fatalLandingPage: string;
  };
  caveats: string[];
};

export type OshaSevereInjuryContext = {
  ok: boolean;
  sectors: string[];
  coverage: string;
  reportCount: number;
  hospitalized: number;
  amputations: number;
  eyeLoss: number;
  topEvents: InjuryMetric[];
  topSources: InjuryMetric[];
  topNatures: InjuryMetric[];
  topBodyParts: InjuryMetric[];
  source: { agency: string; landingPage: string; downloadUrl: string };
  caveat: string;
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

async function json(url: string): Promise<JsonRecord> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();

  let payload: JsonRecord = {};
  if (body.trim()) {
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new Error(`Expected JSON from ${url}, but the server returned ${contentType || 'a non-JSON response'}.`);
    }
    try {
      payload = asRecord(JSON.parse(body));
    } catch {
      throw new Error(`The server returned invalid JSON for ${url}.`);
    }
  }

  if (!response.ok) throw new Error(asString(payload.error, `Request failed (${response.status}).`));
  return payload;
}

export async function fetchIntelligenceStatus(): Promise<IntelligenceStatus> {
  const payload = await json('/api/intelligence/status');
  const onet = asRecord(payload.onet);
  const bls = asRecord(payload.bls);
  const osha = asRecord(payload.osha);

  return {
    ok: asBoolean(payload.ok),
    onet: {
      configured: asBoolean(onet.configured),
      source: asString(onet.source, 'O*NET'),
      authMode: asString(onet.authMode) || undefined,
      keyVariable: asString(onet.keyVariable) || undefined,
      note: asString(onet.note) || undefined,
    },
    bls: {
      configured: asBoolean(bls.configured),
      authMode: asString(bls.authMode, 'public'),
      source: asString(bls.source, 'BLS'),
      note: asString(bls.note),
      measuredTables: asBoolean(bls.measuredTables),
    },
    osha: {
      publicSevereInjuryData: asBoolean(osha.publicSevereInjuryData),
      source: asString(osha.source, 'OSHA Severe Injury Reports'),
      note: asString(osha.note),
    },
  };
}

export async function searchLiveOccupations(query: string): Promise<LiveOccupationMatch[]> {
  const payload = await json(`/api/occupations/search?q=${encodeURIComponent(query)}`);
  const results = Array.isArray(payload.results) ? payload.results : [];
  return results.map((item) => {
    const record = asRecord(item);
    return { title: asString(record.title), code: asString(record.code), href: asString(record.href) || undefined };
  }).filter((item) => item.title && item.code);
}

export async function fetchLiveOccupation(code: string): Promise<ONetJob & { source?: string; description?: string; safetyContext?: string[] }> {
  const payload = await json(`/api/occupations/${encodeURIComponent(code)}`);
  const profile = asRecord(payload.profile);
  const socCode = asString(profile.socCode, code);
  const title = asString(profile.title);
  if (!title || !socCode) throw new Error('The live occupation service returned an incomplete occupation profile.');

  return {
    socCode,
    title,
    category: asString(profile.category, 'Other'),
    safetySensitive: asBoolean(profile.safetySensitive),
    physicalDemands: asStringArray(profile.physicalDemands),
    essentialFunctions: asStringArray(profile.essentialFunctions),
    cognitiveRequirements: asStringArray(profile.cognitiveRequirements),
    environmentalExposures: asStringArray(profile.environmentalExposures),
    relevantStandards: asStringArray(profile.relevantStandards),
    onetUrl: asString(profile.onetUrl, `https://www.onetonline.org/link/summary/${encodeURIComponent(socCode)}`),
    blsUrl: asString(profile.blsUrl, 'https://www.bls.gov/ooh/'),
    source: asString(profile.source) || undefined,
    description: asString(profile.description) || undefined,
    safetyContext: asStringArray(profile.safetyContext),
  };
}

function parseMetric(value: unknown): InjuryMetric | null {
  const record = asRecord(value);
  const label = asString(record.label);
  const metricValue = asNumber(record.value);
  return label && metricValue !== undefined ? { label, value: metricValue } : null;
}

function parseDataset(value: unknown): InjuryDataset | null {
  const record = asRecord(value);
  const id = asString(record.id);
  const dimension = asString(record.dimension) as InjuryDataset['dimension'];
  const measure = asString(record.measure) as InjuryDataset['measure'];
  const status = asString(record.status) as InjuryDataset['status'];
  if (!id || !['nature','body-part','source','event','industry','fatal-event','fatal-rate'].includes(dimension)) return null;
  if (!['count','rate'].includes(measure) || !['available','unavailable'].includes(status)) return null;
  const top = (Array.isArray(record.top) ? record.top : []).map(parseMetric).filter((item): item is InjuryMetric => Boolean(item));
  return {
    id,
    label: asString(record.label, id),
    dimension,
    measure,
    unit: asString(record.unit),
    referencePeriod: asString(record.referencePeriod),
    sourceUrl: asString(record.sourceUrl),
    status,
    occupation: asString(record.occupation) || undefined,
    matchedSocCode: asString(record.matchedSocCode) || undefined,
    matchLevel: ['exact','major-group'].includes(asString(record.matchLevel)) ? asString(record.matchLevel) as 'exact' | 'major-group' : undefined,
    total: asNumber(record.total),
    top,
    error: asString(record.error) || undefined,
  };
}

export async function fetchOccupationInjuryEvidence(code: string): Promise<OccupationInjuryEvidence> {
  const payload = await json(`/api/injuries/occupation/${encodeURIComponent(code)}`);
  const source = asRecord(payload.source);
  const datasets = (Array.isArray(payload.datasets) ? payload.datasets : [])
    .map(parseDataset)
    .filter((item): item is InjuryDataset => Boolean(item));
  return {
    ok: asBoolean(payload.ok),
    requestedSocCode: asString(payload.requestedSocCode, code),
    normalizedSocCode: asString(payload.normalizedSocCode, code.replace(/\.\d{2}$/, '')),
    matchedOccupation: asString(payload.matchedOccupation) || null,
    checkedAt: asString(payload.checkedAt),
    datasets,
    suggestedNaicsSectors: asStringArray(payload.suggestedNaicsSectors),
    source: {
      agency: asString(source.agency, 'U.S. Bureau of Labor Statistics'),
      program: asString(source.program, 'SOII / CFOI'),
      landingPage: asString(source.landingPage, 'https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables.htm'),
      fatalLandingPage: asString(source.fatalLandingPage, 'https://www.bls.gov/iif/fatal-injuries-tables.htm'),
    },
    caveats: asStringArray(payload.caveats),
  };
}

export async function fetchOshaSevereInjuryContext(sectors: string[]): Promise<OshaSevereInjuryContext> {
  const clean = [...new Set(sectors.filter((sector) => /^\d{2}$/.test(sector)))];
  if (!clean.length) throw new Error('No valid NAICS sectors were available for OSHA context.');
  const payload = await json(`/api/injuries/osha-severe?sectors=${encodeURIComponent(clean.join(','))}`);
  const source = asRecord(payload.source);
  const parseMetrics = (value: unknown) => (Array.isArray(value) ? value : []).map(parseMetric).filter((item): item is InjuryMetric => Boolean(item));
  return {
    ok: asBoolean(payload.ok),
    sectors: asStringArray(payload.sectors),
    coverage: asString(payload.coverage),
    reportCount: asNumber(payload.reportCount) ?? 0,
    hospitalized: asNumber(payload.hospitalized) ?? 0,
    amputations: asNumber(payload.amputations) ?? 0,
    eyeLoss: asNumber(payload.eyeLoss) ?? 0,
    topEvents: parseMetrics(payload.topEvents),
    topSources: parseMetrics(payload.topSources),
    topNatures: parseMetrics(payload.topNatures),
    topBodyParts: parseMetrics(payload.topBodyParts),
    source: {
      agency: asString(source.agency, 'Occupational Safety and Health Administration'),
      landingPage: asString(source.landingPage, 'https://www.osha.gov/severe-injury-reports'),
      downloadUrl: asString(source.downloadUrl),
    },
    caveat: asString(payload.caveat),
  };
}
