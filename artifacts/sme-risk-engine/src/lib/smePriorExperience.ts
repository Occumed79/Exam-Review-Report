/**
 * SME Prior Experience Module
 * Integrates Subject Matter Expert's professional history into risk assessment
 * Provides "human wisdom" to complement machine intelligence
 */

export interface PriorCase {
  caseId: string;
  date: string;
  jobTitle: string;
  medicalCondition: string;
  finalOutcome: "fit" | "conditional" | "unfit";
  machineScore: number; // What the algorithm predicted
  smeDecision: number; // What the SME decided (0-1)
  reasoning: string;
  followUpOutcome?: string; // What actually happened
  accuracy: boolean; // Did SME decision prove correct?
}

export interface SMEProfile {
  smeId: string;
  name: string;
  title: string;
  yearsExperience: number;
  specializations: string[];
  priorCases: PriorCase[];
  decisionAccuracy: number; // % of correct decisions
  conservatismBias: number; // -1 (liberal) to 1 (conservative)
  industryExpertise: string[];
}

export interface ExperienceWeighting {
  similarCaseCount: number;
  accuracyScore: number; // 0-1
  relevanceScore: number; // 0-1 (how similar is current case)
  experienceWeight: number; // 0-1 (how much to trust SME on this case)
  recommendedAdjustment: number; // -0.3 to 0.3 (risk adjustment based on experience)
}

export interface HybridAnalysisResult {
  machineIntelligence: {
    riskScore: number;
    confidence: number;
    reasoning: string[];
  };
  smeExperience: {
    riskScore: number;
    confidence: number;
    reasoning: string[];
  };
  hybridConsensus: {
    finalRiskScore: number;
    machineWeight: number; // 0-1
    smeWeight: number; // 0-1
    agreement: number; // 0-1 (how much they agree)
    recommendation: string;
  };
}

/**
 * Calculate SME Experience Weighting
 */
export function calculateExperienceWeighting(
  smeProfile: SMEProfile,
  currentCase: any
): ExperienceWeighting {
  // Find similar prior cases
  const similarCases = smeProfile.priorCases.filter(
    c =>
      c.jobTitle.toLowerCase() === currentCase.jobTitle.toLowerCase() ||
      c.medicalCondition.toLowerCase().includes(currentCase.primaryCondition?.toLowerCase() || "")
  );

  const similarCaseCount = similarCases.length;

  // Calculate accuracy on similar cases
  const accurateDecisions = similarCases.filter(c => c.accuracy).length;
  const accuracyScore = similarCaseCount > 0 ? accurateDecisions / similarCaseCount : smeProfile.decisionAccuracy;

  // Calculate relevance (how similar is current case to prior cases)
  let relevanceScore = 0;
  if (similarCaseCount > 0) {
    const avgMachineDifference = similarCases.reduce((sum, c) => sum + Math.abs(c.machineScore - c.smeDecision), 0) / similarCaseCount;
    relevanceScore = Math.max(0, 1 - avgMachineDifference);
  }

  // Experience weight increases with:
  // 1. Number of similar cases
  // 2. Accuracy on those cases
  // 3. Years of experience
  const caseWeight = Math.min(1, similarCaseCount / 10);
  const accuracyWeight = accuracyScore;
  const experienceWeight = (caseWeight * 0.4 + accuracyWeight * 0.4 + Math.min(1, smeProfile.yearsExperience / 30) * 0.2);

  // Calculate recommended adjustment
  let recommendedAdjustment = 0;
  if (similarCaseCount > 0) {
    const avgSMEDecision = similarCases.reduce((sum, c) => sum + c.smeDecision, 0) / similarCaseCount;
    const avgMachineScore = similarCases.reduce((sum, c) => sum + c.machineScore, 0) / similarCaseCount;
    recommendedAdjustment = (avgSMEDecision - avgMachineScore) * experienceWeight;
  }

  return {
    similarCaseCount,
    accuracyScore,
    relevanceScore,
    experienceWeight,
    recommendedAdjustment,
  };
}

/**
 * Integrate SME Experience into Risk Analysis
 */
export function integrateSMEExperience(
  machineRiskScore: number,
  machineConfidence: number,
  smeProfile: SMEProfile,
  currentCase: any,
  smeAssessment: { riskScore: number; confidence: number; reasoning: string[] }
): HybridAnalysisResult {
  const weighting = calculateExperienceWeighting(smeProfile, currentCase);

  // Adjust machine score based on SME experience
  const experienceAdjustedMachineScore = Math.min(1, Math.max(0, machineRiskScore + weighting.recommendedAdjustment * 0.5));

  // Calculate hybrid consensus
  const machineWeight = 1 - weighting.experienceWeight;
  const smeWeight = weighting.experienceWeight;

  const finalRiskScore = machineWeight * experienceAdjustedMachineScore + smeWeight * smeAssessment.riskScore;

  // Calculate agreement between machine and SME
  const riskDifference = Math.abs(machineRiskScore - smeAssessment.riskScore);
  const agreement = Math.max(0, 1 - riskDifference);

  // Generate recommendation
  let recommendation = "";
  if (agreement > 0.8) {
    recommendation = "Strong consensus between machine and SME. High confidence in recommendation.";
  } else if (agreement > 0.6) {
    recommendation = "Good agreement between machine and SME. Recommendation is well-supported.";
  } else if (agreement > 0.4) {
    recommendation = "Moderate disagreement between machine and SME. Further review recommended.";
  } else {
    recommendation = "Significant disagreement between machine and SME. Requires detailed deliberation.";
  }

  return {
    machineIntelligence: {
      riskScore: machineRiskScore,
      confidence: machineConfidence,
      reasoning: ["Machine learning models", "Regulatory compliance analysis", "Occupational hazard assessment"],
    },
    smeExperience: {
      riskScore: smeAssessment.riskScore,
      confidence: smeAssessment.confidence,
      reasoning: smeAssessment.reasoning,
    },
    hybridConsensus: {
      finalRiskScore,
      machineWeight,
      smeWeight,
      agreement,
      recommendation,
    },
  };
}

/**
 * Generate Hybrid Analysis Report
 */
export function generateHybridAnalysisReport(result: HybridAnalysisResult, smeProfile: SMEProfile): string {
  let report = "# HYBRID MACHINE-HUMAN ANALYSIS\n\n";

  report += "## Machine Intelligence\n";
  report += `- **Risk Score**: ${(result.machineIntelligence.riskScore * 100).toFixed(1)}%\n`;
  report += `- **Confidence**: ${(result.machineIntelligence.confidence * 100).toFixed(0)}%\n`;
  report += `- **Basis**: ${result.machineIntelligence.reasoning.join(", ")}\n\n`;

  report += `## ${smeProfile.name} (SME Experience)\n`;
  report += `- **Title**: ${smeProfile.title}\n`;
  report += `- **Years of Experience**: ${smeProfile.yearsExperience}\n`;
  report += `- **Decision Accuracy**: ${(smeProfile.decisionAccuracy * 100).toFixed(0)}%\n`;
  report += `- **Risk Assessment**: ${(result.smeExperience.riskScore * 100).toFixed(1)}%\n`;
  report += `- **Confidence**: ${(result.smeExperience.confidence * 100).toFixed(0)}%\n`;
  report += `- **Reasoning**:\n`;
  result.smeExperience.reasoning.forEach(r => {
    report += `  - ${r}\n`;
  });
  report += "\n";

  report += "## Hybrid Consensus\n";
  report += `- **Final Risk Score**: ${(result.hybridConsensus.finalRiskScore * 100).toFixed(1)}%\n`;
  report += `- **Machine Weight**: ${(result.hybridConsensus.machineWeight * 100).toFixed(0)}%\n`;
  report += `- **SME Weight**: ${(result.hybridConsensus.smeWeight * 100).toFixed(0)}%\n`;
  report += `- **Agreement Level**: ${(result.hybridConsensus.agreement * 100).toFixed(0)}%\n`;
  report += `- **Recommendation**: ${result.hybridConsensus.recommendation}\n\n`;

  if (result.hybridConsensus.agreement < 0.6) {
    report += "## Disagreement Analysis\n";
    report += "The machine and SME assessments diverge significantly. This may indicate:\n";
    report += "- Unique case factors not captured by the algorithm\n";
    report += "- SME expertise based on similar cases with different outcomes\n";
    report += "- Need for additional expert review or deliberation\n";
  }

  return report;
}

/**
 * Create SME Profile from Case History
 */
export function createSMEProfile(
  smeId: string,
  name: string,
  title: string,
  yearsExperience: number,
  specializations: string[],
  priorCases: PriorCase[]
): SMEProfile {
  // Calculate decision accuracy
  const accurateCases = priorCases.filter(c => c.accuracy).length;
  const decisionAccuracy = priorCases.length > 0 ? accurateCases / priorCases.length : 0.5;

  // Calculate conservatism bias
  const avgSMEDecision = priorCases.length > 0 ? priorCases.reduce((sum, c) => sum + c.smeDecision, 0) / priorCases.length : 0.5;
  const avgMachineScore = priorCases.length > 0 ? priorCases.reduce((sum, c) => sum + c.machineScore, 0) / priorCases.length : 0.5;
  const conservatismBias = (avgSMEDecision - avgMachineScore) * 2; // -1 to 1 scale

  return {
    smeId,
    name,
    title,
    yearsExperience,
    specializations,
    priorCases,
    decisionAccuracy,
    conservatismBias,
    industryExpertise: specializations,
  };
}

/**
 * Add Prior Case to SME Profile
 */
export function addPriorCase(profile: SMEProfile, priorCase: PriorCase): SMEProfile {
  const updatedProfile = { ...profile };
  updatedProfile.priorCases.push(priorCase);

  // Recalculate metrics
  const accurateCases = updatedProfile.priorCases.filter(c => c.accuracy).length;
  updatedProfile.decisionAccuracy = updatedProfile.priorCases.length > 0 ? accurateCases / updatedProfile.priorCases.length : 0.5;

  const avgSMEDecision = updatedProfile.priorCases.reduce((sum, c) => sum + c.smeDecision, 0) / updatedProfile.priorCases.length;
  const avgMachineScore = updatedProfile.priorCases.reduce((sum, c) => sum + c.machineScore, 0) / updatedProfile.priorCases.length;
  updatedProfile.conservatismBias = (avgSMEDecision - avgMachineScore) * 2;

  return updatedProfile;
}

/**
 * Generate SME Experience Summary
 */
export function generateSMEExperienceSummary(profile: SMEProfile): string {
  let summary = `# ${profile.name} - Professional Profile\n\n`;
  summary += `**Title**: ${profile.title}\n`;
  summary += `**Years of Experience**: ${profile.yearsExperience}\n`;
  summary += `**Decision Accuracy**: ${(profile.decisionAccuracy * 100).toFixed(0)}%\n`;
  summary += `**Conservatism Bias**: ${profile.conservatismBias > 0 ? "Conservative (tends to recommend unfit)" : "Liberal (tends to recommend fit)"}\n\n`;

  summary += `**Specializations**: ${profile.specializations.join(", ")}\n\n`;

  summary += `**Prior Cases Reviewed**: ${profile.priorCases.length}\n`;

  const fitCases = profile.priorCases.filter(c => c.finalOutcome === "fit").length;
  const conditionalCases = profile.priorCases.filter(c => c.finalOutcome === "conditional").length;
  const unfitCases = profile.priorCases.filter(c => c.finalOutcome === "unfit").length;

  summary += `- Fit: ${fitCases}\n`;
  summary += `- Conditional: ${conditionalCases}\n`;
  summary += `- Unfit: ${unfitCases}\n`;

  return summary;
}
