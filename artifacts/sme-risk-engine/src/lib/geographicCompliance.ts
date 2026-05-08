/**
 * Geographic & Deployment Compliance Module
 * Handles state-specific laws and international deployment regulations (CENTCOM, AFRICOM, etc.)
 */

export interface StateLaw {
  state: string;
  lawName: string;
  description: string;
  impactOnRisk: number; // 0-1
  specificCriteria: string[];
  regulatoryBody: string;
}

export interface DeploymentRegulation {
  region: "CENTCOM" | "AFRICOM" | "EUCOM" | "INDOPACOM" | "SOUTHCOM";
  regulationName: string;
  version: string;
  disqualifyingConditions: string[];
  waiverProcess: string;
  environmentalFactors: string[];
  medicationRestrictions: string[];
}

export interface GeographicComplianceResult {
  stateCompliance: Array<{
    state: string;
    isCompliant: boolean;
    issues: string[];
    recommendations: string[];
  }>;
  deploymentCompliance: Array<{
    region: string;
    isCompliant: boolean;
    waiverRequired: boolean;
    issues: string[];
    recommendations: string[];
  }>;
  overallComplianceScore: number; // 0-1
}

/**
 * State-Specific Laws Database
 */
export const stateLawsDatabase: Record<string, StateLaw[]> = {
  "California": [
    {
      state: "California",
      lawName: "Cal/OSHA Heat Illness Prevention",
      description: "Stringent requirements for outdoor workers to prevent heat-related illness",
      impactOnRisk: 0.15,
      specificCriteria: [
        "Access to water and shade",
        "High-heat procedures (> 95°F)",
        "Emergency response training",
        "Acclimatization protocols",
      ],
      regulatoryBody: "Cal/OSHA",
    },
    {
      state: "California",
      lawName: "POST Medical Screening Standards",
      description: "Detailed medical criteria for law enforcement officers",
      impactOnRisk: 0.25,
      specificCriteria: [
        "Cardiovascular fitness (METs)",
        "Respiratory stability (FEV1)",
        "Neurological integrity",
        "Vision and hearing minimums",
      ],
      regulatoryBody: "CA POST",
    },
  ],
  "New York": [
    {
      state: "New York",
      lawName: "PESH Act",
      description: "Public Employee Safety and Health requirements",
      impactOnRisk: 0.1,
      specificCriteria: [
        "Toxic substance exposure limits",
        "Right to Know disclosures",
        "Public sector safety standards",
      ],
      regulatoryBody: "NY State DOL",
    },
  ],
  "Texas": [
    {
      state: "Texas",
      lawName: "TCOLE Medical Fitness (L-2)",
      description: "Medical and psychological fitness for law enforcement",
      impactOnRisk: 0.2,
      specificCriteria: [
        "L-2 Medical Declaration",
        "L-3 Psychological Declaration",
        "Drug screening requirement",
      ],
      regulatoryBody: "TCOLE",
    },
  ],
};

/**
 * International Deployment Regulations Database
 */
export const deploymentRegulationsDatabase: DeploymentRegulation[] = [
  {
    region: "CENTCOM",
    regulationName: "MOD 17/18 Tab A",
    version: "April 2023",
    disqualifyingConditions: [
      "Moderate/Severe Asthma (FEV1 < 50%)",
      "Seizure within 12 months",
      "Diabetes with HbA1c > 7.0",
      "History of heat stroke within 24 months",
      "Conditions requiring anticoagulation",
    ],
    waiverProcess: "CENTCOM Surgeon Waiver Authority",
    environmentalFactors: [
      "Extreme heat (> 120°F)",
      "Dust and particulates",
      "Limited medical facilities",
      "High physiologic demand",
    ],
    medicationRestrictions: [
      "No refrigeration required",
      "No frequent resupply (> 90 days)",
      "No controlled substances (limited)",
    ],
  },
  {
    region: "AFRICOM",
    regulationName: "ACI 4200.09",
    version: "March 2025",
    disqualifyingConditions: [
      "Infectious disease vulnerability",
      "Lack of required immunizations (Yellow Fever, Malaria)",
      "Severe chronic conditions",
    ],
    waiverProcess: "AFRICOM Surgeon Office",
    environmentalFactors: [
      "Tropical diseases",
      "Limited infrastructure",
      "Extreme humidity",
    ],
    medicationRestrictions: [
      "Malaria prophylaxis required",
      "Cold chain maintenance limited",
    ],
  },
];

/**
 * Analyze Geographic & Deployment Compliance
 */
export function analyzeGeographicCompliance(
  caseData: any,
  targetState?: string,
  targetRegion?: string
): GeographicComplianceResult {
  const stateCompliance: any[] = [];
  const deploymentCompliance: any[] = [];

  // Analyze State Compliance
  if (targetState && stateLawsDatabase[targetState]) {
    const laws = stateLawsDatabase[targetState];
    const issues: string[] = [];
    const recommendations: string[] = [];

    laws.forEach(law => {
      // Check for conflicts with medical conditions
      caseData.medicalConditions?.forEach((c: any) => {
        if (law.lawName.includes("Heat") && c.conditionName.includes("Heat")) {
          issues.push(`Conflict with ${law.lawName}: History of heat illness`);
          recommendations.push("Implement strict acclimatization and monitoring");
        }
        if (law.lawName.includes("POST") && c.severity === "severe") {
          issues.push(`Potential non-compliance with ${law.lawName} standards`);
          recommendations.push("Conduct detailed POST-compliant medical evaluation");
        }
      });
    });

    stateCompliance.push({
      state: targetState,
      isCompliant: issues.length === 0,
      issues,
      recommendations,
    });
  }

  // Analyze Deployment Compliance
  if (targetRegion) {
    const reg = deploymentRegulationsDatabase.find(r => r.region === targetRegion);
    if (reg) {
      const issues: string[] = [];
      const recommendations: string[] = [];
      let waiverRequired = false;

      caseData.medicalConditions?.forEach((c: any) => {
        // Check disqualifying conditions
        if (reg.disqualifyingConditions.some(dc => c.conditionName.toLowerCase().includes(dc.toLowerCase().split(" ")[0]))) {
          issues.push(`Disqualifying condition for ${reg.region}: ${c.conditionName}`);
          waiverRequired = true;
          recommendations.push(`Submit waiver request to ${reg.waiverProcess}`);
        }

        // Check medication restrictions
        if (caseData.medications?.some((m: any) => m.requiresRefrigeration)) {
          issues.push(`Medication restriction for ${reg.region}: Requires refrigeration`);
          waiverRequired = true;
          recommendations.push("Switch to stable medication or request waiver");
        }
      });

      deploymentCompliance.push({
        region: targetRegion,
        isCompliant: issues.length === 0,
        waiverRequired,
        issues,
        recommendations,
      });
    }
  }

  const overallComplianceScore = (stateCompliance.every(s => s.isCompliant) && deploymentCompliance.every(d => !d.waiverRequired)) ? 1 : 0.5;

  return {
    stateCompliance,
    deploymentCompliance,
    overallComplianceScore,
  };
}

/**
 * Generate Geographic Compliance Report
 */
export function generateGeographicReport(result: GeographicComplianceResult): string {
  let report = "# GEOGRAPHIC & DEPLOYMENT COMPLIANCE REPORT\n\n";

  if (result.stateCompliance.length > 0) {
    report += "## State-Specific Compliance\n";
    result.stateCompliance.forEach(s => {
      report += `### State: ${s.state}\n`;
      report += `**Status**: ${s.isCompliant ? "✅ COMPLIANT" : "⚠️ ISSUES IDENTIFIED"}\n\n`;
      if (s.issues.length > 0) {
        report += "**Issues**:\n";
        s.issues.forEach(i => report += `- ${i}\n`);
        report += "\n";
      }
      if (s.recommendations.length > 0) {
        report += "**Recommendations**:\n";
        s.recommendations.forEach(r => report += `- ${r}\n`);
        report += "\n";
      }
    });
  }

  if (result.deploymentCompliance.length > 0) {
    report += "## International Deployment Compliance\n";
    result.deploymentCompliance.forEach(d => {
      report += `### Region: ${d.region}\n`;
      report += `**Status**: ${d.isCompliant ? "✅ COMPLIANT" : d.waiverRequired ? "⚠️ WAIVER REQUIRED" : "❌ NON-COMPLIANT"}\n\n`;
      if (d.issues.length > 0) {
        report += "**Issues**:\n";
        d.issues.forEach(i => report += `- ${i}\n`);
        report += "\n";
      }
      if (d.recommendations.length > 0) {
        report += "**Recommendations**:\n";
        d.recommendations.forEach(r => report += `- ${r}\n`);
        report += "\n";
      }
    });
  }

  return report;
}
