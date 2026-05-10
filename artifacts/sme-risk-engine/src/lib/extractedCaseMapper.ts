import type { ClinicalDataPoint, LocalProcessingResult } from "./localPDFProcessor";
import type { ConditionCategory, DocumentationGap, ExamType, MedicalCondition, RiskCategoryScore, SMECase } from "./types";

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function first(points: ClinicalDataPoint[], category: ClinicalDataPoint["category"]): string {
  return points.find((p) => p.category === category)?.value || "";
}

function all(points: ClinicalDataPoint[], category: ClinicalDataPoint["category"]): string[] {
  return points.filter((p) => p.category === category).map((p) => p.value);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function inferExamType(points: ClinicalDataPoint[], text: string): ExamType {
  const haystack = `${text} ${first(points, "agency_standard")}`.toLowerCase();
  if (/deployment|aor|country|oconus|mod\s*17/.test(haystack)) return "deployment";
  if (/fire|nfpa\s*1582/.test(haystack)) return "firefighter";
  if (/dot|fmcsa|commercial driver|cdl/.test(haystack)) return "dot-fmcsa";
  if (/aviation|faa|pilot|flight/.test(haystack)) return "aviation";
  if (/law enforcement|post|police|sheriff|weapon/.test(haystack)) return "law-enforcement";
  if (/return to work|rtw/.test(haystack)) return "return-to-work";
  if (/fitness for duty|ffd/.test(haystack)) return "fitness-for-duty";
  if (/annual|periodic/.test(haystack)) return "annual";
  if (/pre[- ]?employment/.test(haystack)) return "pre-employment";
  return "other";
}

function categorizeCondition(conditionName: string): ConditionCategory {
  const value = conditionName.toLowerCase();
  if (/hypertension|heart|coronary|cardiac|arrhythmia|blood pressure/.test(value)) return "cardiovascular";
  if (/asthma|copd|respiratory|lung|apnea/.test(value)) return "respiratory";
  if (/diabetes|a1c|obesity|thyroid|metabolic/.test(value)) return "endocrine-metabolic";
  if (/seizure|epilepsy|migraine|neuro/.test(value)) return "neurologic";
  if (/depression|anxiety|ptsd|psychiatric|mental/.test(value)) return "psychiatric";
  if (/back|knee|shoulder|arthritis|orthopedic|fracture|sprain|strain/.test(value)) return "orthopedic";
  if (/sleep/.test(value)) return "sleep-disorder";
  if (/renal|kidney|egfr|creatinine/.test(value)) return "renal";
  return "other";
}

function buildConditions(points: ClinicalDataPoint[]): MedicalCondition[] {
  const conditions = unique(all(points, "medical_condition"));
  const medications = unique(all(points, "medication")).join("; ");
  const labs = unique(all(points, "lab_value")).join("; ");

  return conditions.map((conditionName) => ({
    id: generateId(),
    conditionName,
    category: categorizeCondition(conditionName),
    dateDiagnosed: "",
    status: /uncontrolled|elevated|poorly controlled/i.test(`${conditionName} ${labs}`) ? "uncontrolled" : "unclear",
    symptoms: "Extracted during secure local ingestion; verify against source record.",
    severity: /severe|uncontrolled|high risk/i.test(conditionName) ? 4 : 2,
    frequencyOfSymptoms: "Unknown from extracted document",
    lastFlare: "",
    treatmentPlan: medications ? `Medication(s) extracted: ${medications}` : "Treatment plan not clearly documented in extracted text.",
    currentMedications: medications,
    medicationSideEffects: "",
    specialist: "",
    hospitalizations: 0,
    erVisits: 0,
    surgeries: 0,
    recentLabs: labs,
    providerQuote: "",
    selfReported: "",
    functionalLimitations: "",
    restrictions: "",
    monitoringRequirements: labs ? `Review extracted labs: ${labs}` : "",
    incapacitationRisk: /seizure|syncope|hypoglycemia|cardiac|insulin/i.test(conditionName) ? "Possible" : "Unclear",
    recurrenceRisk: "Unclear",
    refrigerationNeeded: /insulin|semaglutide|ozempic/i.test(medications),
    specialtyFollowUp: /cardiac|seizure|copd|diabetes|renal|psychiatric/i.test(conditionName),
    emergencyAccessNeeded: /seizure|anaphylaxis|cardiac|insulin/i.test(`${conditionName} ${medications}`),
    notes: "Created from secure-ingested document. Human SME verification required before final recommendation.",
  }));
}

function buildDocumentationGaps(points: ClinicalDataPoint[], conditions: MedicalCondition[]): DocumentationGap[] {
  const explicit = unique(all(points, "documentation_gap"));
  const gaps: DocumentationGap[] = explicit.map((description) => ({
    id: generateId(),
    description,
    category: "Extracted documentation request",
    severity: /clearance|specialist|test|results|record/i.test(description) ? "moderate" : "low",
    relatedCondition: conditions[0]?.conditionName || "General",
    providerQuestion: `Please provide or clarify: ${description}`,
    custom: false,
  }));

  if (conditions.length && !conditions.some((c) => c.providerQuote || c.recentLabs || c.specialist)) {
    gaps.push({
      id: generateId(),
      description: "Provider documentation, objective testing, or specialist clearance was not clearly extracted for the identified conditions.",
      category: "Auto-detected ingestion gap",
      severity: "moderate",
      relatedCondition: conditions.map((c) => c.conditionName).join(", "),
      providerQuestion: "Please obtain provider documentation addressing diagnosis, stability, restrictions, medication side effects, and job-duty/deployment relevance.",
      custom: false,
    });
  }

  return gaps;
}

function buildRiskScores(conditions: MedicalCondition[], jobDuties: string[], deploymentCountry: string): RiskCategoryScore[] {
  const scores: RiskCategoryScore[] = [];
  if (conditions.length) {
    scores.push({
      category: "Clinical Stability",
      score: conditions.some((c) => c.status === "uncontrolled" || c.incapacitationRisk === "Possible") ? 3 : 2,
      whyFlagged: "Secure ingestion identified medical conditions requiring SME review.",
      supportingEvidence: conditions.map((c) => c.conditionName).join("; "),
      missingInformation: "Confirm objective stability, medication side effects, and provider restrictions.",
      jobRelevance: jobDuties.join("; ") || "Job duties not fully extracted.",
      guidelineRelevance: "Apply selected agency standard and condition-specific guidance.",
      environmentRelevance: deploymentCountry ? `Deployment/location context: ${deploymentCountry}` : "No location risk extracted.",
      smeQuestion: "Do the extracted conditions create unacceptable direct-threat, incapacitation, or duty-performance risk?",
      suggestedFollowUp: "Verify source records and obtain missing specialist/provider documentation.",
    });
  }

  if (jobDuties.length) {
    scores.push({
      category: "Essential Job Function Match",
      score: 2,
      whyFlagged: "The document contains extracted job duties/physical demands that should be compared with clinical restrictions.",
      supportingEvidence: jobDuties.join("; "),
      missingInformation: "Confirm official essential-function statement and whether accommodations are available.",
      jobRelevance: jobDuties.join("; "),
      guidelineRelevance: "Use agency and employer standard tabs for duty-specific criteria.",
      environmentRelevance: deploymentCountry || "Not specified",
      smeQuestion: "Are the extracted duties compatible with the examinee's current medical status?",
      suggestedFollowUp: "Request official job description when extracted duties are incomplete.",
    });
  }

  return scores;
}

export function createCaseFromExtraction(result: LocalProcessingResult): SMECase {
  const points = result.clinicalDataPoints;
  const now = new Date().toISOString();
  const conditions = buildConditions(points);
  const jobDutyValues = unique(all(points, "job_duty"));
  const deploymentCountry = first(points, "deployment_country");
  const caseId = first(points, "case_id") || `INGEST-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const agencyStandard = first(points, "agency_standard");
  const examType = inferExamType(points, result.redactedText);
  const documentationGaps = buildDocumentationGaps(points, conditions);

  return {
    id: generateId(),
    caseId,
    examineeName: first(points, "examinee_name") || "Secure-ingested examinee",
    dob: first(points, "dob"),
    age: 0,
    sex: first(points, "sex"),
    employer: first(points, "employer"),
    jobTitle: first(points, "job_title"),
    department: "",
    examType,
    reviewingSME: "",
    caseManager: "",
    dateOfExam: first(points, "exam_date") || new Date().toISOString().slice(0, 10),
    workLocation: "",
    deploymentCountry,
    agencyStandard,
    standards: { selected: agencyStandard ? [agencyStandard] : [], customNotes: agencyStandard ? `Extracted from ${result.sourceFileName}` : "" },
    notes: [
      `Created from secure local ingestion of ${result.sourceFileName}.`,
      `Extraction method: ${result.extractionMethod}.`,
      `PHI items redacted: ${result.detectedPHI.length}. Redaction confidence: ${Math.round(result.redactionConfidence * 100)}%.`,
      result.warning || "",
      "Review all extracted values against the source record before finalizing.",
    ].filter(Boolean).join("\n"),
    status: documentationGaps.length ? "Needs Records" : "Risk Review Needed",
    createdAt: now,
    updatedAt: now,
    medicalConditions: conditions,
    injuries: unique(all(points, "injury")).map((injuryType) => ({
      id: generateId(),
      injuryType,
      bodyRegion: "",
      dateOfInjury: "",
      mechanism: "Extracted from secure-ingested document",
      treatmentReceived: "",
      surgeriesPerformed: "",
      ptReceived: false,
      imagingType: "",
      residualPain: 0,
      residualWeakness: "",
      romLimitation: "",
      workRestrictions: "",
      reinjuryRisk: "Unclear",
      jobDutyRelevance: jobDutyValues.join("; "),
      providerQuote: "",
      documentationConfidence: "partial",
    })),
    jobDuties: {
      physicalDemands: jobDutyValues.filter((d) => /lift|carry|stand|walk|climb|drive|fire|weapon|respirator/i.test(d)),
      cognitiveDemands: jobDutyValues.filter((d) => /decision|attention|judgment|cognitive|safety/i.test(d)),
      environmentalDemands: jobDutyValues.filter((d) => /heat|cold|confined|respirator|deployment|altitude|hazard/i.test(d)),
      essentialFunctions: jobDutyValues.join("; "),
      clientRequirements: "Extracted from secure-ingested document; verify with official job description.",
      agencyStandardNotes: agencyStandard,
    },
    countryRisk: deploymentCountry ? {
      country: deploymentCountry,
      region: "",
      climateRisks: [],
      infectiousDiseaseRisks: [],
      vaccineRequirements: "Pending review against CDC/State Department sources.",
      medicationAvailability: "Pending review",
      localMedicalInfrastructure: "Pending review",
      evacuationConcerns: "Pending review",
      specialtyCareAvailability: "Pending review",
      pharmacyReliability: "Pending review",
      securityRisk: "Pending review",
      foodWaterSafety: "Pending review",
      occupationalExposureRisks: "Pending review",
      notes: "Country placeholder created from extracted deployment location. Use AOR tab to enrich with source-backed details.",
      sourceLink: "",
      lastReviewed: new Date().toISOString().slice(0, 10),
    } : null,
    occupationalData: null,
    healthEquity: null,
    riskScores: buildRiskScores(conditions, jobDutyValues, deploymentCountry),
    documentationGaps,
    smeAssessment: {
      clinicalInterpretation: conditions.length ? `Secure ingestion identified: ${conditions.map((c) => c.conditionName).join(", ")}.` : "No structured medical condition was confidently extracted.",
      occupationalRelevance: jobDutyValues.length ? `Extracted job duties: ${jobDutyValues.join("; ")}.` : "Official essential functions should be entered or confirmed.",
      riskLevel: conditions.length || jobDutyValues.length ? "Pending SME review" : "Unclear",
      documentationSufficiency: documentationGaps.length ? "Additional records needed" : "Partial; verify extracted source text",
      additionalRecordsNeeded: documentationGaps.map((g) => g.description).join("; "),
      finalRecommendation: "Draft only - not finalized",
      recommendationFreeText: unique(all(points, "recommendation")).join("; "),
      smeReviewNotes: result.scrubbedText,
      documentsReviewed: [result.sourceFileName],
      dateCompleted: "",
    },
  };
}
