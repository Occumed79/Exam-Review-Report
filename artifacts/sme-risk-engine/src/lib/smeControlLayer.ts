/**
 * SME Control Layer
 * Provides two modes of operation:
 * 1. Autonomous Intelligence (v1): Full engine autonomy with all regulations applied
 * 2. SME-Guided Intelligence (v2): SME selectively enables/disables regulations and risk factors
 */

export interface RegulatoryToggle {
  id: string;
  name: string;
  category: "medical" | "occupational" | "legal" | "deployment" | "state" | "international";
  description: string;
  enabled: boolean;
  impactOnRisk: number; // 0-1, how much this regulation impacts final score
}

export interface RiskFactorToggle {
  id: string;
  name: string;
  category: "medical" | "occupational" | "environmental" | "behavioral" | "demographic";
  description: string;
  enabled: boolean;
  weight: number; // 0-1, how much this factor influences the score
}

export interface SMEControlConfiguration {
  mode: "autonomous" | "guided";
  regulatoryToggles: RegulatoryToggle[];
  riskFactorToggles: RiskFactorToggle[];
  customWeights: Record<string, number>; // Override default weights
  excludedConditions: string[]; // Conditions to exclude from analysis
  includedConditions: string[]; // Conditions to specifically include
}

export interface AnalysisResult {
  mode: "autonomous" | "guided";
  baselineRisk: number; // Risk without any SME adjustments
  adjustedRisk: number; // Risk after SME toggles applied
  riskAdjustment: number; // Difference between baseline and adjusted
  appliedRegulations: RegulatoryToggle[];
  appliedRiskFactors: RiskFactorToggle[];
  smeModifications: Array<{
    regulation: string;
    action: "enabled" | "disabled" | "weighted";
    reason?: string;
  }>;
}

/**
 * Default Regulatory Toggles (MOD 18 Updated)
 */
export const defaultRegulatoryToggles: RegulatoryToggle[] = [
  // MOD 18 Standards
  {
    id: "mod18-cardiovascular",
    name: "MOD 18 Cardiovascular Standards",
    category: "deployment",
    description: "Cardiac fitness requirements for military deployment (MOD 18 Tab A)",
    enabled: true,
    impactOnRisk: 0.25,
  },
  {
    id: "mod18-respiratory",
    name: "MOD 18 Respiratory Standards",
    category: "deployment",
    description: "Respiratory fitness and asthma control requirements (MOD 18 Tab A)",
    enabled: true,
    impactOnRisk: 0.20,
  },
  {
    id: "mod18-metabolic",
    name: "MOD 18 Metabolic Standards",
    category: "deployment",
    description: "Diabetes and metabolic disorder requirements (MOD 18 Tab A)",
    enabled: true,
    impactOnRisk: 0.18,
  },
  {
    id: "mod18-neurological",
    name: "MOD 18 Neurological Standards",
    category: "deployment",
    description: "Seizure disorder and neurological fitness (MOD 18 Tab A)",
    enabled: true,
    impactOnRisk: 0.22,
  },
  {
    id: "mod18-medication-stability",
    name: "MOD 18 Medication Stability",
    category: "deployment",
    description: "Medication resupply and cold-chain requirements (MOD 18 Tab A)",
    enabled: true,
    impactOnRisk: 0.15,
  },

  // POST Standards
  {
    id: "post-cardiovascular",
    name: "POST Cardiovascular Fitness",
    category: "occupational",
    description: "Peace Officer Standards and Training cardiovascular requirements",
    enabled: true,
    impactOnRisk: 0.20,
  },
  {
    id: "post-psychological",
    name: "POST Psychological Fitness",
    category: "occupational",
    description: "POST psychological and behavioral health standards",
    enabled: true,
    impactOnRisk: 0.18,
  },

  // NFPA 1582
  {
    id: "nfpa-respiratory",
    name: "NFPA 1582 Respiratory Standards",
    category: "occupational",
    description: "Firefighter respiratory fitness and asthma control",
    enabled: true,
    impactOnRisk: 0.22,
  },
  {
    id: "nfpa-cardiac",
    name: "NFPA 1582 Cardiac Standards",
    category: "occupational",
    description: "Firefighter cardiac fitness and stress tolerance",
    enabled: true,
    impactOnRisk: 0.25,
  },

  // FMCSA/DOT
  {
    id: "dot-vision",
    name: "DOT Vision Standards",
    category: "occupational",
    description: "Commercial driver vision and acuity requirements",
    enabled: true,
    impactOnRisk: 0.20,
  },
  {
    id: "dot-seizure",
    name: "DOT Seizure Standards",
    category: "occupational",
    description: "Commercial driver seizure disorder requirements",
    enabled: true,
    impactOnRisk: 0.30,
  },

  // ADA/EEOC
  {
    id: "ada-direct-threat",
    name: "ADA Direct Threat Assessment",
    category: "legal",
    description: "ADA direct threat criteria and reasonable accommodation",
    enabled: true,
    impactOnRisk: 0.25,
  },
  {
    id: "eeoc-compliance",
    name: "EEOC Compliance Standards",
    category: "legal",
    description: "EEOC employment discrimination and medical inquiry standards",
    enabled: true,
    impactOnRisk: 0.15,
  },

  // State-Specific
  {
    id: "state-osha",
    name: "State OSHA Requirements",
    category: "state",
    description: "State-specific occupational safety and health standards",
    enabled: true,
    impactOnRisk: 0.10,
  },

  // International
  {
    id: "centcom-theater",
    name: "CENTCOM Theater Medical Requirements",
    category: "international",
    description: "CENTCOM area of responsibility deployment fitness",
    enabled: true,
    impactOnRisk: 0.20,
  },
  {
    id: "africom-theater",
    name: "AFRICOM Theater Medical Requirements",
    category: "international",
    description: "AFRICOM area of responsibility deployment fitness",
    enabled: true,
    impactOnRisk: 0.18,
  },
];

/**
 * Default Risk Factor Toggles
 */
export const defaultRiskFactorToggles: RiskFactorToggle[] = [
  {
    id: "medical-conditions",
    name: "Medical Conditions",
    category: "medical",
    description: "Existing medical diagnoses and severity",
    enabled: true,
    weight: 0.30,
  },
  {
    id: "injury-history",
    name: "Injury History",
    category: "medical",
    description: "Prior occupational injuries and recurrence patterns",
    enabled: true,
    weight: 0.20,
  },
  {
    id: "functional-capacity",
    name: "Functional Capacity",
    category: "occupational",
    description: "Physical and cognitive capacity assessment",
    enabled: true,
    weight: 0.25,
  },
  {
    id: "occupational-hazards",
    name: "Occupational Hazards",
    category: "occupational",
    description: "Job-specific hazard exposure and risk",
    enabled: true,
    weight: 0.20,
  },
  {
    id: "environmental-factors",
    name: "Environmental Factors",
    category: "environmental",
    description: "Climate, altitude, air quality impacts",
    enabled: true,
    weight: 0.15,
  },
  {
    id: "sdoh-factors",
    name: "Social Determinants of Health",
    category: "behavioral",
    description: "Socioeconomic and environmental barriers",
    enabled: true,
    weight: 0.12,
  },
  {
    id: "age-demographic",
    name: "Age and Demographics",
    category: "demographic",
    description: "Age-related risk factors",
    enabled: true,
    weight: 0.10,
  },
];

/**
 * Create default SME Control Configuration
 */
export function createDefaultConfiguration(mode: "autonomous" | "guided"): SMEControlConfiguration {
  return {
    mode,
    regulatoryToggles: [...defaultRegulatoryToggles],
    riskFactorToggles: [...defaultRiskFactorToggles],
    customWeights: {},
    excludedConditions: [],
    includedConditions: [],
  };
}

/**
 * Apply SME Control Configuration to Risk Analysis
 */
export function applySMEControls(
  baselineRisk: number,
  configuration: SMEControlConfiguration,
  caseData: any
): AnalysisResult {
  const appliedRegulations: RegulatoryToggle[] = [];
  const appliedRiskFactors: RiskFactorToggle[] = [];
  const smeModifications: any[] = [];

  let adjustedRisk = baselineRisk;

  // Apply Regulatory Toggles
  configuration.regulatoryToggles.forEach(toggle => {
    if (toggle.enabled) {
      appliedRegulations.push(toggle);
    } else {
      // Disable this regulation - reduce risk by its impact
      adjustedRisk = Math.max(0, adjustedRisk - toggle.impactOnRisk * 0.5);
      smeModifications.push({
        regulation: toggle.name,
        action: "disabled",
        reason: `SME disabled ${toggle.name}`,
      });
    }
  });

  // Apply Risk Factor Toggles
  configuration.riskFactorToggles.forEach(factor => {
    if (factor.enabled) {
      appliedRiskFactors.push(factor);
    } else {
      // Disable this risk factor - reduce risk by its weight
      adjustedRisk = Math.max(0, adjustedRisk - factor.weight * 0.3);
      smeModifications.push({
        regulation: factor.name,
        action: "disabled",
        reason: `SME disabled ${factor.name}`,
      });
    }
  });

  // Apply Custom Weights
  Object.entries(configuration.customWeights).forEach(([key, weight]) => {
    const factor = appliedRiskFactors.find(f => f.id === key);
    if (factor) {
      const weightDifference = (weight as number) - factor.weight;
      adjustedRisk += weightDifference * 0.1;
      smeModifications.push({
        regulation: factor.name,
        action: "weighted",
        reason: `SME adjusted weight from ${factor.weight} to ${weight}`,
      });
    }
  });

  // Apply Condition Filters
  if (configuration.excludedConditions.length > 0) {
    configuration.excludedConditions.forEach(condition => {
      adjustedRisk = Math.max(0, adjustedRisk - 0.05);
      smeModifications.push({
        regulation: `Excluded Condition: ${condition}`,
        action: "disabled",
        reason: `SME excluded ${condition} from analysis`,
      });
    });
  }

  adjustedRisk = Math.min(1, Math.max(0, adjustedRisk));

  return {
    mode: configuration.mode,
    baselineRisk,
    adjustedRisk,
    riskAdjustment: adjustedRisk - baselineRisk,
    appliedRegulations,
    appliedRiskFactors,
    smeModifications,
  };
}

/**
 * Generate SME Control Report
 */
export function generateSMEControlReport(result: AnalysisResult): string {
  let report = "# SME CONTROL LAYER ANALYSIS\n\n";
  report += `## Mode: ${result.mode.toUpperCase()}\n\n`;

  report += "## Risk Scores\n";
  report += `- **Baseline Risk** (All regulations applied): ${(result.baselineRisk * 100).toFixed(1)}%\n`;
  report += `- **Adjusted Risk** (After SME controls): ${(result.adjustedRisk * 100).toFixed(1)}%\n`;
  report += `- **Risk Adjustment**: ${(result.riskAdjustment > 0 ? "+" : "")}${(result.riskAdjustment * 100).toFixed(1)}%\n\n`;

  if (result.mode === "guided" && result.smeModifications.length > 0) {
    report += "## SME Modifications\n";
    result.smeModifications.forEach(mod => {
      report += `- **${mod.regulation}**: ${mod.action.toUpperCase()}\n`;
      if (mod.reason) report += `  Reason: ${mod.reason}\n`;
    });
    report += "\n";
  }

  report += `## Applied Regulations (${result.appliedRegulations.length})\n`;
  result.appliedRegulations.forEach(reg => {
    report += `- ✅ ${reg.name} (Impact: ${(reg.impactOnRisk * 100).toFixed(0)}%)\n`;
  });
  report += "\n";

  report += `## Applied Risk Factors (${result.appliedRiskFactors.length})\n`;
  result.appliedRiskFactors.forEach(factor => {
    report += `- ✅ ${factor.name} (Weight: ${(factor.weight * 100).toFixed(0)}%)\n`;
  });

  return report;
}

/**
 * Export SME Configuration for Audit Trail
 */
export function exportSMEConfiguration(configuration: SMEControlConfiguration): string {
  let config = "# SME CONTROL CONFIGURATION\n\n";
  config += `Mode: ${configuration.mode}\n\n`;

  config += "## Enabled Regulations\n";
  configuration.regulatoryToggles
    .filter(t => t.enabled)
    .forEach(t => {
      config += `- ${t.name}\n`;
    });

  config += "\n## Disabled Regulations\n";
  configuration.regulatoryToggles
    .filter(t => !t.enabled)
    .forEach(t => {
      config += `- ${t.name}\n`;
    });

  config += "\n## Custom Weights\n";
  Object.entries(configuration.customWeights).forEach(([key, value]) => {
    config += `- ${key}: ${value}\n`;
  });

  if (configuration.excludedConditions.length > 0) {
    config += "\n## Excluded Conditions\n";
    configuration.excludedConditions.forEach(c => {
      config += `- ${c}\n`;
    });
  }

  return config;
}
