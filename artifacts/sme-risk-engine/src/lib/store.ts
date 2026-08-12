import { useCallback, useState } from "react";
import type { Guideline, Source } from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isGuidelineLike(value: unknown): value is Guideline {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.sourceName === "string" &&
    typeof value.agency === "string"
  );
}

function isSourceLike(value: unknown): value is Source {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.organization === "string"
  );
}

function sourceKey(source: Source): string {
  const rawUrl = source.url.trim();
  if (rawUrl) {
    try {
      const url = new URL(rawUrl);
      url.hash = "";
      url.hostname = url.hostname.toLowerCase();
      url.pathname = url.pathname.replace(/\/$/, "");
      return `url:${url.toString().toLowerCase()}`;
    } catch {
      /* use metadata key for an invalid legacy URL */
    }
  }
  return `meta:${source.organization.trim().toLowerCase()}|${source.title.trim().toLowerCase()}|${source.publicationDate}`;
}

function dedupeSources(sources: Source[]): Source[] {
  const unique = new Map<string, Source>();
  sources.forEach((source) => unique.set(sourceKey(source), source));
  return [...unique.values()];
}

function sanitizeImportData(
  data: unknown,
): { guidelines: Guideline[]; sources: Source[] } | null {
  if (!isRecord(data)) return null;
  const rawGuidelines = Array.isArray(data.guidelines) ? data.guidelines : [];
  const rawSources = Array.isArray(data.sources) ? data.sources : [];
  const guidelines = rawGuidelines.filter(isGuidelineLike);
  const sources = rawSources.filter(isSourceLike);
  if (rawGuidelines.length && !guidelines.length) return null;
  if (rawSources.length && !sources.length) return null;
  return { guidelines, sources: dedupeSources(sources) };
}

const KEYS = { guidelines: "sme_guidelines", sources: "sme_sources" };

function loadValidatedArray<T>(
  key: string,
  guard: (value: unknown) => value is T,
): T[] {
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
  const [guidelines, setGuidelines] = useState<Guideline[]>(() =>
    loadValidatedArray(KEYS.guidelines, isGuidelineLike),
  );
  const [sources, setSources] = useState<Source[]>(() =>
    loadValidatedArray(KEYS.sources, isSourceLike),
  );

  const saveGuideline = useCallback((guideline: Guideline) => {
    setGuidelines((previous) => {
      const updated = previous.some((item) => item.id === guideline.id)
        ? previous.map((item) => (item.id === guideline.id ? guideline : item))
        : [...previous, guideline];
      save(KEYS.guidelines, updated);
      return updated;
    });
  }, []);

  const deleteGuideline = useCallback((id: string) => {
    setGuidelines((previous) => {
      const updated = previous.filter((item) => item.id !== id);
      save(KEYS.guidelines, updated);
      return updated;
    });
  }, []);

  const saveSource = useCallback((source: Source) => {
    setSources((previous) => {
      const duplicate = previous.find(
        (item) =>
          item.id !== source.id && sourceKey(item) === sourceKey(source),
      );
      const normalized = {
        ...source,
        id: duplicate?.id ?? source.id,
        title: source.title.trim(),
        organization: source.organization.trim(),
        url: source.url.trim(),
      };
      const updated = previous.some((item) => item.id === normalized.id)
        ? previous
            .map((item) => (item.id === normalized.id ? normalized : item))
            .filter(
              (item) =>
                item.id === normalized.id ||
                sourceKey(item) !== sourceKey(normalized),
            )
        : [...previous, normalized];
      save(KEYS.sources, updated);
      return updated;
    });
  }, []);

  const deleteSource = useCallback((id: string) => {
    setSources((previous) => {
      const updated = previous.filter((item) => item.id !== id);
      save(KEYS.sources, updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(KEYS.guidelines);
    localStorage.removeItem(KEYS.sources);
    setGuidelines([]);
    setSources([]);
  }, []);

  const exportAll = useCallback(() => {
    const data = { guidelines, sources, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `exam-reviewer-toolkit-${new Date().toISOString().split("T")[0]}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [guidelines, sources]);

  const importAll = useCallback((jsonString: string) => {
    try {
      const data = sanitizeImportData(JSON.parse(jsonString));
      if (!data) return false;
      save(KEYS.guidelines, data.guidelines);
      save(KEYS.sources, data.sources);
      setGuidelines(data.guidelines);
      setSources(data.sources);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    guidelines,
    sources,
    saveGuideline,
    deleteGuideline,
    saveSource,
    deleteSource,
    clearAll,
    exportAll,
    importAll,
  };
}

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
