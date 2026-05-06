import { useState, useEffect, useCallback } from "react";
import { SMECase, Guideline, Source } from "./types";


type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isSMECaseLike(value: unknown): value is SMECase {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.caseId === "string" &&
    typeof value.examineeName === "string" &&
    typeof value.jobTitle === "string" &&
    typeof value.status === "string"
  );
}

function isGuidelineLike(value: unknown): value is Guideline {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.sourceName === "string" &&
    typeof value.agency === "string"
  );
}

function isSourceLike(value: unknown): value is Source {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.organization === "string"
  );
}

function sanitizeImportData(data: unknown): { cases: SMECase[]; guidelines: Guideline[]; sources: Source[] } | null {
  if (!isRecord(data)) return null;

  const rawCases = Array.isArray(data.cases) ? data.cases : [];
  const rawGuidelines = Array.isArray(data.guidelines) ? data.guidelines : [];
  const rawSources = Array.isArray(data.sources) ? data.sources : [];

  const cases = rawCases.filter(isSMECaseLike);
  const guidelines = rawGuidelines.filter(isGuidelineLike);
  const sources = rawSources.filter(isSourceLike);

  if (rawCases.length && !cases.length) return null;
  if (rawGuidelines.length && !guidelines.length) return null;
  if (rawSources.length && !sources.length) return null;

  return { cases, guidelines, sources };
}
import { SAMPLE_CASES, SAMPLE_GUIDELINES, SAMPLE_SOURCES } from "./sampleData";

const KEYS = {
  cases: "sme_cases",
  guidelines: "sme_guidelines",
  sources: "sme_sources",
  initialized: "sme_initialized"
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
    return fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed", e);
  }
}

export function useStore() {
  const [cases, setCases] = useState<SMECase[]>(() => load(KEYS.cases, []));
  const [guidelines, setGuidelines] = useState<Guideline[]>(() => load(KEYS.guidelines, []));
  const [sources, setSources] = useState<Source[]>(() => load(KEYS.sources, []));

  // Initialize with sample data on first load
  useEffect(() => {
    const initialized = localStorage.getItem(KEYS.initialized);
    if (!initialized) {
      const initCases = SAMPLE_CASES;
      const initGuidelines = SAMPLE_GUIDELINES;
      const initSources = SAMPLE_SOURCES;
      save(KEYS.cases, initCases);
      save(KEYS.guidelines, initGuidelines);
      save(KEYS.sources, initSources);
      setCases(initCases);
      setGuidelines(initGuidelines);
      setSources(initSources);
      localStorage.setItem(KEYS.initialized, "true");
    }
  }, []);

  // Cases
  const saveCase = useCallback((c: SMECase) => {
    setCases(prev => {
      const exists = prev.findIndex(x => x.id === c.id);
      const updated = exists >= 0
        ? prev.map(x => x.id === c.id ? { ...c, updatedAt: new Date().toISOString() } : x)
        : [...prev, { ...c, updatedAt: new Date().toISOString() }];
      save(KEYS.cases, updated);
      return updated;
    });
  }, []);

  const deleteCase = useCallback((id: string) => {
    setCases(prev => {
      const updated = prev.filter(x => x.id !== id);
      save(KEYS.cases, updated);
      return updated;
    });
  }, []);

  const duplicateCase = useCallback((id: string) => {
    setCases(prev => {
      const original = prev.find(x => x.id === id);
      if (!original) return prev;
      const newId = `case-${Date.now()}`;
      const newCase: SMECase = {
        ...original,
        id: newId,
        caseId: `${original.caseId}-COPY`,
        examineeName: `${original.examineeName} (Copy)`,
        status: "Draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [...prev, newCase];
      save(KEYS.cases, updated);
      return updated;
    });
  }, []);

  const getCaseById = useCallback((id: string): SMECase | undefined => {
    return cases.find(x => x.id === id);
  }, [cases]);

  // Guidelines
  const saveGuideline = useCallback((g: Guideline) => {
    setGuidelines(prev => {
      const exists = prev.findIndex(x => x.id === g.id);
      const updated = exists >= 0
        ? prev.map(x => x.id === g.id ? g : x)
        : [...prev, g];
      save(KEYS.guidelines, updated);
      return updated;
    });
  }, []);

  const deleteGuideline = useCallback((id: string) => {
    setGuidelines(prev => {
      const updated = prev.filter(x => x.id !== id);
      save(KEYS.guidelines, updated);
      return updated;
    });
  }, []);

  // Sources
  const saveSource = useCallback((s: Source) => {
    setSources(prev => {
      const exists = prev.findIndex(x => x.id === s.id);
      const updated = exists >= 0
        ? prev.map(x => x.id === s.id ? s : x)
        : [...prev, s];
      save(KEYS.sources, updated);
      return updated;
    });
  }, []);

  const deleteSource = useCallback((id: string) => {
    setSources(prev => {
      const updated = prev.filter(x => x.id !== id);
      save(KEYS.sources, updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(KEYS.cases);
    localStorage.removeItem(KEYS.guidelines);
    localStorage.removeItem(KEYS.sources);
    localStorage.removeItem(KEYS.initialized);
    setCases([]);
    setGuidelines([]);
    setSources([]);
  }, []);

  const exportAll = useCallback(() => {
    const data = { cases, guidelines, sources, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sme-risk-engine-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cases, guidelines, sources]);

  const importAll = useCallback((jsonString: string) => {
    try {
      const parsedData: unknown = JSON.parse(jsonString);
      const data = sanitizeImportData(parsedData);
      if (!data) return false;

      save(KEYS.cases, data.cases);
      save(KEYS.guidelines, data.guidelines);
      save(KEYS.sources, data.sources);
      setCases(data.cases);
      setGuidelines(data.guidelines);
      setSources(data.sources);
      localStorage.setItem(KEYS.initialized, "true");
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    cases, guidelines, sources,
    saveCase, deleteCase, duplicateCase, getCaseById,
    saveGuideline, deleteGuideline,
    saveSource, deleteSource,
    clearAll, exportAll, importAll
  };
}

export function generateCaseId(): string {
  return `case-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
