import type { ONetJob } from '@/lib/onetJobDatabase';

export type LiveOccupationMatch = {
  title: string;
  code: string;
  href?: string;
};

export type IntelligenceStatus = {
  ok: boolean;
  onet: { configured: boolean; source: string };
  bls: { configured: boolean; authMode: string; source: string; note: string };
  osha: { importEnabled: boolean; dataDirConfigured: boolean; note: string };
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
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

  if (!response.ok) {
    const message = asString(payload.error, `Request failed (${response.status}).`);
    throw new Error(message);
  }

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
    },
    bls: {
      configured: asBoolean(bls.configured),
      authMode: asString(bls.authMode, 'public'),
      source: asString(bls.source, 'BLS'),
      note: asString(bls.note),
    },
    osha: {
      importEnabled: asBoolean(osha.importEnabled),
      dataDirConfigured: asBoolean(osha.dataDirConfigured),
      note: asString(osha.note),
    },
  };
}

export async function searchLiveOccupations(query: string): Promise<LiveOccupationMatch[]> {
  const payload = await json(`/api/occupations/search?q=${encodeURIComponent(query)}`);
  const results = Array.isArray(payload.results) ? payload.results : [];

  return results
    .map((item) => {
      const record = asRecord(item);
      return {
        title: asString(record.title),
        code: asString(record.code),
        href: asString(record.href) || undefined,
      };
    })
    .filter((item) => item.title && item.code);
}

export async function fetchLiveOccupation(code: string): Promise<ONetJob & { source?: string; description?: string; safetyContext?: string[] }> {
  const payload = await json(`/api/occupations/${encodeURIComponent(code)}`);
  const profile = asRecord(payload.profile);
  const socCode = asString(profile.socCode, code);
  const title = asString(profile.title);

  if (!title || !socCode) {
    throw new Error('The live occupation service returned an incomplete occupation profile.');
  }

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
