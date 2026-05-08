/**
 * Job Simulation Integration
 * Integrates VR/AR job simulation data into the EJF engine for ground-truth validation
 */

export interface SimulationMetrics {
  taskName: string;
  duration: number; // seconds
  heartRateAvg: number; // bpm
  heartRateMax: number; // bpm
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  fatigueScore: number; // 0-10
  accuracyScore: number; // 0-100%
  safetyViolations: number;
  completionRate: number; // 0-100%
}

export interface JobSimulationSession {
  sessionId: string;
  caseId: string;
  jobTitle: string;
  simulationDate: string;
  duration: number; // total session duration in minutes
  tasks: SimulationMetrics[];
  overallPerformanceScore: number; // 0-100
  overallSafetyScore: number; // 0-100
  functionalCapacityRating: number; // 0-1
  recommendedAccommodations: string[];
  simulationValidity: boolean;
}

export interface SimulationAnalysis {
  sessionId: string;
  caseId: string;
  simulationVsAlgorithmAlignment: number; // 0-1 (how much simulation matches algorithm prediction)
  algorithmPredictedCapacity: number; // 0-1
  simulationMeasuredCapacity: number; // 0-1
  capacityGap: number; // difference
  insights: string[];
  recommendations: string[];
  adjustedRiskScore: number; // Risk score adjusted based on simulation data
}

/**
 * Job Simulation Integration Engine
 */
export class JobSimulationIntegration {
  private sessions: JobSimulationSession[] = [];
  private storageKey = "sme-risk-engine-simulations";

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add a new simulation session
   */
  addSimulationSession(session: JobSimulationSession): void {
    this.sessions.push(session);
    this.saveToStorage();
  }

  /**
   * Calculate overall performance score
   */
  calculatePerformanceScore(tasks: SimulationMetrics[]): number {
    if (tasks.length === 0) return 0;

    let totalScore = 0;

    tasks.forEach(task => {
      // Accuracy (40%)
      const accuracyScore = task.accuracyScore / 100;

      // Safety (30%)
      const safetyScore = Math.max(0, 1 - task.safetyViolations * 0.1);

      // Completion (20%)
      const completionScore = task.completionRate / 100;

      // Fatigue (10%)
      const fatigueScore = Math.max(0, 1 - task.fatigueScore / 10);

      const taskScore = accuracyScore * 0.4 + safetyScore * 0.3 + completionScore * 0.2 + fatigueScore * 0.1;
      totalScore += taskScore;
    });

    return (totalScore / tasks.length) * 100;
  }

  /**
   * Calculate functional capacity from simulation
   */
  calculateFunctionalCapacity(tasks: SimulationMetrics[]): number {
    if (tasks.length === 0) return 0;

    let capacityScore = 0;

    tasks.forEach(task => {
      // Heart rate response (lower is better for endurance)
      const heartRateNormal = task.heartRateMax < 120 ? 1 : task.heartRateMax < 140 ? 0.7 : 0.4;

      // Blood pressure response
      const bpNormal = task.bloodPressureSystolic < 140 && task.bloodPressureDiastolic < 90 ? 1 : 0.6;

      // Fatigue tolerance
      const fatigueTolerance = Math.max(0, 1 - task.fatigueScore / 10);

      // Task completion
      const completionRate = task.completionRate / 100;

      const taskCapacity = (heartRateNormal + bpNormal + fatigueTolerance + completionRate) / 4;
      capacityScore += taskCapacity;
    });

    return Math.min(1, capacityScore / tasks.length);
  }

  /**
   * Analyze simulation vs. algorithm prediction
   */
  analyzeSimulationAlignment(
    session: JobSimulationSession,
    algorithmPredictedCapacity: number
  ): SimulationAnalysis {
    const simulationMeasuredCapacity = this.calculateFunctionalCapacity(session.tasks);
    const capacityGap = Math.abs(algorithmPredictedCapacity - simulationMeasuredCapacity);

    // Calculate alignment (lower gap = higher alignment)
    const simulationVsAlgorithmAlignment = Math.max(0, 1 - capacityGap);

    const insights: string[] = [];
    const recommendations: string[] = [];

    // Generate insights
    if (simulationVsAlgorithmAlignment > 0.85) {
      insights.push("Simulation results strongly align with algorithm prediction. High confidence in assessment.");
    } else if (simulationVsAlgorithmAlignment > 0.65) {
      insights.push("Simulation results moderately align with algorithm prediction. Some variation noted.");
    } else {
      insights.push("Simulation results diverge significantly from algorithm prediction. Requires investigation.");
    }

    // Analyze performance
    const avgPerformance = this.calculatePerformanceScore(session.tasks);
    if (avgPerformance > 80) {
      insights.push("Applicant demonstrated strong performance across all simulated tasks.");
    } else if (avgPerformance > 60) {
      insights.push("Applicant demonstrated moderate performance with some task-specific challenges.");
    } else {
      insights.push("Applicant demonstrated difficulty with simulated job tasks. Accommodations may be needed.");
    }

    // Identify specific challenges
    session.tasks.forEach(task => {
      if (task.safetyViolations > 2) {
        insights.push(`Safety concerns identified in ${task.taskName} (${task.safetyViolations} violations).`);
        recommendations.push(`Implement additional safety training for ${task.taskName}.`);
      }

      if (task.fatigueScore > 7) {
        insights.push(`High fatigue reported during ${task.taskName}.`);
        recommendations.push(`Consider job rotation or reduced duration for ${task.taskName}.`);
      }

      if (task.accuracyScore < 70) {
        insights.push(`Accuracy concerns in ${task.taskName} (${task.accuracyScore}%).`);
        recommendations.push(`Provide additional training or job aids for ${task.taskName}.`);
      }
    });

    // Calculate adjusted risk score
    const baselineRiskAdjustment = (1 - simulationMeasuredCapacity) * 0.5; // Simulation data carries 50% weight
    const adjustedRiskScore = Math.min(1, Math.max(0, algorithmPredictedCapacity + baselineRiskAdjustment));

    return {
      sessionId: session.sessionId,
      caseId: session.caseId,
      simulationVsAlgorithmAlignment,
      algorithmPredictedCapacity,
      simulationMeasuredCapacity,
      capacityGap,
      insights,
      recommendations,
      adjustedRiskScore,
    };
  }

  /**
   * Get simulation sessions for a case
   */
  getSessionsForCase(caseId: string): JobSimulationSession[] {
    return this.sessions.filter(s => s.caseId === caseId);
  }

  /**
   * Generate simulation report
   */
  generateSimulationReport(session: JobSimulationSession): string {
    let report = "# JOB SIMULATION ANALYSIS REPORT\n\n";

    report += `## Session Overview\n`;
    report += `- **Session ID**: ${session.sessionId}\n`;
    report += `- **Job Title**: ${session.jobTitle}\n`;
    report += `- **Simulation Date**: ${session.simulationDate}\n`;
    report += `- **Total Duration**: ${session.duration} minutes\n`;
    report += `- **Overall Performance Score**: ${session.overallPerformanceScore.toFixed(1)}%\n`;
    report += `- **Overall Safety Score**: ${session.overallSafetyScore.toFixed(1)}%\n`;
    report += `- **Functional Capacity Rating**: ${(session.functionalCapacityRating * 100).toFixed(1)}%\n\n`;

    report += `## Task Breakdown\n`;
    report += `| Task | Duration | HR Avg | Accuracy | Safety | Fatigue |\n`;
    report += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    session.tasks.forEach(task => {
      report += `| ${task.taskName} | ${task.duration}s | ${task.heartRateAvg} | ${task.accuracyScore.toFixed(0)}% | ${task.safetyViolations} | ${task.fatigueScore.toFixed(1)} |\n`;
    });
    report += "\n";

    if (session.recommendedAccommodations.length > 0) {
      report += `## Recommended Accommodations\n`;
      session.recommendedAccommodations.forEach(acc => {
        report += `- ${acc}\n`;
      });
      report += "\n";
    }

    report += `## Validity Assessment\n`;
    report += `Simulation Validity: ${session.simulationValidity ? "✓ VALID" : "✗ INVALID"}\n`;

    return report;
  }

  /**
   * Save sessions to storage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.sessions));
    } catch (error) {
      console.error("Failed to save simulation sessions to storage:", error);
    }
  }

  /**
   * Load sessions from storage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.sessions = JSON.parse(data);
      }
    } catch (error) {
      console.error("Failed to load simulation sessions from storage:", error);
    }
  }
}

export default JobSimulationIntegration;
