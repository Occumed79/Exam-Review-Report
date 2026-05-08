/**
 * Longitudinal Health Modeling
 * Projects health outcomes and occupational risk over 10-20 year career
 */

export interface HealthTrajectory {
  year: number;
  age: number;
  projectedRiskScore: number;
  conditionProgression: string;
  functionalCapacityDecline: number; // 0-1
  estimatedDisabilityRisk: number; // 0-1
  retirementLiability: number; // 0-1
  interventionOpportunities: string[];
}

export interface LongitudinalAnalysis {
  applicantAge: number;
  careerLength: number; // years
  currentRiskScore: number;
  trajectories: HealthTrajectory[];
  careerLiabilityScore: number; // Overall 10-20 year risk
  criticalYears: number[]; // Years where risk spikes
  interventionPoints: Array<{ year: number; intervention: string; impact: number }>;
  retirementRecommendation: number; // Recommended retirement age
}

/**
 * Disease Progression Models (Evidence-Based)
 */
const diseaseProgressionModels: Record<string, (year: number, baselineScore: number) => number> = {
  // Cardiovascular disease: 5-10% annual risk increase
  cardiovascular: (year: number, baseline: number) => {
    return Math.min(1, baseline + year * 0.07);
  },

  // Diabetes: 3-5% annual progression
  diabetes: (year: number, baseline: number) => {
    return Math.min(1, baseline + year * 0.04);
  },

  // Respiratory (COPD): 8-12% annual decline
  respiratory: (year: number, baseline: number) => {
    return Math.min(1, baseline + year * 0.1);
  },

  // Musculoskeletal: 2-4% annual decline
  musculoskeletal: (year: number, baseline: number) => {
    return Math.min(1, baseline + year * 0.03);
  },

  // Neurological: 1-3% annual progression
  neurological: (year: number, baseline: number) => {
    return Math.min(1, baseline + year * 0.02);
  },

  // Mental health: 2-5% annual progression
  mentalHealth: (year: number, baseline: number) => {
    return Math.min(1, baseline + year * 0.035);
  },

  // Stable (well-managed): 0-1% annual change
  stable: (year: number, baseline: number) => {
    return Math.min(1, baseline + year * 0.005);
  },
};

/**
 * Calculate Longitudinal Health Trajectory
 */
export function calculateLongitudinalTrajectory(
  caseData: any,
  careerLengthYears: number = 20
): LongitudinalAnalysis {
  const applicantAge = caseData.age || 35;
  const currentRiskScore = caseData.riskScore || 0.5;

  const trajectories: HealthTrajectory[] = [];
  let cumulativeRisk = 0;
  const criticalYears: number[] = [];
  const interventionPoints: Array<{ year: number; intervention: string; impact: number }> = [];

  // Generate year-by-year projections
  for (let year = 0; year <= careerLengthYears; year++) {
    const age = applicantAge + year;
    let projectedRisk = currentRiskScore;

    // Apply disease progression models
    caseData.medicalConditions?.forEach((condition: any) => {
      const conditionType = condition.type || "stable";
      const progressionModel = diseaseProgressionModels[conditionType] || diseaseProgressionModels.stable;
      const conditionRisk = progressionModel(year, condition.riskScore || 0.3);
      projectedRisk = Math.max(projectedRisk, conditionRisk * 0.3); // Weight condition risk
    });

    // Age-related risk increase (1-2% per year after 45)
    if (age > 45) {
      const ageRiskIncrease = (age - 45) * 0.015;
      projectedRisk = Math.min(1, projectedRisk + ageRiskIncrease * 0.2);
    }

    // Functional capacity decline
    const functionalCapacityDecline = Math.min(1, year * 0.03); // 3% per year

    // Disability risk (increases with age and risk score)
    const estimatedDisabilityRisk = Math.min(1, projectedRisk * (1 + functionalCapacityDecline));

    // Retirement liability (risk of needing to retire early)
    const retirementLiability = Math.min(1, estimatedDisabilityRisk * (age / 65));

    // Identify critical years (risk spike > 20% increase)
    if (year > 0 && projectedRisk - trajectories[year - 1].projectedRiskScore > 0.2) {
      criticalYears.push(year);
    }

    // Identify intervention opportunities
    const interventions = identifyInterventions(condition, projectedRisk, year);
    const interventionOpportunities = interventions.map(i => i.intervention);

    trajectories.push({
      year,
      age,
      projectedRiskScore: projectedRisk,
      conditionProgression: caseData.medicalConditions?.[0]?.conditionName || "Unknown",
      functionalCapacityDecline,
      estimatedDisabilityRisk,
      retirementLiability,
      interventionOpportunities,
    });

    // Track cumulative risk
    cumulativeRisk += projectedRisk;

    // Add to intervention points
    interventions.forEach(i => {
      interventionPoints.push({
        year,
        intervention: i.intervention,
        impact: i.impact,
      });
    });
  }

  // Calculate career liability score
  const careerLiabilityScore = cumulativeRisk / trajectories.length;

  // Recommend retirement age
  let retirementRecommendation = 65;
  for (const trajectory of trajectories) {
    if (trajectory.estimatedDisabilityRisk > 0.7) {
      retirementRecommendation = trajectory.age;
      break;
    }
  }

  return {
    applicantAge,
    careerLength: careerLengthYears,
    currentRiskScore,
    trajectories,
    careerLiabilityScore,
    criticalYears,
    interventionPoints,
    retirementRecommendation,
  };
}

/**
 * Identify Intervention Opportunities
 */
function identifyInterventions(
  condition: any,
  riskScore: number,
  year: number
): Array<{ intervention: string; impact: number }> {
  const interventions: Array<{ intervention: string; impact: number }> = [];

  if (riskScore > 0.6 && year % 2 === 0) {
    interventions.push({
      intervention: "Preventive health screening",
      impact: 0.1,
    });
  }

  if (condition?.type === "cardiovascular") {
    interventions.push({
      intervention: "Cardiac rehabilitation program",
      impact: 0.15,
    });
  }

  if (condition?.type === "respiratory") {
    interventions.push({
      intervention: "Pulmonary function testing and optimization",
      impact: 0.12,
    });
  }

  if (condition?.type === "musculoskeletal") {
    interventions.push({
      intervention: "Ergonomic assessment and job modification",
      impact: 0.2,
    });
  }

  if (year === 5 || year === 10) {
    interventions.push({
      intervention: "Comprehensive occupational health reassessment",
      impact: 0.08,
    });
  }

  return interventions;
}

/**
 * Generate Longitudinal Report
 */
export function generateLongitudinalReport(analysis: LongitudinalAnalysis): string {
  let report = "# LONGITUDINAL HEALTH & CAREER TRAJECTORY ANALYSIS\n\n";

  report += `## Career Overview\n`;
  report += `- **Current Age**: ${analysis.applicantAge}\n`;
  report += `- **Career Length Analyzed**: ${analysis.careerLength} years\n`;
  report += `- **Current Risk Score**: ${(analysis.currentRiskScore * 100).toFixed(1)}%\n`;
  report += `- **Career Liability Score**: ${(analysis.careerLiabilityScore * 100).toFixed(1)}%\n`;
  report += `- **Recommended Retirement Age**: ${analysis.retirementRecommendation}\n\n`;

  report += `## Risk Trajectory\n`;
  report += `| Year | Age | Risk Score | Disability Risk | Retirement Liability |\n`;
  report += `| :--- | :--- | :--- | :--- | :--- |\n`;
  analysis.trajectories.forEach(t => {
    report += `| ${t.year} | ${t.age} | ${(t.projectedRiskScore * 100).toFixed(1)}% | ${(t.estimatedDisabilityRisk * 100).toFixed(1)}% | ${(t.retirementLiability * 100).toFixed(1)}% |\n`;
  });
  report += "\n";

  if (analysis.criticalYears.length > 0) {
    report += `## Critical Years (Risk Spike)\n`;
    analysis.criticalYears.forEach(year => {
      report += `- **Year ${year}**: High-risk period requiring enhanced monitoring\n`;
    });
    report += "\n";
  }

  if (analysis.interventionPoints.length > 0) {
    report += `## Intervention Opportunities\n`;
    analysis.interventionPoints.forEach(ip => {
      report += `- **Year ${ip.year}**: ${ip.intervention} (Expected Impact: ${(ip.impact * 100).toFixed(0)}%)\n`;
    });
    report += "\n";
  }

  report += `## Conclusion\n`;
  report += `Based on longitudinal modeling, the applicant's career trajectory shows a ${analysis.careerLiabilityScore < 0.4 ? "favorable" : analysis.careerLiabilityScore < 0.7 ? "moderate" : "high"} long-term occupational outlook.\n`;
  report += `Recommended retirement age is ${analysis.retirementRecommendation}. Proactive health management and workplace accommodations can extend career viability.\n`;

  return report;
}

export default {
  calculateLongitudinalTrajectory,
  generateLongitudinalReport,
};
