/**
 * Advanced Risk Intelligence Engine - Expanded Version
 * Sophisticated probability calculation combining medical, occupational, and legal factors.
 * Integrates MOD 18, POST, NFPA, FMCSA, and DOT guidelines.
 */

import { SMECase, MedicalCondition, InjuryRecord } from "./types";

export interface RiskProbabilityResult {
  overallRiskScore: number; // 0-100
  injuryProbability: number; // 0-1 (0-100%)
  aggravationProbability: number; // 0-1
  directThreatScore: number; // 0-100 (legal compliance)
  riskFactors: RiskFactor[];
  protectiveFactors: ProtectiveFactor[];
  timeline: RiskTimeline[];
  legalAnalysis: LegalAnalysis;
  regulatoryCompliance: RegulatoryCompliance;
  explainability: ExplainabilityFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  name: string;
  severity: "high" | "moderate" | "low";
  probability: number; // 0-1
  weight: number; // 0-1
  source: "medical" | "occupational" | "environmental" | "legal" | "regulatory";
  description: string;
}

export interface ProtectiveFactor {
  name: string;
  strength: "strong" | "moderate" | "weak";
  probability: number; // 0-1
  weight: number; // 0-1
  description: string;
}

export interface RiskTimeline {
  period: string; // "0-3 months", "3-12 months", "1-5 years"
  probability: number; // 0-1
  severity: "low" | "moderate" | "high";
}

export interface LegalAnalysis {
  directThreatCriteria: DirectThreatCriteria;
  applicableLaws: string[];
  precedents: LegalPrecedent[];
  defensibility: number; // 0-100
  recommendations: string[];
}

export interface DirectThreatCriteria {
  duration: number; // 0-100 score
  severity: number; // 0-100 score
  likelihood: number; // 0-100 score
  imminence: number; // 0-100 score
  overallScore: number; // 0-100
}

export interface LegalPrecedent {
  case: string;
  year: number;
  relevance: string;
  outcome: string;
  applicability: "high" | "moderate" | "low";
}

export interface RegulatoryCompliance {
  mod18: ComplianceStatus;
  post: ComplianceStatus;
  nfpa1582: ComplianceStatus;
  fmcsa: ComplianceStatus;
  dot: ComplianceStatus;
}

export interface ComplianceStatus {
  status: "compliant" | "non-compliant" | "waiver-required" | "not-applicable";
  findings: string[];
  riskImpact: number; // 0-1
}

export interface ExplainabilityFactor {
  factor: string;
  impact: number; // -1 to 1
  description: string;
}

/**
 * Main calculation function
 */
export function calculateAdvancedRisk(caseData: SMECase): RiskProbabilityResult {
  const riskFactors = extractRiskFactors(caseData);
  const protectiveFactors = extractProtectiveFactors(caseData);
  const regulatory = assessRegulatoryCompliance(caseData);
  
  // Add regulatory risks to factors
  Object.values(regulatory).forEach(reg => {
    if (reg.status === "non-compliant" || reg.status === "waiver-required") {
      riskFactors.push({
        name: `Regulatory: ${reg.status.toUpperCase()}`,
        severity: reg.riskImpact > 0.7 ? "high" : "moderate",
        probability: reg.riskImpact,
        weight: 0.4,
        source: "regulatory",
        description: reg.findings.join("; "),
      });
    }
  });

  const injuryProb = calculateInjuryProbability(riskFactors, protectiveFactors);
  const aggravationProb = calculateAggravationProbability(caseData);
  const directThreat = calculateDirectThreatScore(caseData, injuryProb, aggravationProb);
  const timeline = generateRiskTimeline(caseData, injuryProb);
  const legalAnalysis = performLegalAnalysis(caseData, directThreat);
  const explainability = generateExplainability(riskFactors, protectiveFactors, regulatory);

  const overallRiskScore = Math.round(
    injuryProb * 50 + aggravationProb * 20 + (directThreat.likelihood / 100) * 15 + (calculateRegulatoryRisk(regulatory) * 15)
  );

  return {
    overallRiskScore,
    injuryProbability: injuryProb,
    aggravationProbability: aggravationProb,
    directThreatScore: directThreat.overallScore,
    riskFactors,
    protectiveFactors,
    timeline,
    legalAnalysis,
    regulatoryCompliance: regulatory,
    explainability,
    recommendations: generateRecommendations(
      injuryProb,
      aggravationProb,
      directThreat,
      caseData,
      regulatory
    ),
  };
}

/**
 * Extract risk factors from case data
 */
function extractRiskFactors(caseData: SMECase): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // Medical risk factors
  for (const condition of caseData.medicalConditions) {
    const medicalRisk = assessMedicalConditionRisk(condition);
    if (medicalRisk) {
      factors.push(medicalRisk);
    }
  }

  // Injury-related risk factors
  for (const injury of caseData.injuries) {
    const injuryRisk = assessInjuryRisk(injury);
    if (injuryRisk) {
      factors.push(injuryRisk);
    }
  }

  // Occupational risk factors
  const occRisk = assessOccupationalRisk(caseData);
  factors.push(...occRisk);

  // Environmental risk factors
  if (caseData.deploymentCountry && caseData.countryRisk) {
    const envRisk = assessEnvironmentalRisk(caseData);
    factors.push(...envRisk);
  }

  return factors;
}

/**
 * Assess medical condition risk
 */
function assessMedicalConditionRisk(condition: MedicalCondition): RiskFactor | null {
  const severityMap = { 1: 0.1, 2: 0.15, 3: 0.2, 4: 0.25, 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.65, 9: 0.8, 10: 0.95 };
  const baseProbability = severityMap[condition.severity as keyof typeof severityMap] || 0.3;

  // Adjust for status
  let statusMultiplier = 1;
  if (condition.status === "uncontrolled") statusMultiplier = 1.5;
  else if (condition.status === "active") statusMultiplier = 1.3;
  else if (condition.status === "stable") statusMultiplier = 0.8;
  else if (condition.status === "resolved") statusMultiplier = 0.3;

  // Adjust for incapacitation risk
  let incapMultiplier = 1;
  if (condition.incapacitationRisk === "Yes") incapMultiplier = 1.8;
  else if (condition.incapacitationRisk === "Possible") incapMultiplier = 1.4;

  const finalProbability = Math.min(1, baseProbability * statusMultiplier * incapMultiplier);

  return {
    name: `${condition.conditionName} (${condition.category})`,
    severity: condition.severity >= 7 ? "high" : condition.severity >= 4 ? "moderate" : "low",
    probability: finalProbability,
    weight: 0.35,
    source: "medical",
    description: `${condition.conditionName} - Status: ${condition.status}, Severity: ${condition.severity}/10`,
  };
}

/**
 * Assess injury risk
 */
function assessInjuryRisk(injury: InjuryRecord): RiskFactor | null {
  let baseProbability = 0.3;

  // Adjust for documentation confidence
  if (injury.documentationConfidence === "missing") baseProbability = 0.7;
  else if (injury.documentationConfidence === "unclear") baseProbability = 0.5;
  else if (injury.documentationConfidence === "documented") baseProbability = 0.2;
  
  // Adjust for residual pain
  if (injury.residualPain >= 7) baseProbability *= 1.5;
  else if (injury.residualPain >= 4) baseProbability *= 1.2;

  // Adjust for residual weakness
  if (injury.residualWeakness && injury.residualWeakness.length > 0) {
    baseProbability *= 1.3;
  }

  const finalProbability = Math.min(1, baseProbability);

  return {
    name: `${injury.injuryType} (${injury.bodyRegion})`,
    severity: injury.residualPain >= 7 ? "high" : injury.residualPain >= 4 ? "moderate" : "low",
    probability: finalProbability,
    weight: 0.25,
    source: "medical",
    description: `${injury.injuryType} - Residual pain: ${injury.residualPain}/10, Confidence: ${injury.documentationConfidence}`,
  };
}

/**
 * Assess occupational risk
 */
function assessOccupationalRisk(caseData: SMECase): RiskFactor[] {
  const factors: RiskFactor[] = [];
  const occData = caseData.occupationalData;

  if (!occData) return factors;

  // Physical demands risk
  if (caseData.jobDuties.physicalDemands.length > 0) {
    const physicalRisk = caseData.jobDuties.physicalDemands.length >= 4 ? 0.6 : 0.4;
    factors.push({
      name: "Physical Job Demands",
      severity: physicalRisk >= 0.6 ? "high" : "moderate",
      probability: physicalRisk,
      weight: 0.2,
      source: "occupational",
      description: `${caseData.jobDuties.physicalDemands.join(", ")}`,
    });
  }

  // Safety-sensitive role risk
  if (caseData.jobDuties.cognitiveDemands.includes("public safety") || 
      caseData.jobDuties.cognitiveDemands.includes("vehicle operation")) {
    factors.push({
      name: "Safety-Sensitive Role",
      severity: "high",
      probability: 0.8,
      weight: 0.25,
      source: "occupational",
      description: "Role involves public safety or vehicle operation - high incapacitation risk",
    });
  }

  // Occupational hazard risk
  if (occData.violenceRisk === "High" || occData.transportationRisk === "High") {
    factors.push({
      name: "Occupational Hazard Exposure",
      severity: "high",
      probability: 0.65,
      weight: 0.15,
      source: "occupational",
      description: `Violence risk: ${occData.violenceRisk}, Transportation risk: ${occData.transportationRisk}`,
    });
  }

  return factors;
}

/**
 * Assess environmental risk
 */
function assessEnvironmentalRisk(caseData: SMECase): RiskFactor[] {
  const factors: RiskFactor[] = [];
  const countryRisk = caseData.countryRisk;

  if (!countryRisk) return factors;

  // Healthcare access risk
  if (countryRisk.localMedicalInfrastructure && countryRisk.localMedicalInfrastructure.toLowerCase().includes("limited")) {
    factors.push({
      name: "Limited Healthcare Access",
      severity: "high",
      probability: 0.6,
      weight: 0.15,
      source: "environmental",
      description: `Deployment to ${caseData.deploymentCountry} with limited medical infrastructure`,
    });
  }

  // Environmental hazard risk
  if (countryRisk.climateRisks && countryRisk.climateRisks.length > 0) {
    factors.push({
      name: "Environmental Hazards",
      severity: "moderate",
      probability: 0.5,
      weight: 0.1,
      source: "environmental",
      description: `${countryRisk.climateRisks.join(", ")}`,
    });
  }

  // Disease risk
  if (countryRisk.infectiousDiseaseRisks && countryRisk.infectiousDiseaseRisks.length > 0) {
    factors.push({
      name: "Disease Risk",
      severity: "moderate",
      probability: 0.55,
      weight: 0.12,
      source: "environmental",
      description: `${countryRisk.infectiousDiseaseRisks.join(", ")}`,
    });
  }

  return factors;
}

/**
 * Extract protective factors
 */
function extractProtectiveFactors(caseData: SMECase): ProtectiveFactor[] {
  const factors: ProtectiveFactor[] = [];

  // Stable medical conditions
  const stableConditions = caseData.medicalConditions.filter(c => c.status === "resolved" || c.status === "stable");
  if (stableConditions.length > 0) {
    factors.push({
      name: "Stable/Resolved Medical Conditions",
      strength: "strong",
      probability: 0.7,
      weight: 0.2,
      description: `${stableConditions.length} condition(s) are stable or resolved`,
    });
  }

  // Specialist follow-up
  const withSpecialists = caseData.medicalConditions.filter(c => c.specialist);
  if (withSpecialists.length > 0) {
    factors.push({
      name: "Active Specialist Management",
      strength: "strong",
      probability: 0.6,
      weight: 0.2,
      description: `${withSpecialists.length} condition(s) managed by specialists`,
    });
  }

  // Good documentation
  if (caseData.documentationGaps.length === 0) {
    factors.push({
      name: "Complete Medical Documentation",
      strength: "strong",
      probability: 0.75,
      weight: 0.15,
      description: "All necessary medical records are complete and current",
    });
  }

  // Young age
  if (caseData.age && caseData.age < 40) {
    factors.push({
      name: "Younger Age",
      strength: "moderate",
      probability: 0.5,
      weight: 0.1,
      description: `Age ${caseData.age} - generally lower injury risk`,
    });
  }

  return factors;
}

/**
 * Assess Regulatory Compliance (MOD 18, POST, NFPA, FMCSA, DOT)
 */
function assessRegulatoryCompliance(caseData: SMECase): RegulatoryCompliance {
  const compliance: RegulatoryCompliance = {
    mod18: { status: "not-applicable", findings: [], riskImpact: 0 },
    post: { status: "not-applicable", findings: [], riskImpact: 0 },
    nfpa1582: { status: "not-applicable", findings: [], riskImpact: 0 },
    fmcsa: { status: "not-applicable", findings: [], riskImpact: 0 },
    dot: { status: "not-applicable", findings: [], riskImpact: 0 },
  };

  const isDeployment = caseData.examType === "deployment";
  const isLawEnforcement = caseData.examType === "law-enforcement";
  const isFirefighter = caseData.examType === "firefighter";
  const isAviation = caseData.examType === "aviation";
  const isDOT = caseData.examType === "dot-fmcsa";

  // MOD 18 Assessment
  if (isDeployment) {
    const findings: string[] = [];
    let riskImpact = 0;
    
    caseData.medicalConditions.forEach(c => {
      if (c.category === "respiratory" && c.severity > 5) {
        findings.push("MOD 18: Moderate/Severe respiratory condition requires waiver");
        riskImpact = Math.max(riskImpact, 0.8);
      }
      if (c.category === "neurologic" && c.conditionName.toLowerCase().includes("seizure")) {
        findings.push("MOD 18: Seizure history requires 1-year stability for waiver");
        riskImpact = Math.max(riskImpact, 0.9);
      }
      if (c.category === "endocrine-metabolic" && c.conditionName.toLowerCase().includes("diabetes") && c.severity > 6) {
        findings.push("MOD 18: HbA1c > 7.0 or insulin use is disqualifying");
        riskImpact = Math.max(riskImpact, 0.85);
      }
    });

    compliance.mod18 = {
      status: findings.length > 0 ? "waiver-required" : "compliant",
      findings,
      riskImpact,
    };
  }

  // NFPA 1582 Assessment
  if (isFirefighter) {
    const findings: string[] = [];
    let riskImpact = 0;
    
    caseData.medicalConditions.forEach(c => {
      if (c.category === "cardiovascular" && c.severity > 6) {
        findings.push("NFPA 1582: Category A Cardiac condition detected");
        riskImpact = Math.max(riskImpact, 0.95);
      }
      if (c.category === "respiratory" && c.severity > 7) {
        findings.push("NFPA 1582: Category A Respiratory condition detected");
        riskImpact = Math.max(riskImpact, 0.9);
      }
    });

    compliance.nfpa1582 = {
      status: findings.length > 0 ? "non-compliant" : "compliant",
      findings,
      riskImpact,
    };
  }

  // FMCSA / DOT Assessment
  if (isDOT) {
    const findings: string[] = [];
    let riskImpact = 0;
    
    caseData.medicalConditions.forEach(c => {
      if (c.category === "cardiovascular" && c.severity > 5) {
        findings.push("FMCSA: Cardiovascular condition requires specific certification");
        riskImpact = Math.max(riskImpact, 0.7);
      }
      if (c.category === "neurologic" && c.conditionName.toLowerCase().includes("seizure")) {
        findings.push("FMCSA: Seizure history generally requires 8-10 years seizure-free");
        riskImpact = Math.max(riskImpact, 0.95);
      }
    });

    compliance.fmcsa = {
      status: findings.length > 0 ? "non-compliant" : "compliant",
      findings,
      riskImpact,
    };
    compliance.dot = compliance.fmcsa;
  }

  // POST Assessment
  if (isLawEnforcement) {
    const findings: string[] = [];
    let riskImpact = 0;
    
    caseData.medicalConditions.forEach(c => {
      if (c.severity > 7) {
        findings.push(`POST: High severity ${c.category} condition requires individualized risk quantification`);
        riskImpact = Math.max(riskImpact, 0.75);
      }
    });

    compliance.post = {
      status: findings.length > 0 ? "waiver-required" : "compliant",
      findings,
      riskImpact,
    };
  }

  return compliance;
}

/**
 * Calculate overall regulatory risk
 */
function calculateRegulatoryRisk(compliance: RegulatoryCompliance): number {
  const impacts = Object.values(compliance).map(c => c.riskImpact);
  return Math.max(...impacts);
}

/**
 * Calculate injury probability using Bayesian approach
 */
function calculateInjuryProbability(
  riskFactors: RiskFactor[],
  protectiveFactors: ProtectiveFactor[]
): number {
  const priorProb = 0.3;
  let riskScore = 0;
  let totalRiskWeight = 0;
  for (const factor of riskFactors) {
    riskScore += factor.probability * factor.weight;
    totalRiskWeight += factor.weight;
  }
  const normalizedRiskScore = totalRiskWeight > 0 ? riskScore / totalRiskWeight : 0;

  let protectiveScore = 0;
  let totalProtectiveWeight = 0;
  for (const factor of protectiveFactors) {
    protectiveScore += factor.probability * factor.weight;
    totalProtectiveWeight += factor.weight;
  }
  const normalizedProtectiveScore = totalProtectiveWeight > 0 ? protectiveScore / totalProtectiveWeight : 0;

  const likelihood = normalizedRiskScore;
  const notLikelihood = 1 - normalizedProtectiveScore;
  const posterior = (likelihood * priorProb) / (likelihood * priorProb + notLikelihood * (1 - priorProb));

  return Math.min(1, Math.max(0, posterior));
}

/**
 * Calculate aggravation probability
 */
function calculateAggravationProbability(caseData: SMECase): number {
  let aggravationProb = 0.2;
  const unresolvedInjuries = caseData.injuries.filter(i => i.documentationConfidence !== "documented");
  if (unresolvedInjuries.length > 0) {
    aggravationProb += unresolvedInjuries.length * 0.15;
  }
  const activeConditions = caseData.medicalConditions.filter(c => c.status === "active" || c.status === "uncontrolled");
  if (activeConditions.length > 0) {
    aggravationProb += activeConditions.length * 0.12;
  }
  if (caseData.jobDuties.physicalDemands.length >= 4) {
    aggravationProb += 0.15;
  }
  return Math.min(1, aggravationProb);
}

/**
 * Calculate Direct Threat score per ADA/EEOC guidelines
 */
function calculateDirectThreatScore(
  caseData: SMECase,
  injuryProb: number,
  aggravationProb: number
): DirectThreatCriteria {
  const durationScore = Math.min(100, injuryProb * 100);
  const maxSeverity = Math.max(
    ...caseData.medicalConditions.map(c => c.severity),
    ...caseData.injuries.map(i => i.residualPain),
    0
  );
  const severityScore = Math.min(100, (maxSeverity / 10) * 100);
  const likelihoodScore = injuryProb * 100;
  let imminenceScore = 30;
  const activeConditions = caseData.medicalConditions.filter(c => c.status === "active" || c.status === "uncontrolled");
  if (activeConditions.length > 0) {
    imminenceScore = Math.min(100, 60 + activeConditions.length * 15);
  }
  const overallScore = Math.round((durationScore + severityScore + likelihoodScore + imminenceScore) / 4);
  return { duration: durationScore, severity: severityScore, likelihood: likelihoodScore, imminence: imminenceScore, overallScore };
}

/**
 * Generate risk timeline
 */
function generateRiskTimeline(caseData: SMECase, injuryProb: number): RiskTimeline[] {
  return [
    { period: "0-3 months", probability: injuryProb * 0.7, severity: injuryProb > 0.6 ? "high" : injuryProb > 0.3 ? "moderate" : "low" },
    { period: "3-12 months", probability: injuryProb * 0.85, severity: injuryProb > 0.5 ? "high" : injuryProb > 0.25 ? "moderate" : "low" },
    { period: "1-5 years", probability: injuryProb * 0.95, severity: injuryProb > 0.4 ? "high" : injuryProb > 0.2 ? "moderate" : "low" },
  ];
}

/**
 * Perform legal analysis
 */
function performLegalAnalysis(
  caseData: SMECase,
  directThreat: DirectThreatCriteria
): LegalAnalysis {
  const applicableLaws = ["Americans with Disabilities Act (ADA)", "EEOC Guidance on Fitness for Duty"];
  if (caseData.agencyStandard) applicableLaws.push(`${caseData.agencyStandard} Standards`);

  const precedents: LegalPrecedent[] = [
    { case: "Chevron U.S.A. Inc. v. Echazabal", year: 2002, relevance: "Employer right to consider direct threat to employee's own health", outcome: "Upheld", applicability: "high" },
    { case: "EEOC v. Prevo's Family Market", year: 2013, relevance: "Individualized assessment requirement", outcome: "Upheld", applicability: "high" },
  ];

  const defensibility = Math.min(100, (directThreat.overallScore * 0.5) + (caseData.documentationGaps.length === 0 ? 25 : 10));

  return {
    directThreatCriteria: directThreat,
    applicableLaws,
    precedents,
    defensibility,
    recommendations: [],
  };
}

/**
 * Generate Explainability Factors
 */
function generateExplainability(
  riskFactors: RiskFactor[],
  protectiveFactors: ProtectiveFactor[],
  regulatory: RegulatoryCompliance
): ExplainabilityFactor[] {
  const explainability: ExplainabilityFactor[] = [];

  riskFactors.sort((a, b) => b.probability * b.weight - a.probability * a.weight).slice(0, 3).forEach(f => {
    explainability.push({
      factor: f.name,
      impact: f.probability,
      description: `Primary risk driver: ${f.description}`,
    });
  });

  protectiveFactors.sort((a, b) => b.probability * b.weight - a.probability * a.weight).slice(0, 2).forEach(f => {
    explainability.push({
      factor: f.name,
      impact: -f.probability,
      description: `Mitigating factor: ${f.description}`,
    });
  });

  return explainability;
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  injuryProb: number,
  aggravationProb: number,
  directThreat: DirectThreatCriteria,
  caseData: SMECase,
  regulatory: RegulatoryCompliance
): string[] {
  const recommendations: string[] = [];

  if (injuryProb > 0.7) recommendations.push("CRITICAL: High probability of injury - employment restrictions mandatory");
  else if (injuryProb > 0.4) recommendations.push("WARNING: Moderate risk - conditional employment with strict monitoring");
  else recommendations.push("CLEARANCE: Low risk - recommended for full duty");

  Object.entries(regulatory).forEach(([key, val]) => {
    if (val.status === "non-compliant") recommendations.push(`REGULATORY FAILURE: Non-compliant with ${key.toUpperCase()} standards`);
    if (val.status === "waiver-required") recommendations.push(`REGULATORY ACTION: ${key.toUpperCase()} waiver process must be initiated`);
  });

  if (directThreat.overallScore > 70) recommendations.push("LEGAL: Direct threat criteria met - document individualized assessment immediately");

  return recommendations;
}
