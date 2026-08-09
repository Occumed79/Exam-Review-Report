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

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof payload.error === 'string' ? payload.error : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}

export async function fetchIntelligenceStatus(): Promise<IntelligenceStatus> {
  return json<IntelligenceStatus>('/api/intelligence/status');
}

export async function searchLiveOccupations(query: string): Promise<LiveOccupationMatch[]> {
  const payload = await json<{ ok: boolean; results: LiveOccupationMatch[] }>(`/api/occupations/search?q=${encodeURIComponent(query)}`);
  return payload.results || [];
}

export async function fetchLiveOccupation(code: string): Promise<ONetJob & { source?: string; description?: string; safetyContext?: string[] }> {
  const payload = await json<{ ok: boolean; profile: ONetJob & { source?: string; description?: string; safetyContext?: string[] } }>(`/api/occupations/${encodeURIComponent(code)}`);
  return payload.profile;
}
