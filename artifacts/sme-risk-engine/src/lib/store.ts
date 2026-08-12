import { useCallback, useState } from "react";
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
  return typeof value.id === "string" && typeof value.sourceName === "string" && typeof value.agency === "string";
}

function isSourceLike(value: unknown): value is Source {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.title === "string" && typeof value.organization === "string";
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

const KEYS = {
  cases: "sme_cases",
  guidelines: "sme_guidelines",
  sources: "sme_sources",
};

function loadValidatedArray<T>(key: string, guard: (value: unknown) => value is T): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(guard) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Local browser storage write failed", error);
  }
}

export function useStore() {
  const [cases, setCases] = useState<SMECase[]>(() => loadValidatedArray(KEYS.cases, isSMECaseLike));
  const [guidelines, setGuidelines] = useState<Guideline[]>(() => loadValidatedArray(KEYS.guidelines, isGuidelineLike));
  const [sources, setSources] = useState<Source[]>(() => loadValidatedArray(KEYS.sources, isSourceLike));
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const saveCase = useCallback((c: SMECase) => {
    setCases((prev) => {
      const exists = prev.some((item) => item.id === c.id);
      const updated = exists
        ? prev.map((item) => (item.id === c.id ? { ...c, updatedAt: new Date().toISOString() } : item))
        : [...prev, { ...c, updatedAt: new Date().toISOString() }];
      save(KEYS.cases, updated);
      return updated;
    });
  }, []);

  const deleteCase = useCallback((id: string) => {
    setCases((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      save(KEYS.cases, updated);
      return updated;
    });
  }, []);

  const duplicateCase = useCallback((id: string) => {
    setCases((prev) => {
      const original = prev.find((item) => item.id === id);
      if (!original) return prev;
      const now = new Date().toISOString();
      const copy: SMECase = {
        ...original,
        id: `case-${Date.now()}`,
        caseId: `${original.caseId}-COPY`,
        status: "Draft",
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...prev, copy];
      save(KEYS.cases, updated);
      return updated;
    });
  }, []);

  const getCaseById = useCallback((id: string) => cases.find((item) => item.id === id), [cases]);

  const saveGuideline = useCallback((g: Guideline) => {
    setGuidelines((prev) => {
      const updated = prev.some((item) => item.id === g.id)
        ? prev.map((item) => (item.id === g.id ? g : item))
        : [...prev, g];
      save(KEYS.guidelines, updated);
      return updated;
    });
  }, []);

  const deleteGuideline = useCallback((id: string) => {
    setGuidelines((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      save(KEYS.guidelines, updated);
      return updated;
    });
  }, []);

  const saveSource = useCallback((s: Source) => {
    setSources((prev) => {
      const updated = prev.some((item) => item.id === s.id)
        ? prev.map((item) => (item.id === s.id ? s : item))
        : [...prev, s];
      save(KEYS.sources, updated);
      return updated;
    });
  }, []);

  const deleteSource = useCallback((id: string) => {
    setSources((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      save(KEYS.sources, updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(KEYS.cases);
    localStorage.removeItem(KEYS.guidelines);
    localStorage.removeItem(KEYS.sources);
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
    a.download = `exam-reviewer-toolkit-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cases, guidelines, sources]);

  const importAll = useCallback((jsonString: string) => {
    try {
      const parsed: unknown = JSON.parse(jsonString);
      const data = sanitizeImportData(parsed);
      if (!data) return false;
      save(KEYS.cases, data.cases);
      save(KEYS.guidelines, data.guidelines);
      save(KEYS.sources, data.sources);
      setCases(data.cases);
      setGuidelines(data.guidelines);
      setSources(data.sources);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    cases,
    guidelines,
    sources,
    activeCaseId,
    setActiveCaseId,
    saveCase,
    deleteCase,
    duplicateCase,
    getCaseById,
    saveGuideline,
    deleteGuideline,
    saveSource,
    deleteSource,
    clearAll,
    exportAll,
    importAll,
  };
}

export function generateCaseId(): string {
  return `case-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
