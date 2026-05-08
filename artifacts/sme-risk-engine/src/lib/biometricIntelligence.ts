/**
 * Biometric & Wearable Intelligence Module
 * Processes real-time health data from wearables and sensors for dynamic risk adjustment
 */

export interface BiometricDataPoint {
  timestamp: string;
  heartRate: number; // bpm
  heartRateVariability: number; // ms (HRV)
  bloodPressure: { systolic: number; diastolic: number };
  oxygenSaturation: number; // % SpO2
  respiratoryRate: number; // breaths/min
  skinTemperature: number; // °C
  activityLevel: "sedentary" | "light" | "moderate" | "vigorous";
  stepCount: number;
  sleepQuality: number; // 0-100
  stressLevel: number; // 0-100 (derived from HRV)
}

export interface WearableDeviceProfile {
  deviceType: "smartwatch" | "fitness-tracker" | "chest-strap" | "continuous-glucose-monitor" | "blood-pressure-monitor";
  dataAccuracy: "high" | "moderate" | "low";
  samplingFrequency: string; // e.g., "1 sample/minute"
  lastSyncTime: string;
  dataPoints: BiometricDataPoint[];
}

export interface BiometricRiskAdjustment {
  factor: string;
  baselineImpact: number; // -1 to 1
  currentImpact: number; // -1 to 1
  riskAdjustment: number; // -0.3 to 0.3 (adjustment to overall risk score)
  trend: "improving" | "stable" | "declining";
  recommendation: string;
}

export interface BiometricIntelligenceResult {
  overallBiometricRisk: number; // 0-1
  riskAdjustments: BiometricRiskAdjustment[];
  totalRiskAdjustment: number; // Net adjustment to risk score
  alerts: string[];
  recommendations: string[];
  trendAnalysis: string;
}

/**
 * Analyze heart rate variability (HRV) for stress and recovery
 */
export function analyzeHeartRateVariability(dataPoints: BiometricDataPoint[]): BiometricRiskAdjustment {
  if (dataPoints.length === 0) {
    return {
      factor: "Heart Rate Variability",
      baselineImpact: 0,
      currentImpact: 0,
      riskAdjustment: 0,
      trend: "stable",
      recommendation: "Insufficient data",
    };
  }

  const recentHRV = dataPoints.slice(-7).map(p => p.heartRateVariability);
  const avgHRV = recentHRV.reduce((a, b) => a + b, 0) / recentHRV.length;

  // HRV interpretation: Higher HRV = better recovery, lower risk
  // Normal: 20-100ms, Stressed: < 20ms, Excellent: > 100ms
  let impact = 0;
  let trend: "improving" | "stable" | "declining" = "stable";
  let recommendation = "";

  if (avgHRV > 100) {
    impact = -0.15; // Protective factor
    recommendation = "Excellent HRV - Strong recovery capacity";
  } else if (avgHRV > 50) {
    impact = -0.05;
    recommendation = "Good HRV - Adequate recovery";
  } else if (avgHRV > 20) {
    impact = 0.1; // Slight risk increase
    recommendation = "Low HRV - Possible stress or fatigue";
  } else {
    impact = 0.25; // Significant risk increase
    recommendation = "Very low HRV - Significant stress/fatigue detected";
  }

  // Trend analysis
  if (recentHRV.length >= 3) {
    const oldAvg = recentHRV.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const newAvg = recentHRV.slice(-3).reduce((a, b) => a + b, 0) / 3;
    if (newAvg > oldAvg * 1.1) trend = "improving";
    else if (newAvg < oldAvg * 0.9) trend = "declining";
  }

  return {
    factor: "Heart Rate Variability (HRV)",
    baselineImpact: 0,
    currentImpact: impact,
    riskAdjustment: impact * 0.3, // 30% weight
    trend,
    recommendation,
  };
}

/**
 * Analyze sleep patterns for occupational injury risk
 */
export function analyzeSleepPatterns(dataPoints: BiometricDataPoint[]): BiometricRiskAdjustment {
  if (dataPoints.length === 0) {
    return {
      factor: "Sleep Quality",
      baselineImpact: 0,
      currentImpact: 0,
      riskAdjustment: 0,
      trend: "stable",
      recommendation: "Insufficient data",
    };
  }

  const recentSleep = dataPoints.slice(-7).map(p => p.sleepQuality);
  const avgSleep = recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length;

  // Sleep quality interpretation: Poor sleep increases injury risk significantly
  let impact = 0;
  let recommendation = "";

  if (avgSleep >= 80) {
    impact = -0.20; // Protective
    recommendation = "Excellent sleep quality - Low injury risk";
  } else if (avgSleep >= 60) {
    impact = -0.05;
    recommendation = "Good sleep quality - Normal injury risk";
  } else if (avgSleep >= 40) {
    impact = 0.20; // Increased risk
    recommendation = "Poor sleep quality - Increased injury risk (fatigue-related)";
  } else {
    impact = 0.35; // Significant risk
    recommendation = "Very poor sleep - CRITICAL: High fatigue-related injury risk";
  }

  let trend: "improving" | "stable" | "declining" = "stable";
  if (recentSleep.length >= 3) {
    const oldAvg = recentSleep.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const newAvg = recentSleep.slice(-3).reduce((a, b) => a + b, 0) / 3;
    if (newAvg > oldAvg * 1.1) trend = "improving";
    else if (newAvg < oldAvg * 0.9) trend = "declining";
  }

  return {
    factor: "Sleep Quality & Recovery",
    baselineImpact: 0,
    currentImpact: impact,
    riskAdjustment: impact * 0.35, // 35% weight
    trend,
    recommendation,
  };
}

/**
 * Analyze cardiovascular stress indicators
 */
export function analyzeCardiovascularStress(dataPoints: BiometricDataPoint[]): BiometricRiskAdjustment {
  if (dataPoints.length === 0) {
    return {
      factor: "Cardiovascular Stress",
      baselineImpact: 0,
      currentImpact: 0,
      riskAdjustment: 0,
      trend: "stable",
      recommendation: "Insufficient data",
    };
  }

  const recentBP = dataPoints.slice(-7).map(p => p.bloodPressure.systolic);
  const avgSystolic = recentBP.reduce((a, b) => a + b, 0) / recentBP.length;

  let impact = 0;
  let recommendation = "";

  if (avgSystolic < 120) {
    impact = -0.10; // Protective
    recommendation = "Normal blood pressure - Low cardiovascular risk";
  } else if (avgSystolic < 130) {
    impact = 0.05;
    recommendation = "Elevated blood pressure - Monitor closely";
  } else if (avgSystolic < 140) {
    impact = 0.20; // Increased risk
    recommendation = "Stage 1 Hypertension - Increased cardiac event risk";
  } else {
    impact = 0.35; // Significant risk
    recommendation = "Stage 2 Hypertension - CRITICAL: High cardiac event risk";
  }

  let trend: "improving" | "stable" | "declining" = "stable";
  if (recentBP.length >= 3) {
    const oldAvg = recentBP.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const newAvg = recentBP.slice(-3).reduce((a, b) => a + b, 0) / 3;
    if (newAvg < oldAvg * 0.95) trend = "improving";
    else if (newAvg > oldAvg * 1.05) trend = "declining";
  }

  return {
    factor: "Cardiovascular Stress (Blood Pressure)",
    baselineImpact: 0,
    currentImpact: impact,
    riskAdjustment: impact * 0.25, // 25% weight
    trend,
    recommendation,
  };
}

/**
 * Analyze activity levels for occupational capacity
 */
export function analyzeActivityLevel(dataPoints: BiometricDataPoint[]): BiometricRiskAdjustment {
  if (dataPoints.length === 0) {
    return {
      factor: "Activity Level",
      baselineImpact: 0,
      currentImpact: 0,
      riskAdjustment: 0,
      trend: "stable",
      recommendation: "Insufficient data",
    };
  }

  const recentSteps = dataPoints.slice(-7).map(p => p.stepCount);
  const avgSteps = recentSteps.reduce((a, b) => a + b, 0) / recentSteps.length;

  let impact = 0;
  let recommendation = "";

  if (avgSteps >= 10000) {
    impact = -0.15; // Protective (good fitness)
    recommendation = "High activity level - Good physical conditioning";
  } else if (avgSteps >= 7000) {
    impact = -0.05;
    recommendation = "Moderate activity level - Adequate fitness";
  } else if (avgSteps >= 3000) {
    impact = 0.15; // Increased risk (deconditioning)
    recommendation = "Low activity level - Deconditioning may increase injury risk";
  } else {
    impact = 0.30;
    recommendation = "Very low activity - Significant deconditioning";
  }

  let trend: "improving" | "stable" | "declining" = "stable";
  if (recentSteps.length >= 3) {
    const oldAvg = recentSteps.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const newAvg = recentSteps.slice(-3).reduce((a, b) => a + b, 0) / 3;
    if (newAvg > oldAvg * 1.1) trend = "improving";
    else if (newAvg < oldAvg * 0.9) trend = "declining";
  }

  return {
    factor: "Physical Activity & Conditioning",
    baselineImpact: 0,
    currentImpact: impact,
    riskAdjustment: impact * 0.2, // 20% weight
    trend,
    recommendation,
  };
}

/**
 * Perform comprehensive biometric analysis
 */
export function performBiometricAnalysis(wearableProfile: WearableDeviceProfile): BiometricIntelligenceResult {
  const adjustments: BiometricRiskAdjustment[] = [
    analyzeHeartRateVariability(wearableProfile.dataPoints),
    analyzeSleepPatterns(wearableProfile.dataPoints),
    analyzeCardiovascularStress(wearableProfile.dataPoints),
    analyzeActivityLevel(wearableProfile.dataPoints),
  ];

  const totalRiskAdjustment = adjustments.reduce((sum, a) => sum + a.riskAdjustment, 0);
  const overallBiometricRisk = Math.max(0, Math.min(1, 0.5 + totalRiskAdjustment)); // Centered at 0.5

  const alerts: string[] = [];
  const recommendations: string[] = [];

  adjustments.forEach(adj => {
    if (adj.currentImpact > 0.2) {
      alerts.push(`⚠️ ${adj.factor}: ${adj.recommendation}`);
    }
    if (adj.trend === "declining") {
      alerts.push(`📉 ${adj.factor} is declining - Monitor closely`);
    }
    recommendations.push(adj.recommendation);
  });

  const trendAnalysis = adjustments
    .filter(a => a.trend !== "stable")
    .map(a => `${a.factor}: ${a.trend}`)
    .join("; ");

  return {
    overallBiometricRisk,
    riskAdjustments: adjustments,
    totalRiskAdjustment,
    alerts,
    recommendations,
    trendAnalysis: trendAnalysis || "All metrics stable",
  };
}

/**
 * Generate biometric intelligence report
 */
export function generateBiometricReport(result: BiometricIntelligenceResult): string {
  let report = "# BIOMETRIC INTELLIGENCE ANALYSIS\n\n";
  report += `## Overall Biometric Risk: ${(result.overallBiometricRisk * 100).toFixed(1)}%\n`;
  report += `## Net Risk Adjustment: ${(result.totalRiskAdjustment > 0 ? "+" : "")}${(result.totalRiskAdjustment * 100).toFixed(1)}%\n\n`;

  if (result.alerts.length > 0) {
    report += "## ⚠️ ALERTS\n";
    result.alerts.forEach(alert => {
      report += `- ${alert}\n`;
    });
    report += "\n";
  }

  report += "## Metric Analysis\n";
  result.riskAdjustments.forEach(adj => {
    report += `\n### ${adj.factor}\n`;
    report += `- Current Impact: ${(adj.currentImpact > 0 ? "+" : "")}${(adj.currentImpact * 100).toFixed(1)}%\n`;
    report += `- Trend: ${adj.trend}\n`;
    report += `- Recommendation: ${adj.recommendation}\n`;
  });

  report += `\n## Trend Analysis\n${result.trendAnalysis}\n`;

  return report;
}
