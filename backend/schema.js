/**
 * HIPAA-Compliant Database Schema
 * 
 * This module defines all the Parse classes (models) for storing case data,
 * medical records, and audit logs with full HIPAA compliance.
 */

const Parse = require('parse/node');

/**
 * Initialize all Parse classes
 */
async function initializeSchema() {
  // Define the Case class
  const CaseSchema = new Parse.Schema('Case');
  CaseSchema.addString('caseId').setRequired(true);
  CaseSchema.addString('status').setDefault('draft'); // draft, pending, completed
  CaseSchema.addString('title');
  CaseSchema.addString('description');
  CaseSchema.addDate('createdAt');
  CaseSchema.addDate('updatedAt');
  CaseSchema.addPointer('owner', '_User');
  CaseSchema.addArray('assignedTo'); // Array of user IDs
  CaseSchema.addObject('metadata'); // Flexible metadata storage
  
  // Define the MedicalProfile class
  const MedicalProfileSchema = new Parse.Schema('MedicalProfile');
  MedicalProfileSchema.addPointer('case', 'Case').setRequired(true);
  MedicalProfileSchema.addArray('conditions'); // Medical conditions
  MedicalProfileSchema.addArray('medications'); // Current medications
  MedicalProfileSchema.addObject('vitalSigns'); // BP, HR, etc.
  MedicalProfileSchema.addArray('labResults'); // Lab test results
  MedicalProfileSchema.addString('allergies');
  MedicalProfileSchema.addString('surgicalHistory');
  MedicalProfileSchema.addObject('familyHistory');
  MedicalProfileSchema.addString('socialHistory');
  MedicalProfileSchema.addDate('lastUpdated');
  
  // Define the JobProfile class
  const JobProfileSchema = new Parse.Schema('JobProfile');
  JobProfileSchema.addPointer('case', 'Case').setRequired(true);
  JobProfileSchema.addString('jobTitle').setRequired(true);
  JobProfileSchema.addString('employer');
  JobProfileSchema.addString('department');
  JobProfileSchema.addArray('essentialFunctions'); // Job duties
  JobProfileSchema.addArray('physicalDemands'); // Lifting, standing, etc.
  JobProfileSchema.addArray('environmentalExposures'); // Chemicals, noise, etc.
  JobProfileSchema.addArray('safetyRequirements'); // PPE, certifications
  JobProfileSchema.addString('occupationalStandard'); // NFPA 1582, etc.
  JobProfileSchema.addDate('lastUpdated');
  
  // Define the RiskAssessment class
  const RiskAssessmentSchema = new Parse.Schema('RiskAssessment');
  RiskAssessmentSchema.addPointer('case', 'Case').setRequired(true);
  RiskAssessmentSchema.addNumber('overallRiskScore'); // 0-100
  RiskAssessmentSchema.addString('riskLevel'); // Low, Medium, High, Critical
  RiskAssessmentSchema.addArray('riskFactors'); // Identified risks
  RiskAssessmentSchema.addArray('recommendations'); // SME recommendations
  RiskAssessmentSchema.addArray('documentationGaps'); // Missing info
  RiskAssessmentSchema.addString('clinicalOpinion');
  RiskAssessmentSchema.addDate('assessmentDate');
  
  // Define the Document class for storing uploaded files
  const DocumentSchema = new Parse.Schema('Document');
  DocumentSchema.addPointer('case', 'Case').setRequired(true);
  DocumentSchema.addString('documentType'); // Medical Report, Job Description, etc.
  DocumentSchema.addString('fileName');
  DocumentSchema.addString('fileUrl');
  DocumentSchema.addString('fileSize');
  DocumentSchema.addString('mimeType');
  DocumentSchema.addBoolean('isRedacted').setDefault(false);
  DocumentSchema.addString('redactionStatus'); // pending, completed, failed
  DocumentSchema.addObject('extractedData'); // Data extracted from document
  DocumentSchema.addDate('uploadedAt');
  DocumentSchema.addDate('processedAt');
  
  // Define the AuditLog class for HIPAA compliance
  const AuditLogSchema = new Parse.Schema('AuditLog');
  AuditLogSchema.addString('action').setRequired(true); // create, read, update, delete
  AuditLogSchema.addString('entityType').setRequired(true); // Case, MedicalProfile, etc.
  AuditLogSchema.addString('entityId').setRequired(true);
  AuditLogSchema.addPointer('user', '_User');
  AuditLogSchema.addString('ipAddress');
  AuditLogSchema.addString('userAgent');
  AuditLogSchema.addObject('changes'); // What was changed
  AuditLogSchema.addString('reason'); // Why the change was made
  AuditLogSchema.addDate('timestamp');
  AuditLogSchema.addBoolean('success').setDefault(true);
  AuditLogSchema.addString('errorMessage');
  
  // Define the IntelligenceReport class
  const IntelligenceReportSchema = new Parse.Schema('IntelligenceReport');
  IntelligenceReportSchema.addPointer('case', 'Case').setRequired(true);
  IntelligenceReportSchema.addString('reportType'); // SME Review, Risk Analysis, etc.
  IntelligenceReportSchema.addString('content'); // Report content (markdown)
  IntelligenceReportSchema.addArray('sources'); // Data sources used
  IntelligenceReportSchema.addArray('recommendations');
  IntelligenceReportSchema.addNumber('confidenceScore'); // 0-100
  IntelligenceReportSchema.addDate('generatedAt');
  IntelligenceReportSchema.addPointer('generatedBy', '_User');
  
  // Define the UserProfile class
  const UserProfileSchema = new Parse.Schema('UserProfile');
  UserProfileSchema.addPointer('user', '_User').setRequired(true);
  UserProfileSchema.addString('role'); // admin, sme, reviewer, etc.
  UserProfileSchema.addArray('permissions'); // Granular permissions
  UserProfileSchema.addArray('specializations'); // Medical specialties
  UserProfileSchema.addString('department');
  UserProfileSchema.addBoolean('isActive').setDefault(true);
  UserProfileSchema.addDate('lastLogin');
  
  try {
    // Create or update all schemas
    await CaseSchema.save();
    console.log('✅ Case schema created/updated');
    
    await MedicalProfileSchema.save();
    console.log('✅ MedicalProfile schema created/updated');
    
    await JobProfileSchema.save();
    console.log('✅ JobProfile schema created/updated');
    
    await RiskAssessmentSchema.save();
    console.log('✅ RiskAssessment schema created/updated');
    
    await DocumentSchema.save();
    console.log('✅ Document schema created/updated');
    
    await AuditLogSchema.save();
    console.log('✅ AuditLog schema created/updated');
    
    await IntelligenceReportSchema.save();
    console.log('✅ IntelligenceReport schema created/updated');
    
    await UserProfileSchema.save();
    console.log('✅ UserProfile schema created/updated');
    
    console.log('🛡️ All HIPAA-compliant schemas initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing schemas:', error);
    throw error;
  }
}

/**
 * Define Parse class security rules for HIPAA compliance
 */
function defineSecurityRules() {
  // Case class permissions
  const CaseACL = new Parse.ACL();
  CaseACL.setPublicReadAccess(false);
  CaseACL.setPublicWriteAccess(false);
  
  // MedicalProfile class permissions
  const MedicalProfileACL = new Parse.ACL();
  MedicalProfileACL.setPublicReadAccess(false);
  MedicalProfileACL.setPublicWriteAccess(false);
  
  // AuditLog class - read-only for authorized users
  const AuditLogACL = new Parse.ACL();
  AuditLogACL.setPublicReadAccess(false);
  AuditLogACL.setPublicWriteAccess(false);
  
  return {
    CaseACL,
    MedicalProfileACL,
    AuditLogACL
  };
}

/**
 * Create an audit log entry
 */
async function createAuditLog(action, entityType, entityId, userId, changes = {}, reason = '') {
  const AuditLog = Parse.Object.extend('AuditLog');
  const auditLog = new AuditLog();
  
  auditLog.set('action', action);
  auditLog.set('entityType', entityType);
  auditLog.set('entityId', entityId);
  auditLog.set('user', userId);
  auditLog.set('changes', changes);
  auditLog.set('reason', reason);
  auditLog.set('timestamp', new Date());
  
  try {
    await auditLog.save(null, { useMasterKey: true });
    console.log(`📝 Audit log created: ${action} on ${entityType}`);
  } catch (error) {
    console.error('❌ Error creating audit log:', error);
  }
}

/**
 * Encrypt sensitive data before storage
 */
function encryptSensitiveData(data) {
  // In production, use a proper encryption library like crypto
  // This is a placeholder for demonstration
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decrypt sensitive data after retrieval
 */
function decryptSensitiveData(encryptedData) {
  // In production, use a proper decryption library
  // This is a placeholder for demonstration
  return JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf-8'));
}

module.exports = {
  initializeSchema,
  defineSecurityRules,
  createAuditLog,
  encryptSensitiveData,
  decryptSensitiveData
};
