/**
 * Social Determinants of Health (SDoH) Module
 * Integrates socioeconomic, environmental, and behavioral factors into risk assessment
 * Based on CDC/AHRQ SDoH frameworks
 */

export interface SocialDeterminant {
  category: "economic" | "education" | "social" | "environmental" | "behavioral";
  factor: string;
  level: "low" | "moderate" | "high";
  riskImpact: number; // -0.3 to 0.3
  evidence: string;
}

export interface SDoHProfile {
  economicFactors: SocialDeterminant[];
  educationFactors: SocialDeterminant[];
  socialFactors: SocialDeterminant[];
  environmentalFactors: SocialDeterminant[];
  behavioralFactors: SocialDeterminant[];
}

export interface SDoHAnalysisResult {
  overallSDoHRisk: number; // 0-1
  riskAdjustment: number; // -0.3 to 0.3
  vulnerabilityScore: number; // 0-1
  protectiveFactors: string[];
  riskFactors: string[];
  recommendations: string[];
}

/**
 * Assess economic factors
 */
export function assessEconomicFactors(caseData: any): SocialDeterminant[] {
  const factors: SocialDeterminant[] = [];

  // Income level
  const income = caseData.income || 0;
  if (income < 25000) {
    factors.push({
      category: "economic",
      factor: "Low Income (< $25k/year)",
      level: "high",
      riskImpact: 0.15,
      evidence: "Limited access to healthcare, preventive care, and occupational health services",
    });
  } else if (income < 50000) {
    factors.push({
      category: "economic",
      factor: "Moderate Income ($25k-$50k/year)",
      level: "moderate",
      riskImpact: 0.05,
      evidence: "Some healthcare access but may delay preventive care",
    });
  } else {
    factors.push({
      category: "economic",
      factor: "Higher Income (> $50k/year)",
      level: "low",
      riskImpact: -0.05,
      evidence: "Better access to healthcare and occupational health services",
    });
  }

  // Employment stability
  if (caseData.employmentStatus === "unstable" || caseData.yearsAtJob < 1) {
    factors.push({
      category: "economic",
      factor: "Employment Instability",
      level: "high",
      riskImpact: 0.12,
      evidence: "Job insecurity increases stress and may delay medical care",
    });
  } else if (caseData.yearsAtJob < 5) {
    factors.push({
      category: "economic",
      factor: "Moderate Job Tenure",
      level: "moderate",
      riskImpact: 0.03,
      evidence: "Some job security but less established workplace relationships",
    });
  }

  // Health insurance coverage
  if (!caseData.hasHealthInsurance) {
    factors.push({
      category: "economic",
      factor: "No Health Insurance",
      level: "high",
      riskImpact: 0.18,
      evidence: "Uninsured individuals delay medical care and have worse health outcomes",
    });
  } else if (caseData.insuranceType === "public") {
    factors.push({
      category: "economic",
      factor: "Public Health Insurance",
      level: "moderate",
      riskImpact: 0.02,
      evidence: "May have limited provider networks",
    });
  }

  return factors;
}

/**
 * Assess education factors
 */
export function assessEducationFactors(caseData: any): SocialDeterminant[] {
  const factors: SocialDeterminant[] = [];

  // Educational attainment
  const education = caseData.educationLevel || "high-school";
  if (education === "less-than-high-school") {
    factors.push({
      category: "education",
      factor: "Less Than High School Education",
      level: "high",
      riskImpact: 0.12,
      evidence: "Lower health literacy associated with worse occupational health outcomes",
    });
  } else if (education === "high-school") {
    factors.push({
      category: "education",
      factor: "High School Education",
      level: "moderate",
      riskImpact: 0.03,
      evidence: "Moderate health literacy",
    });
  } else if (education === "college" || education === "graduate") {
    factors.push({
      category: "education",
      factor: "College/Graduate Education",
      level: "low",
      riskImpact: -0.08,
      evidence: "Higher health literacy and better health management",
    });
  }

  // Health literacy
  if (caseData.healthLiteracy === "low") {
    factors.push({
      category: "education",
      factor: "Low Health Literacy",
      level: "high",
      riskImpact: 0.10,
      evidence: "Difficulty understanding medical information and treatment adherence",
    });
  }

  return factors;
}

/**
 * Assess social factors
 */
export function assessSocialFactors(caseData: any): SocialDeterminant[] {
  const factors: SocialDeterminant[] = [];

  // Social support
  if (caseData.socialSupport === "low" || caseData.livingAlone) {
    factors.push({
      category: "social",
      factor: "Limited Social Support",
      level: "high",
      riskImpact: 0.14,
      evidence: "Social isolation increases stress and reduces health management capacity",
    });
  } else if (caseData.socialSupport === "moderate") {
    factors.push({
      category: "social",
      factor: "Moderate Social Support",
      level: "moderate",
      riskImpact: 0.02,
      evidence: "Some support network available",
    });
  } else {
    factors.push({
      category: "social",
      factor: "Strong Social Support",
      level: "low",
      riskImpact: -0.10,
      evidence: "Strong social networks improve health outcomes and stress management",
    });
  }

  // Discrimination or stigma
  if (caseData.experiencesDiscrimination) {
    factors.push({
      category: "social",
      factor: "Experiences Discrimination/Stigma",
      level: "high",
      riskImpact: 0.16,
      evidence: "Discrimination increases chronic stress and health risks",
    });
  }

  return factors;
}

/**
 * Assess environmental factors
 */
export function assessEnvironmentalFactors(caseData: any): SocialDeterminant[] {
  const factors: SocialDeterminant[] = [];

  // Housing stability
  if (caseData.housingStatus === "unstable" || caseData.housingStatus === "homeless") {
    factors.push({
      category: "environmental",
      factor: "Housing Instability/Homelessness",
      level: "high",
      riskImpact: 0.20,
      evidence: "Housing instability severely impacts health and occupational capacity",
    });
  } else if (caseData.housingStatus === "at-risk") {
    factors.push({
      category: "environmental",
      factor: "At-Risk Housing",
      level: "high",
      riskImpact: 0.12,
      evidence: "Risk of housing loss increases stress",
    });
  }

  // Neighborhood safety
  if (caseData.neighborhoodSafety === "low") {
    factors.push({
      category: "environmental",
      factor: "Low Neighborhood Safety",
      level: "high",
      riskImpact: 0.13,
      evidence: "Unsafe neighborhoods increase stress and limit physical activity",
    });
  }

  // Access to healthy food
  if (caseData.foodInsecurity) {
    factors.push({
      category: "environmental",
      factor: "Food Insecurity",
      level: "high",
      riskImpact: 0.11,
      evidence: "Food insecurity associated with worse health outcomes",
    });
  }

  // Environmental hazards
  if (caseData.environmentalHazards) {
    factors.push({
      category: "environmental",
      factor: "Environmental Hazard Exposure",
      level: "high",
      riskImpact: 0.15,
      evidence: "Home/community environmental hazards (lead, pollution, etc.)",
    });
  }

  return factors;
}

/**
 * Assess behavioral factors
 */
export function assessBehavioralFactors(caseData: any): SocialDeterminant[] {
  const factors: SocialDeterminant[] = [];

  // Substance use
  if (caseData.substanceUse === "active") {
    factors.push({
      category: "behavioral",
      factor: "Active Substance Use",
      level: "high",
      riskImpact: 0.25,
      evidence: "Substance use significantly increases injury risk and impairs judgment",
    });
  } else if (caseData.substanceUse === "in-recovery") {
    factors.push({
      category: "behavioral",
      factor: "Substance Use Disorder (In Recovery)",
      level: "moderate",
      riskImpact: 0.08,
      evidence: "Recovery status is protective but ongoing risk",
    });
  }

  // Smoking
  if (caseData.smoker) {
    factors.push({
      category: "behavioral",
      factor: "Tobacco Use",
      level: "moderate",
      riskImpact: 0.10,
      evidence: "Smoking increases cardiovascular and respiratory risks",
    });
  }

  // Physical activity
  if (caseData.physicalActivity === "sedentary") {
    factors.push({
      category: "behavioral",
      factor: "Sedentary Lifestyle",
      level: "high",
      riskImpact: 0.12,
      evidence: "Lack of physical activity reduces occupational capacity",
    });
  } else if (caseData.physicalActivity === "active") {
    factors.push({
      category: "behavioral",
      factor: "Regular Physical Activity",
      level: "low",
      riskImpact: -0.12,
      evidence: "Regular activity improves occupational capacity and resilience",
    });
  }

  // Stress management
  if (caseData.stressManagement === "poor") {
    factors.push({
      category: "behavioral",
      factor: "Poor Stress Management",
      level: "high",
      riskImpact: 0.14,
      evidence: "Inadequate stress management increases injury risk",
    });
  } else if (caseData.stressManagement === "good") {
    factors.push({
      category: "behavioral",
      factor: "Effective Stress Management",
      level: "low",
      riskImpact: -0.10,
      evidence: "Good coping strategies reduce occupational health risks",
    });
  }

  return factors;
}

/**
 * Perform comprehensive SDoH analysis
 */
export function performSDoHAnalysis(caseData: any): SDoHAnalysisResult {
  const economicFactors = assessEconomicFactors(caseData);
  const educationFactors = assessEducationFactors(caseData);
  const socialFactors = assessSocialFactors(caseData);
  const environmentalFactors = assessEnvironmentalFactors(caseData);
  const behavioralFactors = assessBehavioralFactors(caseData);

  const allFactors = [
    ...economicFactors,
    ...educationFactors,
    ...socialFactors,
    ...environmentalFactors,
    ...behavioralFactors,
  ];

  // Calculate overall SDoH risk
  const riskAdjustment = allFactors.reduce((sum, f) => sum + f.riskImpact, 0);
  const overallSDoHRisk = Math.max(0, Math.min(1, 0.5 + riskAdjustment));

  // Calculate vulnerability score (concentration of high-level factors)
  const highLevelFactors = allFactors.filter(f => f.level === "high").length;
  const vulnerabilityScore = Math.min(1, highLevelFactors / 5);

  // Identify protective and risk factors
  const protectiveFactors = allFactors.filter(f => f.riskImpact < -0.05).map(f => f.factor);
  const riskFactors = allFactors.filter(f => f.riskImpact > 0.05).map(f => f.factor);

  // Generate recommendations
  const recommendations: string[] = [];
  if (vulnerabilityScore > 0.6) {
    recommendations.push("CRITICAL: High vulnerability due to multiple SDoH challenges - Enhanced support needed");
  }
  if (riskFactors.includes("Low Income (< $25k/year)")) {
    recommendations.push("Connect with financial assistance programs and occupational health resources");
  }
  if (riskFactors.includes("No Health Insurance")) {
    recommendations.push("Facilitate health insurance enrollment and access to occupational health services");
  }
  if (riskFactors.includes("Limited Social Support")) {
    recommendations.push("Refer to community support services and peer support programs");
  }
  if (riskFactors.includes("Housing Instability/Homelessness")) {
    recommendations.push("URGENT: Address housing needs as prerequisite for occupational health management");
  }
  if (riskFactors.includes("Active Substance Use")) {
    recommendations.push("Refer to substance use disorder treatment before occupational clearance");
  }

  return {
    overallSDoHRisk,
    riskAdjustment,
    vulnerabilityScore,
    protectiveFactors,
    riskFactors,
    recommendations,
  };
}

/**
 * Generate SDoH report
 */
export function generateSDoHReport(result: SDoHAnalysisResult): string {
  let report = "# SOCIAL DETERMINANTS OF HEALTH (SDoH) ANALYSIS\n\n";
  report += `## Overall SDoH Risk: ${(result.overallSDoHRisk * 100).toFixed(1)}%\n`;
  report += `## Vulnerability Score: ${(result.vulnerabilityScore * 100).toFixed(0)}%\n`;
  report += `## Net Risk Adjustment: ${(result.riskAdjustment > 0 ? "+" : "")}${(result.riskAdjustment * 100).toFixed(1)}%\n\n`;

  if (result.riskFactors.length > 0) {
    report += "## Risk Factors\n";
    result.riskFactors.forEach(f => {
      report += `- ${f}\n`;
    });
    report += "\n";
  }

  if (result.protectiveFactors.length > 0) {
    report += "## Protective Factors\n";
    result.protectiveFactors.forEach(f => {
      report += `- ${f}\n`;
    });
    report += "\n";
  }

  if (result.recommendations.length > 0) {
    report += "## Recommendations\n";
    result.recommendations.forEach(r => {
      report += `- ${r}\n`;
    });
  }

  return report;
}
