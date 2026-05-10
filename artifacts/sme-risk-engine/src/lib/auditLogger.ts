/**
 * HIPAA Audit Logger
 * 
 * This utility provides standardized logging for all PHI access and modifications
 * to ensure compliance with HIPAA audit trail requirements.
 */

import { initializeParseClient } from '../../../../backend/parseClient';

import Parse from 'parse';

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

  try {
    // Ensure Parse is initialized before use. If Parse is not configured or reachable,
    // the local audit record above remains the durable fallback.
    initializeParseClient();
    
    const AuditLog = Parse.Object.extend('AuditLog');
    const log = new AuditLog();

    log.set('action', entry.action);
    log.set('entityId', entry.entityId);
    log.set('entityType', entry.entityType);
    log.set('reason', entry.reason);
    log.set('metadata', { ...(entry.metadata || {}), localAuditId: localRecord?.id });
    log.set('user', Parse.User.current());
    log.set('timestamp', new Date());
    log.set('ipAddress', 'Client-Side');

    await log.save();
    appendLocalAuditEntry({ ...entry, metadata: { ...(entry.metadata || {}), backendSynced: true } }, 'synced');
    console.log(`🛡️ HIPAA Audit Logged: ${entry.action} on ${entry.entityType} (${entry.entityId})`);
  } catch (error) {
    appendLocalAuditEntry({ ...entry, metadata: { ...(entry.metadata || {}), backendSyncError: error instanceof Error ? error.message : String(error) } }, 'failed');
    console.warn('⚠️ Backend audit unavailable; PHI action retained in local audit trail:', error);
  }
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
