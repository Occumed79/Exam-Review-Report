/**
 * Three-Judge Deliberation Panel
 * Medical, Legal, and Occupational judges deliberate from distinct perspectives
 * Reaches consensus verdict on employment fitness
 */

export interface JudgeOpinion {
  judgeType: "medical" | "legal" | "occupational";
  recommendation: "fit" | "conditional" | "unfit";
  confidenceLevel: number; // 0-1
  reasoning: string[];
  concerns: string[];
  recommendations: string[];
  dissent?: string; // If minority opinion
}

export interface PanelDeliberation {
  caseId: string;
  judges: JudgeOpinion[];
  consensusRecommendation: "fit" | "conditional" | "unfit";
  consensusStrength: number; // 0-1 (unanimity)
  dissents: JudgeOpinion[];
  finalVerdict: string;
  legalDefenseStatement: string;
}

/**
 * Medical Judge - Focuses on clinical fitness
 */
export function medicalJudge(caseData: any, riskAnalysis: any): JudgeOpinion {
  const reasoning: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];

  let recommendation: "fit" | "conditional" | "unfit" = "fit";
  let confidence = 0.9;

  // Analyze medical conditions
  const medicalConditions = caseData.medicalConditions || [];
  if (medicalConditions.length === 0) {
    reasoning.push("No significant medical conditions documented");
  } else {
    reasoning.push(`${medicalConditions.length} medical condition(s) identified`);

    medicalConditions.forEach((c: any) => {
      if (c.severity === "severe") {
        concerns.push(`Severe ${c.conditionName} - requires ongoing management`);
        recommendation = "conditional";
        confidence = Math.max(0.5, confidence - 0.2);
      } else if (c.severity === "moderate") {
        concerns.push(`Moderate ${c.conditionName} - monitor for progression`);
        if (recommendation === "fit") recommendation = "conditional";
        confidence = Math.max(0.6, confidence - 0.1);
      }
    });
  }

  // Analyze injury history
  const injuryHistory = caseData.injuryHistory || [];
  if (injuryHistory.length > 2) {
    concerns.push(`Multiple injuries (${injuryHistory.length}) suggest vulnerability`);
    recommendation = "conditional";
    confidence = Math.max(0.5, confidence - 0.15);
  } else if (injuryHistory.length > 0) {
    reasoning.push(`${injuryHistory.length} prior injury(ies) documented`);
  }

  // Analyze functional capacity
  const functionalCapacity = caseData.functionalCapacity || 0.8;
  if (functionalCapacity < 0.5) {
    concerns.push("Significant functional limitations documented");
    recommendation = "unfit";
    confidence = 0.85;
  } else if (functionalCapacity < 0.7) {
    concerns.push("Moderate functional limitations present");
    recommendation = "conditional";
    confidence = 0.75;
  } else {
    reasoning.push("Functional capacity adequate for occupational demands");
  }

  // Medication compliance
  if ((caseData.medications || []).length > 3) {
    recommendations.push("Ensure medication compliance and adherence");
  }

  // Age consideration
  if (caseData.age > 60) {
    reasoning.push(`Age ${caseData.age} - monitor for age-related decline`);
    if (recommendation === "fit") recommendation = "conditional";
  }

  // Medical recommendations
  if (recommendation === "conditional") {
    recommendations.push("Recommend occupational medicine follow-up");
    recommendations.push("Consider functional capacity evaluation (FCE)");
  }

  return {
    judgeType: "medical",
    recommendation,
    confidenceLevel: confidence,
    reasoning,
    concerns,
    recommendations,
  };
}

/**
 * Legal Judge - Focuses on ADA/EEOC compliance and defensibility
 */
export function legalJudge(caseData: any, riskAnalysis: any, ejfAnalysis: any): JudgeOpinion {
  const reasoning: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];

  let recommendation: "fit" | "conditional" | "unfit" = "fit";
  let confidence = 0.85;

  // Direct Threat Assessment
  const directThreatScore = riskAnalysis.directThreatScore || 0;
  if (directThreatScore > 75) {
    reasoning.push("Direct threat criteria met under EEOC standards");
    recommendation = "unfit";
    confidence = 0.9;
  } else if (directThreatScore > 50) {
    reasoning.push("Significant direct threat concerns present");
    recommendation = "conditional";
    confidence = 0.8;
    concerns.push("Direct threat analysis indicates substantial risk");
  } else {
    reasoning.push("No substantial direct threat identified");
  }

  // Regulatory compliance
  const regulatoryCompliance = riskAnalysis.regulatoryCompliance || {};
  let complianceIssues = 0;
  Object.entries(regulatoryCompliance).forEach(([framework, status]: [string, any]) => {
    if (status.status === "non-compliant") {
      concerns.push(`Non-compliant with ${framework} standards`);
      complianceIssues++;
    } else if (status.status === "waiver-required") {
      concerns.push(`${framework} waiver required`);
      recommendations.push(`Initiate ${framework} waiver process`);
    }
  });

  if (complianceIssues > 0) {
    recommendation = "unfit";
    confidence = 0.9;
  }

  // Reasonable Accommodation Analysis
  if (ejfAnalysis && ejfAnalysis.length > 0) {
    const accommodationFeasible = ejfAnalysis.some((a: any) => a.accommodationOptions.length > 0);
    if (accommodationFeasible) {
      reasoning.push("Reasonable accommodations may be feasible under ADA");
      if (recommendation === "fit") recommendation = "conditional";
      recommendations.push("Explore reasonable accommodation options");
    } else {
      concerns.push("No reasonable accommodations appear feasible");
      if (recommendation === "fit") recommendation = "unfit";
    }
  }

  // Documentation quality
  if (!caseData.medicalRecords || caseData.medicalRecords.length === 0) {
    concerns.push("Insufficient medical documentation for defensible decision");
    confidence = Math.max(0.5, confidence - 0.2);
  } else {
    reasoning.push("Adequate medical documentation present");
  }

  // Legal recommendations
  recommendations.push("Document all findings with specific regulatory citations");
  recommendations.push("Ensure decision is based on individualized assessment");
  if (recommendation !== "fit") {
    recommendations.push("Provide written explanation with legal basis for decision");
  }

  return {
    judgeType: "legal",
    recommendation,
    confidenceLevel: confidence,
    reasoning,
    concerns,
    recommendations,
  };
}

/**
 * Occupational Judge - Focuses on job demands and occupational fit
 */
export function occupationalJudge(caseData: any, riskAnalysis: any, ejfAnalysis: any): JudgeOpinion {
  const reasoning: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];

  let recommendation: "fit" | "conditional" | "unfit" = "fit";
  let confidence = 0.85;

  // Job demands vs. capacity
  const occupationalRiskFactor = riskAnalysis.occupationalRiskFactor || 0.5;
  const functionalCapacity = caseData.functionalCapacity || 0.8;
  const demandCapacityGap = occupationalRiskFactor - functionalCapacity;

  if (demandCapacityGap > 0.3) {
    concerns.push("Significant gap between job demands and functional capacity");
    recommendation = "unfit";
    confidence = 0.85;
  } else if (demandCapacityGap > 0.15) {
    concerns.push("Moderate gap between job demands and functional capacity");
    recommendation = "conditional";
    confidence = 0.75;
  } else {
    reasoning.push("Functional capacity appears adequate for job demands");
  }

  // EJF conflicts
  if (ejfAnalysis && ejfAnalysis.length > 0) {
    const criticalConflicts = ejfAnalysis.filter((a: any) => 
      a.conflictingFunctions.some((c: any) => c.conflictSeverity === "critical")
    );

    if (criticalConflicts.length > 0) {
      concerns.push(`Critical conflicts with ${criticalConflicts.length} essential job function(s)`);
      recommendation = "unfit";
      confidence = 0.9;
    } else {
      const highConflicts = ejfAnalysis.filter((a: any) => 
        a.conflictingFunctions.some((c: any) => c.conflictSeverity === "high")
      );
      if (highConflicts.length > 0) {
        concerns.push(`High-severity conflicts with ${highConflicts.length} essential job function(s)`);
        recommendation = "conditional";
        confidence = 0.8;
      }
    }
  }

  // Occupational injury risk
  const injuryProbability = riskAnalysis.injuryProbability || 0.3;
  if (injuryProbability > 0.7) {
    concerns.push("High occupational injury probability");
    recommendation = "unfit";
    confidence = 0.85;
  } else if (injuryProbability > 0.5) {
    concerns.push("Moderate to high occupational injury probability");
    recommendation = "conditional";
    confidence = 0.75;
  } else {
    reasoning.push("Occupational injury probability within acceptable range");
  }

  // Comparative risk
  const comparativeRisk = riskAnalysis.comparativeRisk || 1;
  if (comparativeRisk > 3) {
    concerns.push(`Risk is ${comparativeRisk.toFixed(1)}x baseline occupational risk`);
    if (recommendation === "fit") recommendation = "conditional";
  }

  // Occupational recommendations
  if (recommendation === "conditional") {
    recommendations.push("Recommend modified duties or restricted assignment");
    recommendations.push("Implement occupational health monitoring");
    recommendations.push("Consider job rotation or shift modifications");
  }

  if (recommendation !== "fit") {
    recommendations.push("Refer to occupational medicine specialist");
  }

  return {
    judgeType: "occupational",
    recommendation,
    confidenceLevel: confidence,
    reasoning,
    concerns,
    recommendations,
  };
}

/**
 * Deliberation Panel - Reaches consensus
 */
export function deliberationPanel(
  caseData: any,
  riskAnalysis: any,
  ejfAnalysis: any
): PanelDeliberation {
  const medicalOpinion = medicalJudge(caseData, riskAnalysis);
  const legalOpinion = legalJudge(caseData, riskAnalysis, ejfAnalysis);
  const occupationalOpinion = occupationalJudge(caseData, riskAnalysis, ejfAnalysis);

  const judges = [medicalOpinion, legalOpinion, occupationalOpinion];

  // Determine consensus
  const fitCount = judges.filter(j => j.recommendation === "fit").length;
  const conditionalCount = judges.filter(j => j.recommendation === "conditional").length;
  const unfitCount = judges.filter(j => j.recommendation === "unfit").length;

  let consensusRecommendation: "fit" | "conditional" | "unfit" = "fit";
  let consensusStrength = 1;
  const dissents: JudgeOpinion[] = [];

  if (unfitCount > 0) {
    consensusRecommendation = "unfit";
    consensusStrength = unfitCount / 3;
  } else if (conditionalCount > 0) {
    consensusRecommendation = "conditional";
    consensusStrength = (3 - conditionalCount) / 3;
  } else {
    consensusRecommendation = "fit";
    consensusStrength = fitCount / 3;
  }

  // Identify dissents
  judges.forEach(judge => {
    if (judge.recommendation !== consensusRecommendation) {
      dissents.push(judge);
    }
  });

  // Generate final verdict
  let finalVerdict = "";
  if (consensusRecommendation === "fit") {
    finalVerdict = `EMPLOYMENT RECOMMENDED: Applicant is fit for duty as ${caseData.jobTitle}. No significant medical, legal, or occupational barriers identified.`;
  } else if (consensusRecommendation === "conditional") {
    finalVerdict = `CONDITIONAL EMPLOYMENT: Applicant may be fit for duty with appropriate accommodations, monitoring, and medical management. Specific conditions and recommendations outlined below.`;
  } else {
    finalVerdict = `EMPLOYMENT NOT RECOMMENDED: Applicant is not fit for duty as ${caseData.jobTitle}. Medical, legal, or occupational factors create substantial barriers to safe employment.`;
  }

  // Legal defense statement
  let legalDefenseStatement = "";
  if (consensusStrength > 0.8) {
    legalDefenseStatement = `This decision is supported by unanimous or near-unanimous consensus across medical, legal, and occupational perspectives. The assessment is well-documented, evidence-based, and legally defensible.`;
  } else if (consensusStrength > 0.5) {
    legalDefenseStatement = `This decision reflects majority consensus with documented minority perspectives. The decision is based on individualized assessment and regulatory compliance.`;
  } else {
    legalDefenseStatement = `This decision reflects divided opinions among the review panel. All perspectives have been documented and considered. The final determination is based on the preponderance of evidence and regulatory requirements.`;
  }

  return {
    caseId: caseData.caseId,
    judges,
    consensusRecommendation,
    consensusStrength,
    dissents,
    finalVerdict,
    legalDefenseStatement,
  };
}

/**
 * Generate Three-Judge Panel Report
 */
export function generateThreeJudgePanelReport(deliberation: PanelDeliberation): string {
  let report = "# THREE-JUDGE DELIBERATION PANEL\n\n";
  report += `## Case ID: ${deliberation.caseId}\n\n`;

  report += "## FINAL VERDICT\n";
  report += `**${deliberation.finalVerdict}**\n\n`;

  report += `## Consensus Strength: ${(deliberation.consensusStrength * 100).toFixed(0)}%\n\n`;

  report += "## Individual Judge Opinions\n\n";

  deliberation.judges.forEach(judge => {
    const judgeTitle = judge.judgeType.charAt(0).toUpperCase() + judge.judgeType.slice(1);
    report += `### ${judgeTitle} Judge\n`;
    report += `**Recommendation**: ${judge.recommendation.toUpperCase()}\n`;
    report += `**Confidence**: ${(judge.confidenceLevel * 100).toFixed(0)}%\n\n`;

    if (judge.reasoning.length > 0) {
      report += `**Reasoning**:\n`;
      judge.reasoning.forEach(r => {
        report += `- ${r}\n`;
      });
      report += "\n";
    }

    if (judge.concerns.length > 0) {
      report += `**Concerns**:\n`;
      judge.concerns.forEach(c => {
        report += `- ${c}\n`;
      });
      report += "\n";
    }

    if (judge.recommendations.length > 0) {
      report += `**Recommendations**:\n`;
      judge.recommendations.forEach(r => {
        report += `- ${r}\n`;
      });
      report += "\n";
    }
  });

  if (deliberation.dissents.length > 0) {
    report += "## Dissenting Opinions\n\n";
    deliberation.dissents.forEach(dissent => {
      const judgeTitle = dissent.judgeType.charAt(0).toUpperCase() + dissent.judgeType.slice(1);
      report += `**${judgeTitle} Judge Dissent**: Recommends "${dissent.recommendation}" instead of "${deliberation.consensusRecommendation}"\n`;
      if (dissent.dissent) {
        report += `Reasoning: ${dissent.dissent}\n\n`;
      }
    });
  }

  report += "## Legal Defense Statement\n";
  report += `${deliberation.legalDefenseStatement}\n`;

  return report;
}
