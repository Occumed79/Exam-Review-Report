/**
 * Fairness & Bias Analysis Module
 * Implements fairness testing across demographic subgroups
 * Ensures equitable occupational health risk assessment
 */

export interface FairnessMetrics {
  demographicGroup: string;
  sampleSize: number;
  meanRiskScore: number;
  stdDevRiskScore: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  equitability: number; // 0-1, higher is more equitable
  disparityRatio: number; // ratio to baseline group
}

export interface BiasAnalysisResult {
  overallBiasScore: number; // 0-1, 0 = no bias
  groupMetrics: FairnessMetrics[];
  findings: string[];
  recommendations: string[];
}

/**
 * Demographic groups for fairness testing
 */
export const demographicGroups = {
  age: ["18-30", "31-45", "46-55", "56-65", "65+"],
  sex: ["Male", "Female", "Other"],
  jobCategory: ["Safety-Sensitive", "Non-Safety-Sensitive", "Healthcare", "Transportation", "Construction"],
  riskLevel: ["Low-Risk", "Moderate-Risk", "High-Risk"],
};

/**
 * Calculate fairness metrics for a demographic group
 */
export function calculateFairnessMetrics(
  group: string,
  riskScores: number[],
  actualOutcomes: boolean[]
): FairnessMetrics {
  const meanRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
  const variance = riskScores.reduce((sum, score) => sum + Math.pow(score - meanRisk, 2), 0) / riskScores.length;
  const stdDev = Math.sqrt(variance);

  // Calculate false positive rate (predicted high risk, no injury)
  const falsePositives = riskScores.filter((score, idx) => score > 0.7 && !actualOutcomes[idx]).length;
  const falsePositiveRate = falsePositives / riskScores.filter((_, idx) => !actualOutcomes[idx]).length;

  // Calculate false negative rate (predicted low risk, injury occurred)
  const falseNegatives = riskScores.filter((score, idx) => score < 0.3 && actualOutcomes[idx]).length;
  const falseNegativeRate = falseNegatives / riskScores.filter((_, idx) => actualOutcomes[idx]).length;

  // Equitability: inverse of variance in outcomes (lower variance = more equitable)
  const equitability = Math.max(0, 1 - stdDev);

  return {
    demographicGroup: group,
    sampleSize: riskScores.length,
    meanRiskScore: meanRisk,
    stdDevRiskScore: stdDev,
    falsePositiveRate,
    falseNegativeRate,
    equitability,
    disparityRatio: 1, // Will be calculated relative to baseline
  };
}

/**
 * Perform comprehensive bias analysis
 */
export function performBiasAnalysis(
  caseData: any,
  riskAnalysis: any,
  historicalData: any[]
): BiasAnalysisResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let overallBiasScore = 0;

  // Analyze age bias
  const ageGroups = groupByAge(historicalData);
  const ageMetrics = Object.entries(ageGroups).map(([group, scores]) =>
    calculateFairnessMetrics(`Age: ${group}`, scores as number[], [])
  );

  const ageDisparity = Math.max(...ageMetrics.map(m => m.disparityRatio)) - Math.min(...ageMetrics.map(m => m.disparityRatio));
  if (ageDisparity > 0.2) {
    findings.push(`AGE BIAS DETECTED: Risk scores vary by ${(ageDisparity * 100).toFixed(1)}% across age groups`);
    recommendations.push("Review age-related risk factors for potential bias");
    overallBiasScore += 0.3;
  }

  // Analyze sex bias
  const sexGroups = groupBySex(historicalData);
  const sexMetrics = Object.entries(sexGroups).map(([group, scores]) =>
    calculateFairnessMetrics(`Sex: ${group}`, scores as number[], [])
  );

  const sexDisparity = Math.max(...sexMetrics.map(m => m.disparityRatio)) - Math.min(...sexMetrics.map(m => m.disparityRatio));
  if (sexDisparity > 0.15) {
    findings.push(`SEX BIAS DETECTED: Risk scores vary by ${(sexDisparity * 100).toFixed(1)}% between sexes`);
    recommendations.push("Validate sex-specific risk factors for occupational relevance");
    overallBiasScore += 0.25;
  }

  // Analyze job category bias
  const jobGroups = groupByJobCategory(historicalData);
  const jobMetrics = Object.entries(jobGroups).map(([group, scores]) =>
    calculateFairnessMetrics(`Job: ${group}`, scores as number[], [])
  );

  const jobDisparity = Math.max(...jobMetrics.map(m => m.disparityRatio)) - Math.min(...jobMetrics.map(m => m.disparityRatio));
  if (jobDisparity > 0.3) {
    findings.push(`JOB CATEGORY BIAS: Risk scores vary by ${(jobDisparity * 100).toFixed(1)}% across job categories`);
    recommendations.push("Ensure occupational risk factors are job-specific and defensible");
    overallBiasScore += 0.2;
  }

  // Check for equalized odds (equal false positive and false negative rates across groups)
  const allMetrics = [...ageMetrics, ...sexMetrics, ...jobMetrics];
  const fpRates = allMetrics.map(m => m.falsePositiveRate);
  const fnRates = allMetrics.map(m => m.falseNegativeRate);

  const fpDisparity = Math.max(...fpRates) - Math.min(...fpRates);
  const fnDisparity = Math.max(...fnRates) - Math.min(...fnRates);

  if (fpDisparity > 0.1 || fnDisparity > 0.1) {
    findings.push(`EQUALIZED ODDS VIOLATION: False positive/negative rates differ across groups`);
    recommendations.push("Apply algorithmic fairness techniques to equalize error rates");
    overallBiasScore += 0.25;
  }

  // Calibration check: are predicted probabilities accurate within groups?
  const calibrationIssues = allMetrics.filter(m => Math.abs(m.meanRiskScore - 0.5) > 0.3);
  if (calibrationIssues.length > 0) {
    findings.push(`CALIBRATION ISSUES: ${calibrationIssues.length} groups show poor probability calibration`);
    recommendations.push("Recalibrate risk model using isotonic regression or Platt scaling");
    overallBiasScore += 0.2;
  }

  return {
    overallBiasScore: Math.min(1, overallBiasScore),
    groupMetrics: allMetrics,
    findings,
    recommendations,
  };
}

/**
 * Group historical data by age
 */
function groupByAge(data: any[]): Record<string, number[]> {
  const groups: Record<string, number[]> = {
    "18-30": [],
    "31-45": [],
    "46-55": [],
    "56-65": [],
    "65+": [],
  };

  data.forEach(item => {
    if (!item.age) return;
    if (item.age <= 30) groups["18-30"].push(item.riskScore || 0.5);
    else if (item.age <= 45) groups["31-45"].push(item.riskScore || 0.5);
    else if (item.age <= 55) groups["46-55"].push(item.riskScore || 0.5);
    else if (item.age <= 65) groups["56-65"].push(item.riskScore || 0.5);
    else groups["65+"].push(item.riskScore || 0.5);
  });

  return groups;
}

/**
 * Group historical data by sex
 */
function groupBySex(data: any[]): Record<string, number[]> {
  const groups: Record<string, number[]> = {
    Male: [],
    Female: [],
    Other: [],
  };

  data.forEach(item => {
    if (!item.sex) return;
    if (item.sex === "M" || item.sex === "Male") groups.Male.push(item.riskScore || 0.5);
    else if (item.sex === "F" || item.sex === "Female") groups.Female.push(item.riskScore || 0.5);
    else groups.Other.push(item.riskScore || 0.5);
  });

  return groups;
}

/**
 * Group historical data by job category
 */
function groupByJobCategory(data: any[]): Record<string, number[]> {
  const groups: Record<string, number[]> = {
    "Safety-Sensitive": [],
    "Non-Safety-Sensitive": [],
    Healthcare: [],
    Transportation: [],
    Construction: [],
  };

  data.forEach(item => {
    if (!item.jobCategory) return;
    const category = item.jobCategory.toLowerCase();
    if (category.includes("safety") || category.includes("police") || category.includes("fire")) {
      groups["Safety-Sensitive"].push(item.riskScore || 0.5);
    } else if (category.includes("health") || category.includes("medical")) {
      groups.Healthcare.push(item.riskScore || 0.5);
    } else if (category.includes("transport") || category.includes("driver")) {
      groups.Transportation.push(item.riskScore || 0.5);
    } else if (category.includes("construct")) {
      groups.Construction.push(item.riskScore || 0.5);
    } else {
      groups["Non-Safety-Sensitive"].push(item.riskScore || 0.5);
    }
  });

  return groups;
}

/**
 * Generate fairness report
 */
export function generateFairnessReport(biasAnalysis: BiasAnalysisResult): string {
  let report = "# FAIRNESS & BIAS ANALYSIS REPORT\n\n";
  report += `## Overall Bias Score: ${(biasAnalysis.overallBiasScore * 100).toFixed(1)}%\n`;
  report += `(0% = No bias detected, 100% = Severe bias)\n\n`;

  report += "## Key Findings\n";
  biasAnalysis.findings.forEach(f => {
    report += `- ${f}\n`;
  });

  report += "\n## Recommendations\n";
  biasAnalysis.recommendations.forEach(r => {
    report += `- ${r}\n`;
  });

  report += "\n## Demographic Group Metrics\n";
  report += "| Group | Sample Size | Mean Risk | Std Dev | FP Rate | FN Rate | Equitability |\n";
  report += "|-------|-------------|-----------|---------|---------|---------|---------------|\n";

  biasAnalysis.groupMetrics.forEach(m => {
    report += `| ${m.demographicGroup} | ${m.sampleSize} | ${m.meanRiskScore.toFixed(2)} | ${m.stdDevRiskScore.toFixed(2)} | ${(m.falsePositiveRate * 100).toFixed(1)}% | ${(m.falseNegativeRate * 100).toFixed(1)}% | ${(m.equitability * 100).toFixed(1)}% |\n`;
  });

  return report;
}

/**
 * Check if model meets fairness criteria
 */
export function meetsEquityStandards(biasAnalysis: BiasAnalysisResult): boolean {
  // Criteria: Overall bias < 20%, no group has disparity > 25%
  if (biasAnalysis.overallBiasScore > 0.2) return false;

  const maxDisparity = Math.max(...biasAnalysis.groupMetrics.map(m => m.disparityRatio));
  if (maxDisparity > 1.25) return false;

  return true;
}
