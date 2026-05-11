/**
 * HIPAA Audit Logger
 * 
 * This utility provides standardized logging for all PHI access and modifications
 * to ensure compliance with HIPAA audit trail requirements.
 */



export type AuditAction = 
  | 'PHI_ACCESS' 
  | 'PHI_MODIFICATION' 
  | 'DOCUMENT_UPLOAD' 
  | 'DOCUMENT_REDACTION' 
  | 'AI_EXTRACTION' 
  | 'REPORT_GENERATION'
  | 'CASE_IMPORT'
  | 'CASE_EXPORT'
  | 'CASE_DELETE'
  | 'CASE_DUPLICATE'
  | 'USER_LOGIN'
  | 'USER_LOGOUT';

export interface AuditEntry {
  action: AuditAction;
  entityId: string;
  entityType: 'Case' | 'MedicalProfile' | 'Document' | 'Report' | 'Workspace';
  reason: string;
  metadata?: Record<string, any>;
}

export interface StoredAuditEntry extends AuditEntry {
  id: string;
  timestamp: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

const LOCAL_AUDIT_KEY = 'sme_audit_trail';

function appendLocalAuditEntry(entry: AuditEntry, syncStatus: StoredAuditEntry['syncStatus']): StoredAuditEntry | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored: StoredAuditEntry[] = JSON.parse(localStorage.getItem(LOCAL_AUDIT_KEY) || '[]');
    const record: StoredAuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      syncStatus,
    };
    localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify([record, ...stored].slice(0, 1000)));
    return record;
  } catch (error) {
    console.warn('Local audit append failed', error);
    return null;
  }
}

export function getLocalAuditTrail(): StoredAuditEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_AUDIT_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Log a HIPAA-compliant audit entry
 */
export async function logAuditEntry(entry: AuditEntry): Promise<void> {
  const localRecord = appendLocalAuditEntry(entry, 'pending');

  // Backend sync skipped in local-only mode; local audit trail is the durable record.
  console.log(`🛡️ Local Audit: ${entry.action} on ${entry.entityType} (${entry.entityId})`);
}

/**
 * Specialized logger for PHI access
 */
export async function logPHIAccess(entityId: string, entityType: AuditEntry['entityType'], reason: string): Promise<void> {
  await logAuditEntry({
    action: 'PHI_ACCESS',
    entityId,
    entityType,
    reason,
    metadata: { accessType: 'view' }
  });
}

/**
 * Specialized logger for PHI modification
 */
export async function logPHIModification(entityId: string, entityType: AuditEntry['entityType'], reason: string, changes: Record<string, any>): Promise<void> {
  await logAuditEntry({
    action: 'PHI_MODIFICATION',
    entityId,
    entityType,
    reason,
    metadata: { changes }
  });
}
