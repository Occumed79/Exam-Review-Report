/**
 * Parse Client Stub
 * Safe no-op stub so the frontend can build without a live Parse/HIPAA backend.
 * All sync operations are silently skipped; local-storage persistence is unaffected.
 */

export function initializeParseClient(_config: object = {}): void {
  console.log("ℹ️ Parse backend not configured — running in local-only mode.");
}

export async function createCase(_caseData: object): Promise<void> {
  // no-op in local mode
}

export async function updateCase(_caseId: string, _updates: object): Promise<void> {
  // no-op in local mode
}
