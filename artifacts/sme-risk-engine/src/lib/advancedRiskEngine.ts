/**
 * Advanced Risk Intelligence Engine
 * Sophisticated probability calculation combining medical, occupational, and legal factors
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
  recommendations: string[];
}

export interface RiskFactor {
  name: string;
  severity: "high" | "moderate" | "low";
  probability: number; // 0-1
  weight: number; // 0-1
  source: "medical" | "occupational" | "environmental" | "legal";
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

/**
 * Main calculation function
 */
export function calculateAdvancedRisk(caseData: SMECase): RiskProbabilityResult {
  const riskFactors = extractRiskFactors(caseData);
  const protectiveFactors = extractProtectiveFactors(caseData);
  const injuryProb = calculateInjuryProbability(riskFactors, protectiveFactors);
  const aggravationProb = calculateAggravationProbability(caseData);
  const directThreat = calculateDirectThreatScore(caseData, injuryProb, aggravationProb);
  const timeline = generateRiskTimeline(caseData, injuryProb);
  const legalAnalysis = performLegalAnalysis(caseData, directThreat);

  const overallRiskScore = Math.round(
    injuryProb * 60 + aggravationProb * 25 + (directThreat.likelihood / 100) * 15
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
    recommendations: generateRecommendations(
      injuryProb,
      aggravationProb,
      directThreat,
      caseData
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
  else  if (injury.documentationConfidence === "documented") baseProbability = 0.2;
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

  // Good health equity factors
  if (caseData.healthEquity) {
    const he = caseData.healthEquity;
    if (he.accessToCare === "Adequate" || he.accessToCare === "Good") {
      factors.push({
        name: "Good Healthcare Access",
        strength: "moderate",
        probability: 0.55,
        weight: 0.1,
        description: "Adequate access to ongoing medical care",
      });
    }
  }

  return factors;
}

/**
 * Calculate injury probability using Bayesian approach
 */
function calculateInjuryProbability(
  riskFactors: RiskFactor[],
  protectiveFactors: ProtectiveFactor[]
): number {
  // Prior probability (baseline)
  const priorProb = 0.3;

  // Calculate weighted risk
  let riskScore = 0;
  let totalRiskWeight = 0;
  for (const factor of riskFactors) {
    riskScore += factor.probability * factor.weight;
    totalRiskWeight += factor.weight;
  }
  const normalizedRiskScore = totalRiskWeight > 0 ? riskScore / totalRiskWeight : 0;

  // Calculate weighted protective
  let protectiveScore = 0;
  let totalProtectiveWeight = 0;
  for (const factor of protectiveFactors) {
    protectiveScore += factor.probability * factor.weight;
    totalProtectiveWeight += factor.weight;
  }
  const normalizedProtectiveScore = totalProtectiveWeight > 0 ? protectiveScore / totalProtectiveWeight : 0;

  // Bayesian update
  const likelihood = normalizedRiskScore;
  const notLikelihood = 1 - normalizedProtectiveScore;
  const posterior = (likelihood * priorProb) / (likelihood * priorProb + notLikelihood * (1 - priorProb));

  return Math.min(1, Math.max(0, posterior));
}

/**
 * Calculate aggravation probability
 */
function calculateAggravationProbability(caseData: SMECase): number {
  let aggravationProb = 0.2; // Base probability

  // Increase if there are unresolved injuries
  const unresolvedInjuries = caseData.injuries.filter(i => i.documentationConfidence !== "documented");
  if (unresolvedInjuries.length > 0) {
    aggravationProb += unresolvedInjuries.length * 0.15;
  }

  // Increase if there are active conditions
  const activeConditions = caseData.medicalConditions.filter(c => c.status === "active" || c.status === "uncontrolled");
  if (activeConditions.length > 0) {
    aggravationProb += activeConditions.length * 0.12;
  }

  // Increase if job demands are high
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
  // Duration: How long will the risk persist?
  const durationScore = Math.min(100, injuryProb * 100);

  // Severity: What is the worst-case scenario?
  const maxSeverity = Math.max(
    ...caseData.medicalConditions.map(c => c.severity),
    ...caseData.injuries.map(i => i.residualPain)
  );
  const severityScore = Math.min(100, (maxSeverity / 10) * 100);

  // Likelihood: What is the probability of harm?
  const likelihoodScore = injuryProb * 100;

  // Imminence: How soon could this happen?
  let imminenceScore = 30; // Base
  const activeConditions = caseData.medicalConditions.filter(c => c.status === "active" || c.status === "uncontrolled");
  if (activeConditions.length > 0) {
    imminenceScore = Math.min(100, 60 + activeConditions.length * 15);
  }

  const overallScore = Math.round((durationScore + severityScore + likelihoodScore + imminenceScore) / 4);

  return {
    duration: durationScore,
    severity: severityScore,
    likelihood: likelihoodScore,
    imminence: imminenceScore,
    overallScore,
  };
}

/**
 * Generate risk timeline
 */
function generateRiskTimeline(caseData: SMECase, injuryProb: number): RiskTimeline[] {
  const timeline: RiskTimeline[] = [];

  // Short term (0-3 months)
  timeline.push({
    period: "0-3 months",
    probability: injuryProb * 0.7,
    severity: injuryProb > 0.6 ? "high" : injuryProb > 0.3 ? "moderate" : "low",
  });

  // Medium term (3-12 months)
  timeline.push({
    period: "3-12 months",
    probability: injuryProb * 0.85,
    severity: injuryProb > 0.5 ? "high" : injuryProb > 0.25 ? "moderate" : "low",
  });

  // Long term (1-5 years)
  timeline.push({
    period: "1-5 years",
    probability: injuryProb * 0.95,
    severity: injuryProb > 0.4 ? "high" : injuryProb > 0.2 ? "moderate" : "low",
  });

  return timeline;
}

/**
 * Perform legal analysis
 */
function performLegalAnalysis(
  caseData: SMECase,
  directThreat: DirectThreatCriteria
): LegalAnalysis {
  const applicableLaws = ["Americans with Disabilities Act (ADA)", "EEOC Guidance on Fitness for Duty"];

  if (caseData.agencyStandard) {
    applicableLaws.push(`${caseData.agencyStandard} Standards`);
  }

  const precedents: LegalPrecedent[] = [
    {
      case: "Chevron U.S.A. Inc. v. Echazabal",
      year: 2002,
      relevance: "Establishes employer right to consider direct threat to employee's own health",
      outcome: "Employers can deny employment based on occupational health risk",
      applicability: "high",
    },
    {
      case: "Bragdon v. Abbott",
      year: 1998,
      relevance: "Defines disability and substantial limitation in major life activities",
      outcome: "Broad interpretation of disability under ADA",
      applicability: "moderate",
    },
    {
      case: "EEOC v. Prevo's Family Market",
      year: 2013,
      relevance: "Direct threat assessment must be individualized and based on objective evidence",
      outcome: "Employers must conduct individualized risk assessment",
      applicability: "high",
    },
  ];

  // Defensibility score based on documentation and risk factors
  const defensibility = Math.min(
    100,
    (directThreat.overallScore * 0.5) + (caseData.documentationGaps.length === 0 ? 25 : 10)
  );

  const recommendations = [];
  if (directThreat.overallScore > 70) {
    recommendations.push("High direct threat score - strong legal basis for employment restrictions");
  }
  if (caseData.documentationGaps.length > 0) {
    recommendations.push("Obtain additional medical documentation to strengthen legal position");
  }
  if (defensibility < 50) {
    recommendations.push("Conduct additional individualized assessment to improve defensibility");
  }

  return {
    directThreatCriteria: directThreat,
    applicableLaws,
    precedents,
    defensibility,
    recommendations,
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  injuryProb: number,
  aggravationProb: number,
  directThreat: DirectThreatCriteria,
  caseData: SMECase
): string[] {
  const recommendations: string[] = [];

  if (injuryProb > 0.7) {
    recommendations.push("HIGH RISK: Recommend employment restrictions or alternative duties");
  } else if (injuryProb > 0.4) {
    recommendations.push("MODERATE RISK: Recommend conditional employment with medical monitoring");
  } else {
    recommendations.push("LOW RISK: Recommend for employment with standard occupational health precautions");
  }

  if (aggravationProb > 0.5) {
    recommendations.push("High risk of injury aggravation - consider modified duty assignment");
  }

  if (directThreat.overallScore > 70) {
    recommendations.push("Direct threat criteria met - document individualized assessment thoroughly");
  }

  if (caseData.documentationGaps.length > 3) {
    recommendations.push("Obtain additional medical records before final determination");
  }

  if (caseData.deploymentCountry && caseData.countryRisk?.localMedicalInfrastructure?.toLowerCase().includes("limited")) {
    recommendations.push("Limited healthcare access in deployment location — increase medical monitoring");
  }

  return recommendations;
}
