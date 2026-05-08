/**
 * Counterfactual Analysis Module
 * "What-If" Scenario Modeling for Occupational Health Risk Mitigation
 * Shows exact impact of accommodations, treatments, and interventions on risk scores
 */

export interface Intervention {
  id: string;
  name: string;
  category: "medical" | "occupational" | "accommodation" | "monitoring" | "training";
  riskReduction: number; // 0-1, percentage reduction
  cost: number; // Estimated cost in USD
  timeToImplement: string; // e.g., "2 weeks", "1 month"
  effectiveness: "high" | "moderate" | "low";
  evidence: string; // Citation or reference
}

export interface CounterfactualScenario {
  scenarioName: string;
  baselineRisk: number;
  projectedRisk: number;
  riskReduction: number;
  interventions: Intervention[];
  feasibility: "high" | "moderate" | "low";
  legalDefensibility: "strong" | "moderate" | "weak";
  recommendation: string;
}

export interface CounterfactualAnalysisResult {
  currentRisk: number;
  scenarios: CounterfactualScenario[];
  optimalPath: CounterfactualScenario;
  riskReductionPotential: number; // 0-1
}

/**
 * Intervention Database
 * Evidence-based occupational health interventions
 */
export const interventionDatabase: Record<string, Intervention> = {
  // Medical Interventions
  "asthma-control": {
    id: "asthma-control",
    name: "Asthma Control Optimization (Inhaled Corticosteroids)",
    category: "medical",
    riskReduction: 0.35,
    cost: 150,
    timeToImplement: "2-4 weeks",
    effectiveness: "high",
    evidence: "GINA Guidelines 2024; NHLBI Asthma Management",
  },
  "hypertension-management": {
    id: "hypertension-management",
    name: "Hypertension Control (ACE Inhibitor + Diuretic)",
    category: "medical",
    riskReduction: 0.40,
    cost: 200,
    timeToImplement: "1-2 months",
    effectiveness: "high",
    evidence: "ACC/AHA Hypertension Guidelines 2023",
  },
  "diabetes-optimization": {
    id: "diabetes-optimization",
    name: "Diabetes Management (HbA1c < 7.0)",
    category: "medical",
    riskReduction: 0.38,
    cost: 300,
    timeToImplement: "3-6 months",
    effectiveness: "high",
    evidence: "ADA Standards of Care 2024",
  },
  "cardiac-rehabilitation": {
    id: "cardiac-rehabilitation",
    name: "Cardiac Rehabilitation Program (12 weeks)",
    category: "medical",
    riskReduction: 0.45,
    cost: 2500,
    timeToImplement: "12 weeks",
    effectiveness: "high",
    evidence: "AHA/ACC Cardiac Rehab Guidelines",
  },
  "seizure-stability": {
    id: "seizure-stability",
    name: "Seizure Disorder Optimization (Anti-Epileptic Medication Adjustment)",
    category: "medical",
    riskReduction: 0.50,
    cost: 400,
    timeToImplement: "4-8 weeks",
    effectiveness: "high",
    evidence: "AES Seizure Management Guidelines",
  },
  "sleep-apnea-treatment": {
    id: "sleep-apnea-treatment",
    name: "Sleep Apnea Treatment (CPAP Therapy)",
    category: "medical",
    riskReduction: 0.42,
    cost: 1500,
    timeToImplement: "2-4 weeks",
    effectiveness: "high",
    evidence: "AASM Sleep Apnea Guidelines",
  },

  // Occupational Interventions
  "ergonomic-assessment": {
    id: "ergonomic-assessment",
    name: "Comprehensive Ergonomic Workstation Assessment",
    category: "occupational",
    riskReduction: 0.25,
    cost: 500,
    timeToImplement: "1-2 weeks",
    effectiveness: "moderate",
    evidence: "OSHA Ergonomic Guidelines; NIOSH Recommendations",
  },
  "hazard-elimination": {
    id: "hazard-elimination",
    name: "Primary Hazard Elimination (Engineering Controls)",
    category: "occupational",
    riskReduction: 0.55,
    cost: 5000,
    timeToImplement: "4-12 weeks",
    effectiveness: "high",
    evidence: "OSHA Hierarchy of Controls",
  },
  "exposure-reduction": {
    id: "exposure-reduction",
    name: "Occupational Exposure Reduction (Administrative Controls)",
    category: "occupational",
    riskReduction: 0.30,
    cost: 1000,
    timeToImplement: "2-4 weeks",
    effectiveness: "moderate",
    evidence: "NIOSH Occupational Exposure Limits",
  },
  "job-rotation": {
    id: "job-rotation",
    name: "Job Rotation Program (Reduce Repetitive Strain)",
    category: "occupational",
    riskReduction: 0.20,
    cost: 0,
    timeToImplement: "1 week",
    effectiveness: "moderate",
    evidence: "OSHA Repetitive Strain Guidelines",
  },
  "shift-modification": {
    id: "shift-modification",
    name: "Shift Modification (Reduced Hours / Flexible Schedule)",
    category: "occupational",
    riskReduction: 0.28,
    cost: 0,
    timeToImplement: "1 week",
    effectiveness: "moderate",
    evidence: "Fatigue Risk Management Guidelines",
  },

  // Accommodations
  "ppe-upgrade": {
    id: "ppe-upgrade",
    name: "Personal Protective Equipment Upgrade (PAPR, N95 Respirator)",
    category: "accommodation",
    riskReduction: 0.35,
    cost: 800,
    timeToImplement: "1 week",
    effectiveness: "high",
    evidence: "OSHA PPE Standards 1910.134",
  },
  "mobility-aid": {
    id: "mobility-aid",
    name: "Mobility Aid (Cane, Walker, Wheelchair)",
    category: "accommodation",
    riskReduction: 0.30,
    cost: 500,
    timeToImplement: "1 week",
    effectiveness: "moderate",
    evidence: "ADA Reasonable Accommodations",
  },
  "assistive-technology": {
    id: "assistive-technology",
    name: "Assistive Technology (Voice Recognition, Screen Reader)",
    category: "accommodation",
    riskReduction: 0.22,
    cost: 2000,
    timeToImplement: "2-4 weeks",
    effectiveness: "moderate",
    evidence: "ADA Technology Accommodations",
  },
  "modified-duties": {
    id: "modified-duties",
    name: "Modified Job Duties (Temporary or Permanent)",
    category: "accommodation",
    riskReduction: 0.40,
    cost: 0,
    timeToImplement: "1 week",
    effectiveness: "high",
    evidence: "ADA Reasonable Accommodations Framework",
  },

  // Monitoring & Training
  "occupational-health-monitoring": {
    id: "occupational-health-monitoring",
    name: "Enhanced Occupational Health Monitoring (Quarterly Exams)",
    category: "monitoring",
    riskReduction: 0.15,
    cost: 600,
    timeToImplement: "ongoing",
    effectiveness: "moderate",
    evidence: "OSHA Medical Surveillance Guidelines",
  },
  "fitness-for-duty": {
    id: "fitness-for-duty",
    name: "Periodic Fitness-for-Duty Evaluation",
    category: "monitoring",
    riskReduction: 0.20,
    cost: 500,
    timeToImplement: "1 day",
    effectiveness: "moderate",
    evidence: "Occupational Medicine Best Practices",
  },
  "safety-training": {
    id: "safety-training",
    name: "Comprehensive Safety Training Program",
    category: "training",
    riskReduction: 0.18,
    cost: 300,
    timeToImplement: "1-2 weeks",
    effectiveness: "moderate",
    evidence: "OSHA Training Requirements",
  },
  "stress-management": {
    id: "stress-management",
    name: "Stress Management & Mental Health Support",
    category: "training",
    riskReduction: 0.22,
    cost: 400,
    timeToImplement: "ongoing",
    effectiveness: "moderate",
    evidence: "ACOEM Mental Health Guidelines",
  },
};

/**
 * Generate counterfactual scenarios based on risk profile
 */
export function generateCounterfactualScenarios(
  caseData: any,
  riskAnalysis: any
): CounterfactualAnalysisResult {
  const currentRisk = riskAnalysis.overallRiskScore / 100;
  const scenarios: CounterfactualScenario[] = [];

  // Scenario 1: Medical Optimization Only
  const medicalInterventions = [
    interventionDatabase["asthma-control"],
    interventionDatabase["hypertension-management"],
    interventionDatabase["diabetes-optimization"],
    interventionDatabase["sleep-apnea-treatment"],
  ].filter(i => isRelevantIntervention(i, caseData));

  if (medicalInterventions.length > 0) {
    const medicalRiskReduction = medicalInterventions.reduce((sum, i) => sum + i.riskReduction, 0) * 0.6; // Diminishing returns
    scenarios.push({
      scenarioName: "Medical Optimization Only",
      baselineRisk: currentRisk,
      projectedRisk: Math.max(0, currentRisk - medicalRiskReduction),
      riskReduction: medicalRiskReduction,
      interventions: medicalInterventions,
      feasibility: "high",
      legalDefensibility: "strong",
      recommendation: "Implement medical management strategies with occupational physician oversight",
    });
  }

  // Scenario 2: Occupational Controls Only
  const occupationalInterventions = [
    interventionDatabase["ergonomic-assessment"],
    interventionDatabase["hazard-elimination"],
    interventionDatabase["exposure-reduction"],
    interventionDatabase["job-rotation"],
  ].filter(i => isRelevantIntervention(i, caseData));

  if (occupationalInterventions.length > 0) {
    const occupationalRiskReduction = occupationalInterventions.reduce((sum, i) => sum + i.riskReduction, 0) * 0.5;
    scenarios.push({
      scenarioName: "Occupational Controls Only",
      baselineRisk: currentRisk,
      projectedRisk: Math.max(0, currentRisk - occupationalRiskReduction),
      riskReduction: occupationalRiskReduction,
      interventions: occupationalInterventions,
      feasibility: "moderate",
      legalDefensibility: "strong",
      recommendation: "Implement engineering and administrative controls per OSHA hierarchy",
    });
  }

  // Scenario 3: Accommodations & Monitoring
  const accommodationInterventions = [
    interventionDatabase["ppe-upgrade"],
    interventionDatabase["modified-duties"],
    interventionDatabase["occupational-health-monitoring"],
    interventionDatabase["fitness-for-duty"],
  ].filter(i => isRelevantIntervention(i, caseData));

  if (accommodationInterventions.length > 0) {
    const accommodationRiskReduction = accommodationInterventions.reduce((sum, i) => sum + i.riskReduction, 0) * 0.55;
    scenarios.push({
      scenarioName: "Accommodations & Monitoring",
      baselineRisk: currentRisk,
      projectedRisk: Math.max(0, currentRisk - accommodationRiskReduction),
      riskReduction: accommodationRiskReduction,
      interventions: accommodationInterventions,
      feasibility: "high",
      legalDefensibility: "strong",
      recommendation: "Implement ADA-compliant accommodations with enhanced monitoring",
    });
  }

  // Scenario 4: Comprehensive Multi-Intervention Approach
  const allInterventions = [
    ...medicalInterventions.slice(0, 2),
    ...occupationalInterventions.slice(0, 2),
    ...accommodationInterventions.slice(0, 2),
    interventionDatabase["safety-training"],
  ];

  const comprehensiveRiskReduction = Math.min(0.75, allInterventions.reduce((sum, i) => sum + i.riskReduction, 0) * 0.45);
  scenarios.push({
    scenarioName: "Comprehensive Multi-Intervention Approach",
    baselineRisk: currentRisk,
    projectedRisk: Math.max(0, currentRisk - comprehensiveRiskReduction),
    riskReduction: comprehensiveRiskReduction,
    interventions: allInterventions,
    feasibility: "moderate",
    legalDefensibility: "very strong",
    recommendation: "Implement integrated approach combining medical, occupational, and accommodation strategies",
  });

  // Find optimal path (highest risk reduction with high feasibility)
  const optimalPath = scenarios.reduce((best, current) => {
    const currentScore = current.riskReduction * 0.7 + (current.feasibility === "high" ? 0.3 : 0.15);
    const bestScore = best.riskReduction * 0.7 + (best.feasibility === "high" ? 0.3 : 0.15);
    return currentScore > bestScore ? current : best;
  });

  return {
    currentRisk,
    scenarios,
    optimalPath,
    riskReductionPotential: Math.max(...scenarios.map(s => s.riskReduction)),
  };
}

/**
 * Check if intervention is relevant to case
 */
function isRelevantIntervention(intervention: Intervention, caseData: any): boolean {
  const conditionLower = (caseData.medicalConditions || []).map((c: any) => c.conditionName.toLowerCase());
  const jobLower = caseData.jobTitle.toLowerCase();

  // Medical interventions
  if (intervention.id.includes("asthma") && conditionLower.some(c => c.includes("asthma"))) return true;
  if (intervention.id.includes("hypertension") && conditionLower.some(c => c.includes("hypertension"))) return true;
  if (intervention.id.includes("diabetes") && conditionLower.some(c => c.includes("diabetes"))) return true;
  if (intervention.id.includes("seizure") && conditionLower.some(c => c.includes("seizure"))) return true;
  if (intervention.id.includes("sleep-apnea") && conditionLower.some(c => c.includes("sleep"))) return true;
  if (intervention.id.includes("cardiac") && conditionLower.some(c => c.includes("heart") || c.includes("cardiac"))) return true;

  // Occupational interventions
  if (intervention.id.includes("ergonomic") && (jobLower.includes("computer") || jobLower.includes("desk"))) return true;
  if (intervention.id.includes("exposure") && (jobLower.includes("hazmat") || jobLower.includes("chemical"))) return true;
  if (intervention.id.includes("shift") && (jobLower.includes("driver") || jobLower.includes("shift"))) return true;

  // Always relevant
  if (intervention.category === "monitoring" || intervention.category === "training") return true;

  return false;
}

/**
 * Calculate intervention cost-effectiveness
 */
export function calculateCostEffectiveness(intervention: Intervention, currentRisk: number): number {
  const riskReductionValue = currentRisk * intervention.riskReduction * 100000; // Assume $100k per 1% risk reduction
  const costEffectiveness = riskReductionValue / intervention.cost;
  return costEffectiveness;
}

/**
 * Generate counterfactual report
 */
export function generateCounterfactualReport(result: CounterfactualAnalysisResult): string {
  let report = "# COUNTERFACTUAL ANALYSIS: RISK MITIGATION SCENARIOS\n\n";
  report += `## Current Risk Level: ${(result.currentRisk * 100).toFixed(1)}%\n`;
  report += `## Maximum Risk Reduction Potential: ${(result.riskReductionPotential * 100).toFixed(1)}%\n\n`;

  report += "## Recommended Scenario\n";
  report += `**${result.optimalPath.scenarioName}**\n`;
  report += `- Projected Risk: ${(result.optimalPath.projectedRisk * 100).toFixed(1)}%\n`;
  report += `- Risk Reduction: ${(result.optimalPath.riskReduction * 100).toFixed(1)}%\n`;
  report += `- Feasibility: ${result.optimalPath.feasibility}\n`;
  report += `- Legal Defensibility: ${result.optimalPath.legalDefensibility}\n`;
  report += `- Recommendation: ${result.optimalPath.recommendation}\n\n`;

  report += "## All Scenarios\n";
  result.scenarios.forEach((scenario, idx) => {
    report += `\n### Scenario ${idx + 1}: ${scenario.scenarioName}\n`;
    report += `- Baseline Risk: ${(scenario.baselineRisk * 100).toFixed(1)}%\n`;
    report += `- Projected Risk: ${(scenario.projectedRisk * 100).toFixed(1)}%\n`;
    report += `- Risk Reduction: ${(scenario.riskReduction * 100).toFixed(1)}%\n`;
    report += `- Interventions:\n`;
    scenario.interventions.forEach(i => {
      report += `  - ${i.name} (${(i.riskReduction * 100).toFixed(0)}% reduction, $${i.cost})\n`;
    });
  });

  return report;
}
