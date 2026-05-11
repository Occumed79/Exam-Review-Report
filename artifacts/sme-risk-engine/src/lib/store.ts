import { useState, useEffect, useCallback } from "react";
import { SMECase, Guideline, Source } from "./types";
import { NuclearWarheadConfig } from "./nuclearWarheadAPIs";
import { SAMPLE_CASES, SAMPLE_GUIDELINES, SAMPLE_SOURCES } from "./sampleData";
import { initializeParseClient, createCase as apiCreateCase, updateCase as apiUpdateCase } from "./parseClient";
import { logAuditEntry, logPHIAccess } from "./auditLogger";

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
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Initialize Parse Client
  useEffect(() => {
    try {
      console.log("🔄 Initializing HIPAA Backend...");
      initializeParseClient();
      setIsBackendConnected(true);
      console.log("🛡️ HIPAA Backend Connected");
    } catch (error) {
      console.error("❌ Failed to connect to HIPAA Backend:", error);
    }
  }, []);

  const [nuclearConfig] = useState<NuclearWarheadConfig>(() => ({
    groqApiKey: import.meta.env.VITE_GROQ_KEY,
    openrouterApiKey: import.meta.env.VITE_OPENROUTER_KEY,
    geminiApiKey: import.meta.env.VITE_GEMINI_KEY,
    tavilyApiKey: import.meta.env.VITE_TAVILY_KEY,
    exaApiKey: import.meta.env.VITE_EXA_KEY,
    firecrawlApiKey: import.meta.env.VITE_FIRECRAWL_KEY,
    browserbaseApiKey: import.meta.env.VITE_BROWSERBASE_KEY,
    youComApiKey: import.meta.env.VITE_YOU_API_KEY,
    jinaSearchApiKey: import.meta.env.VITE_JINA_KEY,
    serperApiKey: import.meta.env.VITE_SERPER_KEY,
    browseAiApiKey: import.meta.env.VITE_BROWSE_AI_KEY,
    browserlessApiKey: import.meta.env.VITE_BROWSERLESS_KEY,
    cloudApiKey: import.meta.env.VITE_CLOUD_KEY,
    ocrSpaceApiKey: import.meta.env.VITE_OCR_SPACE_KEY,
    minimaxApiKey: import.meta.env.VITE_MINIMAX_KEY,
    olostepApiKey: import.meta.env.VITE_OLOSTEP_KEY,
    apifyApiKey: import.meta.env.VITE_APIFY_KEY,
    langsearchApiKey: import.meta.env.VITE_LANGSEARCH_KEY,
  }));

  // Initialize with sample data on first load or if empty
  useEffect(() => {
    const initialized = localStorage.getItem(KEYS.initialized);
    const hasData = cases.length > 0 || guidelines.length > 0 || sources.length > 0;
    
    if (!initialized || !hasData) {
      console.log("📦 Seeding store with Elite Sample Data...");
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
  }, [cases.length, guidelines.length, sources.length]);

  // Cases
  const saveCase = useCallback(async (c: SMECase) => {
    // 1. Update Local State
    setCases(prev => {
      const exists = prev.findIndex(x => x.id === c.id);
      const updated = exists >= 0
        ? prev.map(x => x.id === c.id ? { ...c, updatedAt: new Date().toISOString() } : x)
        : [...prev, { ...c, updatedAt: new Date().toISOString() }];
      save(KEYS.cases, updated);
      return updated;
    });

    // 2. Audit and sync with HIPAA Backend when available. Audit logging always
    // writes a local immutable fallback even if the backend is unreachable.
    const exists = cases.some(x => x.id === c.id);
    await logAuditEntry({
      action: exists ? 'PHI_MODIFICATION' : 'PHI_ACCESS',
      entityId: c.id,
      entityType: 'Case',
      reason: exists ? 'User updated case details' : 'User created new case',
      metadata: {
        status: c.status,
        source: c.intakeSource || 'manual',
        hasBackendConnection: isBackendConnected,
      },
    });

    if (isBackendConnected) {
      try {
        if (exists) {
          await apiUpdateCase(c.id, c);
        } else {
          await apiCreateCase(c);
        }
      } catch (error) {
        console.warn("⚠️ Backend sync failed, data remains in local storage", error);
      }
    }
  }, [cases, isBackendConnected]);

  const deleteCase = useCallback((id: string) => {
    setCases(prev => {
      const updated = prev.filter(x => x.id !== id);
      save(KEYS.cases, updated);
      return updated;
    });
    void logAuditEntry({
      action: 'CASE_DELETE',
      entityId: id,
      entityType: 'Case',
      reason: 'User deleted case from local workspace',
      metadata: { hasBackendConnection: isBackendConnected },
    });
  }, [isBackendConnected]);

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
      void logAuditEntry({
        action: 'CASE_DUPLICATE',
        entityId: newCase.id,
        entityType: 'Case',
        reason: 'User duplicated case for derivative review',
        metadata: { sourceCaseId: id, hasBackendConnection: isBackendConnected },
      });
      return updated;
    });
  }, [isBackendConnected]);

  const getCaseById = useCallback((id: string): SMECase | undefined => {
    const found = cases.find(x => x.id === id);
    if (found && isBackendConnected) {
      logPHIAccess(id, 'Case', 'User viewed case details');
    }
    return found;
  }, [cases, isBackendConnected]);

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
    void logAuditEntry({
      action: 'CASE_EXPORT',
      entityId: 'workspace-export',
      entityType: 'Workspace',
      reason: 'User exported workspace data',
      metadata: { caseCount: cases.length, guidelineCount: guidelines.length, sourceCount: sources.length },
    });
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
      void logAuditEntry({
        action: 'CASE_IMPORT',
        entityId: 'workspace-import',
        entityType: 'Workspace',
        reason: 'User imported workspace data',
        metadata: { caseCount: data.cases.length, guidelineCount: data.guidelines.length, sourceCount: data.sources.length },
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    cases, guidelines, sources, activeCaseId, nuclearConfig,
    setActiveCaseId,
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

