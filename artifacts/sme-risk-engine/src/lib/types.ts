export type ExamType =
  | "pre-employment" | "annual" | "deployment" | "firefighter"
  | "aviation" | "law-enforcement" | "dot-fmcsa" | "return-to-work"
  | "fitness-for-duty" | "other";

export type CaseStatus =
  | "Draft" | "Needs Records" | "Risk Review Needed"
  | "Ready for SME" | "SME Reviewed" | "Finalized";

export type ConditionCategory =
  | "cardiovascular" | "respiratory" | "endocrine-metabolic" | "neurologic"
  | "psychiatric" | "orthopedic" | "sleep-disorder" | "renal"
  | "gastrointestinal" | "hematologic" | "infectious-disease" | "immunologic"
  | "dermatologic" | "vision-hearing" | "other";

export type ConditionStatus = "active" | "stable" | "resolved" | "uncontrolled" | "unclear";
export type IncapacitationRisk = "Yes" | "Possible" | "No" | "Unclear";
export type RecurrenceRisk = "High" | "Moderate" | "Low" | "Unclear";
export type DocumentationConfidence = "documented" | "partial" | "unclear" | "missing";
export type RiskScore = 0 | 1 | 2 | 3 | "U";
export type SourceConfidence = "official" | "internal" | "sme-summary" | "secondary" | "unclear";
export type SourceReliability = "High" | "Moderate" | "Low" | "Unverified";

export interface MedicalCondition {
  id: string;
  conditionName: string;
  category: ConditionCategory;
  dateDiagnosed: string;
  status: ConditionStatus;
  symptoms: string;
  severity: number;
  frequencyOfSymptoms: string;
  lastFlare: string;
  treatmentPlan: string;
  currentMedications: string;
  medicationSideEffects: string;
  specialist: string;
  hospitalizations: number;
  erVisits: number;
  surgeries: number;
  recentLabs: string;
  providerQuote: string;
  selfReported: string;
  functionalLimitations: string;
  restrictions: string;
  monitoringRequirements: string;
  incapacitationRisk: IncapacitationRisk;
  recurrenceRisk: RecurrenceRisk;
  refrigerationNeeded: boolean;
  specialtyFollowUp: boolean;
  emergencyAccessNeeded: boolean;
  treatmentContinuity: {
    dosageFrequency: string;
    controlledSubstance: boolean;
    sedatingMedication: boolean;
    monitoringRequired: boolean;
    labFollowUpRequired: boolean;
    pharmacyAccessNeeded: boolean;
    medicalSuppliesNeeded: boolean;
    powerRequirement: boolean;
    rescueMedicationNeeded: boolean;
    riskIfInterrupted: string;
    feasibilityConcern: string;
  };
  notes: string;
}

export interface InjuryRecord {
  id: string;
  injuryType: string;
  bodyRegion: string;
  dateOfInjury: string;
  mechanism: string;
  treatmentReceived: string;
  surgeriesPerformed: string;
  ptReceived: boolean;
  imagingType: string;
  residualPain: number;
  residualWeakness: string;
  romLimitation: string;
  workRestrictions: string;
  reinjuryRisk: string;
  jobDutyRelevance: string;
  providerQuote: string;
  documentationConfidence: DocumentationConfidence;
}

export interface JobDuties {
  physicalDemands: string[];
  cognitiveDemands: string[];
  environmentalDemands: string[];
  essentialFunctions: string;
  clientRequirements: string;
  agencyStandardNotes: string;
  safetySensitiveFlags: {
    driving: boolean;
    aviation: boolean;
    weapons: boolean;
    emergencyResponse: boolean;
    workingAlone: boolean;
    patientCare: boolean;
    publicSafety: boolean;
    hazardousMachinery: boolean;
    heights: boolean;
    confinedSpaces: boolean;
  };
}

export interface CountryRiskProfile {
  country: string;
  region: string;
  climateRisks: string[];
  infectiousDiseaseRisks: string[];
  vaccineRequirements: string;
  medicationAvailability: string;
  localMedicalInfrastructure: string;
  evacuationConcerns: string;
  specialtyCareAvailability: string;
  pharmacyReliability: string;
  securityRisk: string;
  foodWaterSafety: string;
  occupationalExposureRisks: string;
  notes: string;
  sourceLink: string;
  lastReviewed: string;
}

export interface OccupationalData {
  jobCategory: string;
  commonInjuryPatterns: string;
  fatalityRiskFactors: string;
  mskPrevalence: string;
  heatIllnessRisk: string;
  respiratoryRisk: string;
  transportationRisk: string;
  violenceRisk: string;
  slipsTripsFalls: string;
  overexertion: string;
  hazardousExposure: string;
  source: string;
  sourceDate: string;
  notes: string;
}

export interface HealthEquityContext {
  accessToCare: string;
  transportationBarriers: boolean;
  transportationNotes: string;
  medicationAffordability: boolean;
  medicationAffordabilityNotes: string;
  insuranceLimitations: string;
  localProviderAvailability: string;
  specialistAccess: string;
  pharmacyAccess: string;
  languageSupport: boolean;
  languageNotes: string;
  healthLiteracySupport: boolean;
  healthLiteracyNotes: string;
  followUpFeasibility: string;
  documentationBarriers: string;
  supportRecommendations: string;
}

export interface RiskCategoryScore {
  category: string;
  score: RiskScore;
  whyFlagged: string;
  supportingEvidence: string;
  missingInformation: string;
  jobRelevance: string;
  guidelineRelevance: string;
  environmentRelevance: string;
  smeQuestion: string;
  suggestedFollowUp: string;
}

export interface DocumentationGap {
  id: string;
  description: string;
  category: string;
  severity: "high" | "moderate" | "low";
  relatedCondition: string;
  providerQuestion: string;
  custom: boolean;
}

export interface SMEAssessment {
  clinicalInterpretation: string;
  occupationalRelevance: string;
  riskLevel: string;
  documentationSufficiency: string;
  additionalRecordsNeeded: string;
  finalRecommendation: string;
  recommendationFreeText: string;
  smeReviewNotes: string;
  documentsReviewed: string[];
  dateCompleted: string;
}

export interface ApplicableStandards {
  selected: string[];
  customNotes: string;
}

export interface RiskInteraction {
  id: string;
  type: "condition-job" | "condition-med" | "condition-country" | "med-job" | "med-country";
  sourceId: string;
  targetId: string;
  description: string;
  severity: "high" | "moderate" | "low";
  rationale: string;
}

export interface SMECase {
  id: string;
  caseId: string;
  examineeName: string;
  dob: string;
  age: number;
  sex: string;
  employer: string;
  jobTitle: string;
  department: string;
  examType: ExamType;
  reviewingSME: string;
  caseManager: string;
  dateOfExam: string;
  workLocation: string;
  deploymentCountry: string;
  agencyStandard: string;
  standards: ApplicableStandards;
  notes: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  medicalConditions: MedicalCondition[];
  injuries: InjuryRecord[];
  jobDuties: JobDuties;
  countryRisk: CountryRiskProfile | null;
  occupationalData: OccupationalData | null;
  healthEquity: HealthEquityContext | null;
  riskScores: RiskCategoryScore[];
  documentationGaps: DocumentationGap[];
  riskInteractions: RiskInteraction[];
  smeAssessment: SMEAssessment;
}

export interface Guideline {
  id: string;
  sourceName: string;
  agency: string;
  standardType: string;
  conditionCategory: string;
  jobCategory: string;
  summary: string;
  medicalTriggers: string;
  jobDutyTriggers: string;
  documentationNeeded: string;
  riskConsiderations: string;
  sourceLink: string;
  lastReviewed: string;
  reviewedBy: string;
  sourceConfidence: SourceConfidence;
  versionDate: string;
  notes: string;
  isSample: boolean;
}

export interface Source {
  id: string;
  title: string;
  organization: string;
  url: string;
  publicationDate: string;
  lastReviewed: string;
  reviewedBy: string;
  summary: string;
  relevantConditions: string;
  relevantJobs: string;
  relevantCountries: string;
  sourceReliability: SourceReliability;
  notes: string;
  createdAt: string;
}

export interface AOREvent {
  id: string;
  country: string;
  countryCode: string;
  region: string;
  coordinates: [number, number];
  riskLevel: "critical" | "high" | "moderate" | "low" | "monitor";
  category: "health" | "conflict" | "environmental" | "infrastructure" | "disease";
  title: string;
  summary: string;
  details: string;
  date: string;
  source: string;
  tags: string[];
}
