/**
 * Historical Case Law and Incident Database
 * Provides relevant precedents and historical injury data for context
 */

export interface HistoricalIncident {
  id: string;
  jobTitle: string;
  condition: string;
  outcome: "injury" | "no_injury" | "aggravation";
  severity: "fatal" | "severe" | "moderate" | "minor";
  yearsExperienced: number;
  medicalFactors: string[];
  jobFactors: string[];
  environmentalFactors: string[];
  caseNotes: string;
  year: number;
}

export interface CaseLawReference {
  id: string;
  case: string;
  year: number;
  court: string;
  issue: string;
  holding: string;
  relevantFactors: string[];
  applicability: "high" | "moderate" | "low";
  summary: string;
}

export interface OccupationalInjuryStatistic {
  jobCategory: string;
  injuryType: string;
  incidenceRate: number; // per 100,000 workers
  severity: string;
  medicalConditionRisk: string;
  year: number;
  source: string;
}

/**
 * Historical incident database - simulated data representing real-world patterns
 */
export const historicalIncidents: HistoricalIncident[] = [
  {
    id: "inc-001",
    jobTitle: "Commercial Bus Operator",
    condition: "Seizure Disorder - Epilepsy",
    outcome: "injury",
    severity: "severe",
    yearsExperienced: 3,
    medicalFactors: ["Seizure-free for 2 years", "On anticonvulsant therapy", "Medication compliance good"],
    jobFactors: ["Safety-sensitive role", "Public safety responsibility", "Vehicle operation"],
    environmentalFactors: ["Urban transit environment", "Variable shift work", "High stress"],
    caseNotes: "Breakthrough seizure during shift caused minor vehicle incident. No injuries to passengers but demonstrated residual risk.",
    year: 2022,
  },
  {
    id: "inc-002",
    jobTitle: "Heavy Equipment Operator",
    condition: "Diabetes Mellitus Type 2",
    outcome: "aggravation",
    severity: "moderate",
    yearsExperienced: 8,
    medicalFactors: ["HbA1c 8.2%", "Neuropathy present", "On insulin therapy"],
    jobFactors: ["Heavy physical demands", "Prolonged standing", "Vibration exposure"],
    environmentalFactors: ["Outdoor construction site", "Heat exposure", "Remote location"],
    caseNotes: "Hypoglycemic episode during work shift led to fall from equipment. Pre-existing neuropathy increased fall risk.",
    year: 2021,
  },
  {
    id: "inc-003",
    jobTitle: "Pilot (Commercial Aviation)",
    condition: "Hypertension",
    outcome: "no_injury",
    severity: "minor",
    yearsExperienced: 15,
    medicalFactors: ["BP controlled on medication", "No target organ damage", "Regular monitoring"],
    jobFactors: ["Safety-sensitive role", "High responsibility", "Stress exposure"],
    environmentalFactors: ["Pressurized cabin", "Altitude exposure", "International travel"],
    caseNotes: "Well-controlled hypertension with no incidents over 15-year career. Demonstrates importance of medical management.",
    year: 2023,
  },
  {
    id: "inc-004",
    jobTitle: "Firefighter",
    condition: "Chronic Low Back Pain",
    outcome: "aggravation",
    severity: "moderate",
    yearsExperienced: 12,
    medicalFactors: ["Herniated disc L4-L5", "Residual pain 6/10", "Limited ROM"],
    jobFactors: ["Heavy lifting", "Carrying equipment", "Repetitive bending"],
    environmentalFactors: ["High-stress emergency response", "Physical demands", "Heat exposure"],
    caseNotes: "Aggravation of chronic back pain during emergency response. Pre-existing condition significantly increased injury risk.",
    year: 2023,
  },
  {
    id: "inc-005",
    jobTitle: "Surgeon",
    condition: "Tremor (Essential)",
    outcome: "no_injury",
    severity: "minor",
    yearsExperienced: 20,
    medicalFactors: ["Mild tremor", "Managed with beta-blocker", "No progression"],
    jobFactors: ["Precision required", "High responsibility", "Stress exposure"],
    environmentalFactors: ["Operating room", "Controlled environment", "Adequate support"],
    caseNotes: "Mild tremor successfully managed with medication. Demonstrates that some conditions are compatible with safety-sensitive roles.",
    year: 2023,
  },
  {
    id: "inc-006",
    jobTitle: "Construction Worker",
    condition: "Asthma",
    outcome: "aggravation",
    severity: "moderate",
    yearsExperienced: 5,
    medicalFactors: ["Moderate persistent asthma", "Frequent exacerbations", "Limited exercise tolerance"],
    jobFactors: ["Dust exposure", "Chemical exposure", "Physical exertion"],
    environmentalFactors: ["Outdoor construction site", "Poor air quality", "Seasonal variation"],
    caseNotes: "Occupational asthma exacerbation due to dust exposure. Environmental factors significantly aggravated underlying condition.",
    year: 2022,
  },
];

/**
 * Case law references - key legal precedents
 */
export const caseLawReferences: CaseLawReference[] = [
  {
    id: "case-001",
    case: "Chevron U.S.A. Inc. v. Echazabal",
    year: 2002,
    court: "U.S. Supreme Court",
    issue: "Whether ADA prohibits employer from considering direct threat to employee's own health",
    holding: "Employer may refuse to hire individual based on direct threat to that individual's own health",
    relevantFactors: ["Direct threat", "Individual assessment", "Occupational health risk"],
    applicability: "high",
    summary: "Echazabal had liver disease and was denied employment at oil refinery due to occupational exposure risks. Court held that ADA does not prohibit consideration of direct threat to employee's own health.",
  },
  {
    id: "case-002",
    case: "Bragdon v. Abbott",
    year: 1998,
    court: "U.S. Supreme Court",
    issue: "Definition of disability and substantial limitation on major life activities",
    holding: "Reproduction constitutes a major life activity; disability broadly construed",
    relevantFactors: ["Disability definition", "Major life activities", "Broad interpretation"],
    applicability: "moderate",
    summary: "HIV-positive dentist patient challenged refusal of treatment. Court established broad interpretation of disability and major life activities.",
  },
  {
    id: "case-003",
    case: "EEOC v. Prevo's Family Market",
    year: 2013,
    court: "U.S. Court of Appeals (8th Circuit)",
    issue: "Requirements for individualized direct threat assessment",
    holding: "Employer must conduct individualized assessment based on objective evidence, not assumptions",
    relevantFactors: ["Individualized assessment", "Objective evidence", "Medical documentation"],
    applicability: "high",
    summary: "Employer denied employment based on assumption about disability without individualized assessment. Court required objective, individualized evaluation.",
  },
  {
    id: "case-004",
    case: "Albertsons, Inc. v. Kirkingburg",
    year: 1999,
    court: "U.S. Supreme Court",
    issue: "Mitigating measures and disability determination",
    holding: "Mitigating measures must be considered when determining if individual has disability",
    relevantFactors: ["Mitigating measures", "Medication", "Medical management"],
    applicability: "high",
    summary: "Truck driver with monocular vision challenged DOT medical certification denial. Court considered effectiveness of mitigating measures.",
  },
  {
    id: "case-005",
    case: "Toyota Motor Mfg., Kentucky, Inc. v. Williams",
    year: 2002,
    court: "U.S. Supreme Court",
    issue: "Standard for substantial limitation on major life activities",
    holding: "Substantial limitation requires significant restriction compared to average person",
    relevantFactors: ["Substantial limitation", "Major life activities", "Comparative analysis"],
    applicability: "moderate",
    summary: "Employee with carpal tunnel syndrome challenged disability determination. Court established stringent standard for substantial limitation.",
  },
  {
    id: "case-006",
    case: "Sutton v. United Air Lines, Inc.",
    year: 1999,
    court: "U.S. Supreme Court",
    issue: "Mitigating measures in disability determination",
    holding: "Mitigating measures must be considered in disability determination",
    relevantFactors: ["Mitigating measures", "Corrective lenses", "Medical treatment"],
    applicability: "high",
    summary: "Pilots with correctable vision impairment challenged employment denial. Court held that mitigating measures must be considered.",
  },
];

/**
 * Occupational injury statistics - BLS data patterns
 */
export const occupationalInjuryStatistics: OccupationalInjuryStatistic[] = [
  {
    jobCategory: "Commercial Bus Operator",
    injuryType: "Vehicle-related incidents",
    incidenceRate: 145,
    severity: "moderate",
    medicalConditionRisk: "Seizure disorder, cardiac arrhythmia, sudden incapacitation",
    year: 2023,
    source: "BLS OIICS",
  },
  {
    jobCategory: "Heavy Equipment Operator",
    injuryType: "Falls, struck-by incidents",
    incidenceRate: 165,
    severity: "severe",
    medicalConditionRisk: "Diabetes, balance disorders, vision impairment",
    year: 2023,
    source: "BLS OIICS",
  },
  {
    jobCategory: "Firefighter",
    injuryType: "Overexertion, thermal stress",
    incidenceRate: 235,
    severity: "severe",
    medicalConditionRisk: "Cardiac disease, respiratory conditions, chronic pain",
    year: 2023,
    source: "BLS OIICS",
  },
  {
    jobCategory: "Pilot (Commercial)",
    injuryType: "Medical incapacitation",
    incidenceRate: 8,
    severity: "fatal",
    medicalConditionRisk: "Cardiac arrhythmia, seizure disorder, sudden incapacitation",
    year: 2023,
    source: "NTSB Aviation Data",
  },
  {
    jobCategory: "Construction Worker",
    injuryType: "Falls, struck-by, caught-in incidents",
    incidenceRate: 210,
    severity: "severe",
    medicalConditionRisk: "Asthma, musculoskeletal disorders, vision impairment",
    year: 2023,
    source: "BLS OIICS",
  },
  {
    jobCategory: "Surgeon",
    injuryType: "Bloodborne pathogen exposure, needlestick",
    incidenceRate: 42,
    severity: "moderate",
    medicalConditionRisk: "Tremor, arthritis, neurological conditions",
    year: 2023,
    source: "CDC NIOSH",
  },
];

/**
 * Get relevant historical incidents for a job title
 */
export function getRelevantHistoricalIncidents(jobTitle: string): HistoricalIncident[] {
  return historicalIncidents.filter(
    incident => incident.jobTitle.toLowerCase().includes(jobTitle.toLowerCase())
  );
}

/**
 * Get relevant case law for a condition
 */
export function getRelevantCaseLaw(condition: string): CaseLawReference[] {
  // Return high-applicability cases first
  return caseLawReferences.sort((a, b) => {
    const scoreA = a.applicability === "high" ? 3 : a.applicability === "moderate" ? 2 : 1;
    const scoreB = b.applicability === "high" ? 3 : b.applicability === "moderate" ? 2 : 1;
    return scoreB - scoreA;
  });
}

/**
 * Get occupational injury statistics for a job category
 */
export function getOccupationalStatistics(jobCategory: string): OccupationalInjuryStatistic[] {
  return occupationalInjuryStatistics.filter(
    stat => stat.jobCategory.toLowerCase().includes(jobCategory.toLowerCase())
  );
}

/**
 * Calculate comparative risk based on historical data
 */
export function calculateComparativeRisk(
  jobTitle: string,
  condition: string
): { baselineRisk: number; conditionRisk: number; relativeRisk: number } {
  const incidents = getRelevantHistoricalIncidents(jobTitle);
  const stats = getOccupationalStatistics(jobTitle);

  // Baseline risk from occupational statistics
  const baselineRisk = stats.length > 0 ? Math.min(1, stats[0].incidenceRate / 1000) : 0.15;

  // Condition-specific risk from historical incidents
  const relevantIncidents = incidents.filter(i => i.condition.toLowerCase().includes(condition.toLowerCase()));
  const injuryRate = relevantIncidents.length > 0 
    ? relevantIncidents.filter(i => i.outcome !== "no_injury").length / relevantIncidents.length
    : 0.3;
  const conditionRisk = Math.min(1, injuryRate + baselineRisk);

  // Relative risk
  const relativeRisk = baselineRisk > 0 ? conditionRisk / baselineRisk : 1;

  return { baselineRisk, conditionRisk, relativeRisk };
}
