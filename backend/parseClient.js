/**
 * Parse Client Configuration
 * 
 * This module provides utilities for connecting to the Parse-HIPAA backend
 * from the frontend React application.
 */

const Parse = require('parse/node');

/**
 * Initialize Parse client with backend configuration
 */
function initializeParseClient(config = {}) {
  const appId = config.appId || process.env.REACT_APP_PARSE_APP_ID || 'sme-risk-engine-app';
  const serverUrl = config.serverUrl || process.env.REACT_APP_PARSE_SERVER_URL || 'http://localhost:1337/parse';
  const restApiKey = config.restApiKey || process.env.REACT_APP_PARSE_REST_API_KEY;

  Parse.initialize(appId, restApiKey);
  Parse.serverURL = serverUrl;

  console.log(`✅ Parse client initialized`);
  console.log(`📍 Server URL: ${serverUrl}`);
  console.log(`🔐 App ID: ${appId}`);

  return Parse;
}

/**
 * Create a new Case
 */
async function createCase(caseData) {
  const Case = Parse.Object.extend('Case');
  const newCase = new Case();

  newCase.set('caseId', caseData.caseId);
  newCase.set('title', caseData.title);
  newCase.set('description', caseData.description);
  newCase.set('status', 'draft');
  newCase.set('owner', Parse.User.current());

  try {
    const savedCase = await newCase.save();
    console.log(`✅ Case created: ${savedCase.id}`);
    return savedCase;
  } catch (error) {
    console.error('❌ Error creating case:', error);
    throw error;
  }
}

/**
 * Fetch a Case by ID
 */
async function getCase(caseId) {
  const Case = Parse.Object.extend('Case');
  const query = new Parse.Query(Case);

  try {
    const caseData = await query.get(caseId);
    console.log(`✅ Case fetched: ${caseData.id}`);
    return caseData;
  } catch (error) {
    console.error('❌ Error fetching case:', error);
    throw error;
  }
}

/**
 * Update a Case
 */
async function updateCase(caseId, updates) {
  const Case = Parse.Object.extend('Case');
  const query = new Parse.Query(Case);

  try {
    const caseData = await query.get(caseId);
    
    for (const [key, value] of Object.entries(updates)) {
      caseData.set(key, value);
    }

    const updated = await caseData.save();
    console.log(`✅ Case updated: ${updated.id}`);
    return updated;
  } catch (error) {
    console.error('❌ Error updating case:', error);
    throw error;
  }
}

/**
 * Save Medical Profile
 */
async function saveMedicalProfile(caseId, profileData) {
  const MedicalProfile = Parse.Object.extend('MedicalProfile');
  const profile = new MedicalProfile();

  const Case = Parse.Object.extend('Case');
  const casePointer = Case.createWithoutData(caseId);

  profile.set('case', casePointer);
  profile.set('conditions', profileData.conditions || []);
  profile.set('medications', profileData.medications || []);
  profile.set('vitalSigns', profileData.vitalSigns || {});
  profile.set('labResults', profileData.labResults || []);
  profile.set('allergies', profileData.allergies || '');
  profile.set('lastUpdated', new Date());

  try {
    const saved = await profile.save();
    console.log(`✅ Medical profile saved: ${saved.id}`);
    return saved;
  } catch (error) {
    console.error('❌ Error saving medical profile:', error);
    throw error;
  }
}

/**
 * Save Job Profile
 */
async function saveJobProfile(caseId, profileData) {
  const JobProfile = Parse.Object.extend('JobProfile');
  const profile = new JobProfile();

  const Case = Parse.Object.extend('Case');
  const casePointer = Case.createWithoutData(caseId);

  profile.set('case', casePointer);
  profile.set('jobTitle', profileData.jobTitle);
  profile.set('employer', profileData.employer || '');
  profile.set('essentialFunctions', profileData.essentialFunctions || []);
  profile.set('physicalDemands', profileData.physicalDemands || []);
  profile.set('environmentalExposures', profileData.environmentalExposures || []);
  profile.set('occupationalStandard', profileData.occupationalStandard || '');
  profile.set('lastUpdated', new Date());

  try {
    const saved = await profile.save();
    console.log(`✅ Job profile saved: ${saved.id}`);
    return saved;
  } catch (error) {
    console.error('❌ Error saving job profile:', error);
    throw error;
  }
}

/**
 * Save Risk Assessment
 */
async function saveRiskAssessment(caseId, assessmentData) {
  const RiskAssessment = Parse.Object.extend('RiskAssessment');
  const assessment = new RiskAssessment();

  const Case = Parse.Object.extend('Case');
  const casePointer = Case.createWithoutData(caseId);

  assessment.set('case', casePointer);
  assessment.set('overallRiskScore', assessmentData.overallRiskScore);
  assessment.set('riskLevel', assessmentData.riskLevel);
  assessment.set('riskFactors', assessmentData.riskFactors || []);
  assessment.set('recommendations', assessmentData.recommendations || []);
  assessment.set('documentationGaps', assessmentData.documentationGaps || []);
  assessment.set('clinicalOpinion', assessmentData.clinicalOpinion || '');
  assessment.set('assessmentDate', new Date());

  try {
    const saved = await assessment.save();
    console.log(`✅ Risk assessment saved: ${saved.id}`);
    return saved;
  } catch (error) {
    console.error('❌ Error saving risk assessment:', error);
    throw error;
  }
}

/**
 * Upload and process a document
 */
async function uploadDocument(caseId, file, documentType) {
  const Document = Parse.Object.extend('Document');
  const doc = new Document();

  const Case = Parse.Object.extend('Case');
  const casePointer = Case.createWithoutData(caseId);

  const parseFile = new Parse.File(file.name, file);

  doc.set('case', casePointer);
  doc.set('documentType', documentType);
  doc.set('fileName', file.name);
  doc.set('mimeType', file.type);
  doc.set('fileSize', file.size);
  doc.set('file', parseFile);
  doc.set('isRedacted', false);
  doc.set('redactionStatus', 'pending');
  doc.set('uploadedAt', new Date());

  try {
    const saved = await doc.save();
    console.log(`✅ Document uploaded: ${saved.id}`);
    return saved;
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    throw error;
  }
}

/**
 * Fetch audit logs for a case
 */
async function getAuditLogs(caseId, limit = 50) {
  const AuditLog = Parse.Object.extend('AuditLog');
  const query = new Parse.Query(AuditLog);
  query.equalTo('entityId', caseId);
  query.descending('timestamp');
  query.limit(limit);

  try {
    const logs = await query.find();
    console.log(`✅ Audit logs fetched: ${logs.length} entries`);
    return logs;
  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
    throw error;
  }
}

/**
 * Create an Intelligence Report
 */
async function createIntelligenceReport(caseId, reportData) {
  const IntelligenceReport = Parse.Object.extend('IntelligenceReport');
  const report = new IntelligenceReport();

  const Case = Parse.Object.extend('Case');
  const casePointer = Case.createWithoutData(caseId);

  report.set('case', casePointer);
  report.set('reportType', reportData.reportType);
  report.set('content', reportData.content);
  report.set('sources', reportData.sources || []);
  report.set('recommendations', reportData.recommendations || []);
  report.set('confidenceScore', reportData.confidenceScore || 0);
  report.set('generatedAt', new Date());
  report.set('generatedBy', Parse.User.current());

  try {
    const saved = await report.save();
    console.log(`✅ Intelligence report created: ${saved.id}`);
    return saved;
  } catch (error) {
    console.error('❌ Error creating intelligence report:', error);
    throw error;
  }
}

module.exports = {
  initializeParseClient,
  createCase,
  getCase,
  updateCase,
  saveMedicalProfile,
  saveJobProfile,
  saveRiskAssessment,
  uploadDocument,
  getAuditLogs,
  createIntelligenceReport
};
