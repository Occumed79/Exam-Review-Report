/**
 * HIPAA Audit Logger
 * 
 * This utility provides standardized logging for all PHI access and modifications
 * to ensure compliance with HIPAA audit trail requirements.
 */

import { initializeParseClient } from '../../../../backend/parseClient';

// Initialize Parse client (will use environment variables)
const Parse = initializeParseClient();

export type AuditAction = 
  | 'PHI_ACCESS' 
  | 'PHI_MODIFICATION' 
  | 'DOCUMENT_UPLOAD' 
  | 'DOCUMENT_REDACTION' 
  | 'AI_EXTRACTION' 
  | 'REPORT_GENERATION'
  | 'USER_LOGIN'
  | 'USER_LOGOUT';

export interface AuditEntry {
  action: AuditAction;
  entityId: string;
  entityType: 'Case' | 'MedicalProfile' | 'Document' | 'Report';
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * Log a HIPAA-compliant audit entry
 */
export async function logAuditEntry(entry: AuditEntry): Promise<void> {
  const AuditLog = Parse.Object.extend('AuditLog');
  const log = new AuditLog();

  log.set('action', entry.action);
  log.set('entityId', entry.entityId);
  log.set('entityType', entry.entityType);
  log.set('reason', entry.reason);
  log.set('metadata', entry.metadata || {});
  log.set('user', Parse.User.current());
  log.set('timestamp', new Date());
  log.set('ipAddress', 'Client-Side'); // In production, this would be captured by the backend

  try {
    await log.save();
    console.log(`🛡️ HIPAA Audit Logged: ${entry.action} on ${entry.entityType} (${entry.entityId})`);
  } catch (error) {
    console.error('❌ Failed to log HIPAA audit entry:', error);
    // In a production environment, we might want to queue this or alert the admin
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
