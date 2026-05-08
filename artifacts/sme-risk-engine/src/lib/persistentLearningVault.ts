/**
 * Persistent Learning Vault
 * Stores case history and enables the engine to learn and improve over time
 */

export interface VaultCase {
  caseId: string;
  timestamp: string;
  applicantName: string;
  jobTitle: string;
  medicalConditions: string[];
  machineRiskScore: number;
  smeDecision: "fit" | "conditional" | "unfit";
  smeConfidence: number;
  finalOutcome: "fit" | "conditional" | "unfit";
  actualOutcome?: string; // What actually happened (follow-up)
  accuracy: boolean; // Did the prediction match actual outcome?
  regulationsApplied: string[];
  riskFactorsUsed: string[];
  notes: string;
  smeId: string;
  smeName: string;
}

export interface LearningVaultStats {
  totalCases: number;
  averageAccuracy: number;
  casesByOutcome: {
    fit: number;
    conditional: number;
    unfit: number;
  };
  casesByJob: Record<string, number>;
  casesByCondition: Record<string, number>;
  accuracyTrend: Array<{ date: string; accuracy: number }>;
  topConditions: Array<{ condition: string; count: number; accuracy: number }>;
  topJobs: Array<{ job: string; count: number; accuracy: number }>;
}

export interface CaseAnalysisReport {
  caseId: string;
  comparisonCases: VaultCase[];
  similarityScores: Array<{ caseId: string; similarity: number }>;
  insights: string[];
  recommendations: string[];
}

/**
 * Persistent Learning Vault Class
 */
export class PersistentLearningVault {
  private cases: VaultCase[] = [];
  private storageKey = "sme-risk-engine-vault";

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add a new case to the vault
   */
  addCase(vaultCase: VaultCase): void {
    this.cases.push(vaultCase);
    this.saveToStorage();
  }

  /**
   * Update an existing case (e.g., with actual outcome)
   */
  updateCase(caseId: string, updates: Partial<VaultCase>): void {
    const caseIndex = this.cases.findIndex(c => c.caseId === caseId);
    if (caseIndex !== -1) {
      this.cases[caseIndex] = { ...this.cases[caseIndex], ...updates };
      this.saveToStorage();
    }
  }

  /**
   * Get all cases
   */
  getAllCases(): VaultCase[] {
    return [...this.cases];
  }

  /**
   * Get cases by job title
   */
  getCasesByJob(jobTitle: string): VaultCase[] {
    return this.cases.filter(c => c.jobTitle.toLowerCase() === jobTitle.toLowerCase());
  }

  /**
   * Get cases by medical condition
   */
  getCasesByCondition(condition: string): VaultCase[] {
    return this.cases.filter(c => c.medicalConditions.some(m => m.toLowerCase().includes(condition.toLowerCase())));
  }

  /**
   * Get cases by SME
   */
  getCasesBySME(smeId: string): VaultCase[] {
    return this.cases.filter(c => c.smeId === smeId);
  }

  /**
   * Find similar cases to a current case
   */
  findSimilarCases(currentCase: Partial<VaultCase>, topN: number = 5): CaseAnalysisReport {
    const similarities = this.cases.map(vaultCase => ({
      caseId: vaultCase.caseId,
      similarity: this.calculateSimilarity(currentCase, vaultCase),
    }));

    const sortedSimilarities = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topN);
    const comparisonCases = sortedSimilarities.map(s => this.cases.find(c => c.caseId === s.caseId)!);

    const insights = this.generateInsights(currentCase, comparisonCases);
    const recommendations = this.generateRecommendations(currentCase, comparisonCases);

    return {
      caseId: currentCase.caseId || "unknown",
      comparisonCases,
      similarityScores: sortedSimilarities,
      insights,
      recommendations,
    };
  }

  /**
   * Calculate similarity between two cases
   */
  private calculateSimilarity(case1: Partial<VaultCase>, case2: VaultCase): number {
    let similarity = 0;
    let factors = 0;

    // Job title similarity
    if (case1.jobTitle && case2.jobTitle) {
      similarity += case1.jobTitle.toLowerCase() === case2.jobTitle.toLowerCase() ? 1 : 0.3;
      factors++;
    }

    // Medical condition overlap
    if (case1.medicalConditions && case2.medicalConditions) {
      const overlap = case1.medicalConditions.filter(c => case2.medicalConditions.includes(c)).length;
      const total = Math.max(case1.medicalConditions.length, case2.medicalConditions.length);
      similarity += total > 0 ? overlap / total : 0;
      factors++;
    }

    // Risk score proximity
    if (case1.machineRiskScore !== undefined && case2.machineRiskScore !== undefined) {
      const scoreDiff = Math.abs(case1.machineRiskScore - case2.machineRiskScore);
      similarity += Math.max(0, 1 - scoreDiff / 100);
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Generate insights from similar cases
   */
  private generateInsights(currentCase: Partial<VaultCase>, similarCases: VaultCase[]): string[] {
    const insights: string[] = [];

    if (similarCases.length === 0) {
      insights.push("No similar cases found in vault. This may be a unique case.");
      return insights;
    }

    // Outcome pattern
    const outcomes = similarCases.map(c => c.finalOutcome);
    const fitCount = outcomes.filter(o => o === "fit").length;
    const conditionalCount = outcomes.filter(o => o === "conditional").length;
    const unfitCount = outcomes.filter(o => o === "unfit").length;

    if (fitCount === similarCases.length) {
      insights.push("Similar cases have consistently resulted in FIT outcomes.");
    } else if (unfitCount === similarCases.length) {
      insights.push("Similar cases have consistently resulted in UNFIT outcomes.");
    } else {
      insights.push(`Similar cases show mixed outcomes: ${fitCount} Fit, ${conditionalCount} Conditional, ${unfitCount} Unfit.`);
    }

    // Accuracy pattern
    const accurateCases = similarCases.filter(c => c.accuracy).length;
    const accuracy = (accurateCases / similarCases.length) * 100;
    insights.push(`Historical accuracy on similar cases: ${accuracy.toFixed(0)}%`);

    // Confidence pattern
    const avgConfidence = similarCases.reduce((sum, c) => sum + c.smeConfidence, 0) / similarCases.length;
    insights.push(`Average SME confidence on similar cases: ${(avgConfidence * 100).toFixed(0)}%`);

    return insights;
  }

  /**
   * Generate recommendations based on similar cases
   */
  private generateRecommendations(currentCase: Partial<VaultCase>, similarCases: VaultCase[]): string[] {
    const recommendations: string[] = [];

    if (similarCases.length === 0) {
      recommendations.push("Consider requesting additional expert review due to lack of similar cases.");
      return recommendations;
    }

    // Outcome recommendation
    const outcomes = similarCases.map(c => c.finalOutcome);
    const mostCommonOutcome = outcomes.sort((a, b) => outcomes.filter(v => v === a).length - outcomes.filter(v => v === b).length).pop();

    if (mostCommonOutcome) {
      recommendations.push(`Based on similar cases, consider a ${mostCommonOutcome.toUpperCase()} recommendation.`);
    }

    // Confidence recommendation
    const accurateCases = similarCases.filter(c => c.accuracy).length;
    if (accurateCases / similarCases.length < 0.7) {
      recommendations.push("Historical accuracy on similar cases is below 70%. Consider additional review.");
    }

    // Condition-specific recommendation
    if (currentCase.medicalConditions && currentCase.medicalConditions.length > 0) {
      const condition = currentCase.medicalConditions[0];
      const conditionCases = similarCases.filter(c => c.medicalConditions.includes(condition));
      if (conditionCases.length > 0) {
        const conditionAccuracy = (conditionCases.filter(c => c.accuracy).length / conditionCases.length) * 100;
        recommendations.push(`For ${condition}, historical accuracy is ${conditionAccuracy.toFixed(0)}%.`);
      }
    }

    return recommendations;
  }

  /**
   * Generate vault statistics
   */
  generateStats(): LearningVaultStats {
    const totalCases = this.cases.length;

    // Outcome distribution
    const casesByOutcome = {
      fit: this.cases.filter(c => c.finalOutcome === "fit").length,
      conditional: this.cases.filter(c => c.finalOutcome === "conditional").length,
      unfit: this.cases.filter(c => c.finalOutcome === "unfit").length,
    };

    // Job distribution
    const casesByJob: Record<string, number> = {};
    this.cases.forEach(c => {
      casesByJob[c.jobTitle] = (casesByJob[c.jobTitle] || 0) + 1;
    });

    // Condition distribution
    const casesByCondition: Record<string, number> = {};
    this.cases.forEach(c => {
      c.medicalConditions.forEach(condition => {
        casesByCondition[condition] = (casesByCondition[condition] || 0) + 1;
      });
    });

    // Accuracy
    const accurateCases = this.cases.filter(c => c.accuracy).length;
    const averageAccuracy = totalCases > 0 ? (accurateCases / totalCases) * 100 : 0;

    // Accuracy trend (by week)
    const accuracyTrend = this.calculateAccuracyTrend();

    // Top conditions
    const topConditions = Object.entries(casesByCondition)
      .map(([condition, count]) => {
        const conditionCases = this.cases.filter(c => c.medicalConditions.includes(condition));
        const conditionAccuracy = (conditionCases.filter(c => c.accuracy).length / conditionCases.length) * 100;
        return { condition, count, accuracy: conditionAccuracy };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top jobs
    const topJobs = Object.entries(casesByJob)
      .map(([job, count]) => {
        const jobCases = this.cases.filter(c => c.jobTitle === job);
        const jobAccuracy = (jobCases.filter(c => c.accuracy).length / jobCases.length) * 100;
        return { job, count, accuracy: jobAccuracy };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCases,
      averageAccuracy,
      casesByOutcome,
      casesByJob,
      casesByCondition,
      accuracyTrend,
      topConditions,
      topJobs,
    };
  }

  /**
   * Calculate accuracy trend over time
   */
  private calculateAccuracyTrend(): Array<{ date: string; accuracy: number }> {
    const trend: Record<string, { total: number; accurate: number }> = {};

    this.cases.forEach(c => {
      const date = new Date(c.timestamp).toISOString().split("T")[0];
      if (!trend[date]) {
        trend[date] = { total: 0, accurate: 0 };
      }
      trend[date].total++;
      if (c.accuracy) {
        trend[date].accurate++;
      }
    });

    return Object.entries(trend)
      .map(([date, data]) => ({
        date,
        accuracy: (data.accurate / data.total) * 100,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Export vault to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.cases, null, 2);
  }

  /**
   * Import vault from JSON
   */
  importFromJSON(jsonData: string): void {
    try {
      this.cases = JSON.parse(jsonData);
      this.saveToStorage();
    } catch (error) {
      console.error("Failed to import vault data:", error);
    }
  }

  /**
   * Save vault to local storage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cases));
    } catch (error) {
      console.error("Failed to save vault to storage:", error);
    }
  }

  /**
   * Load vault from local storage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.cases = JSON.parse(data);
      }
    } catch (error) {
      console.error("Failed to load vault from storage:", error);
    }
  }

  /**
   * Clear all cases
   */
  clearVault(): void {
    this.cases = [];
    this.saveToStorage();
  }
}

export default PersistentLearningVault;
