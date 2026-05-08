/**
 * Essential Job Functions (EJF) Engine
 * Maps medical conditions to specific job functions and DOL requirements
 * Determines where "Direct Threat" exists and what accommodations are feasible
 */

export interface EssentialJobFunction {
  id: string;
  name: string;
  description: string;
  frequency: "constant" | "frequent" | "occasional" | "rare";
  physicalDemand: "sedentary" | "light" | "medium" | "heavy" | "very-heavy";
  requiredCapacity: number; // 0-100 (% of normal capacity needed)
  riskIfImpaired: "low" | "moderate" | "high" | "critical";
  accommodationPossible: boolean;
  accommodationExamples: string[];
}

export interface DOLMedicalRequirement {
  jobTitle: string;
  socCode: string;
  medicalCondition: string;
  requirement: string;
  source: string; // e.g., "DOT", "NFPA 1582", "MOD 18"
  severity: "advisory" | "conditional" | "disqualifying";
  testRequired: string[];
}

export interface EJFConflictAnalysis {
  jobTitle: string;
  medicalCondition: string;
  conflictingFunctions: Array<{
    function: EssentialJobFunction;
    conflictSeverity: "low" | "moderate" | "high" | "critical";
    explanation: string;
    accommodationFeasible: boolean;
  }>;
  overallDirectThreat: number; // 0-1
  accommodationOptions: string[];
  recommendation: string;
}

/**
 * Essential Job Functions Database
 * Based on DOL/O*NET standards
 */
export const essentialJobFunctionsDatabase: Record<string, EssentialJobFunction[]> = {
  // Commercial Bus Driver
  "commercial-bus-driver": [
    {
      id: "cbdriver-steering",
      name: "Steering and Vehicle Control",
      description: "Operate steering wheel, accelerator, brake pedals with precision and coordination",
      frequency: "constant",
      physicalDemand: "medium",
      requiredCapacity: 95,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "cbdriver-vision",
      name: "Visual Monitoring",
      description: "Monitor road, mirrors, passengers, and traffic continuously",
      frequency: "constant",
      physicalDemand: "light",
      requiredCapacity: 100,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "cbdriver-reaction",
      name: "Emergency Response",
      description: "React quickly to hazards, brake suddenly, swerve to avoid obstacles",
      frequency: "frequent",
      physicalDemand: "heavy",
      requiredCapacity: 95,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "cbdriver-communication",
      name: "Communication with Passengers",
      description: "Speak clearly, hear announcements, respond to passenger requests",
      frequency: "frequent",
      physicalDemand: "light",
      requiredCapacity: 80,
      riskIfImpaired: "moderate",
      accommodationPossible: true,
      accommodationExamples: ["Hearing aids", "Microphone system"],
    },
    {
      id: "cbdriver-endurance",
      name: "Sustained Sitting and Attention",
      description: "Sit for 6-8 hours continuously with mental alertness",
      frequency: "constant",
      physicalDemand: "light",
      requiredCapacity: 90,
      riskIfImpaired: "high",
      accommodationPossible: true,
      accommodationExamples: ["Rest breaks", "Ergonomic seat", "Shift reduction"],
    },
  ],

  // Firefighter
  "firefighter": [
    {
      id: "ff-heavy-lifting",
      name: "Heavy Lifting and Carrying",
      description: "Lift and carry 75+ lbs (equipment, victims, tools) repeatedly",
      frequency: "frequent",
      physicalDemand: "very-heavy",
      requiredCapacity: 100,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "ff-climbing",
      name: "Climbing Ladders and Stairs",
      description: "Climb ladders, stairs, and ropes in full gear (75+ lbs)",
      frequency: "frequent",
      physicalDemand: "very-heavy",
      requiredCapacity: 100,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "ff-heat-exposure",
      name: "Heat and Smoke Exposure",
      description: "Work in extreme heat (200°F+) and toxic smoke for extended periods",
      frequency: "frequent",
      physicalDemand: "heavy",
      requiredCapacity: 100,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "ff-respiratory",
      name: "Respiratory Demands",
      description: "Breathe through SCBA (Self-Contained Breathing Apparatus) in oxygen-depleted environments",
      frequency: "frequent",
      physicalDemand: "heavy",
      requiredCapacity: 100,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "ff-balance",
      name: "Balance and Coordination",
      description: "Maintain balance on unstable surfaces, roofs, and in zero-visibility conditions",
      frequency: "frequent",
      physicalDemand: "heavy",
      requiredCapacity: 95,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "ff-cardiac-demand",
      name: "Cardiac Stress Tolerance",
      description: "Tolerate sudden cardiac demands (10-15 MET exertion)",
      frequency: "frequent",
      physicalDemand: "very-heavy",
      requiredCapacity: 100,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
  ],

  // Surgeon
  "surgeon": [
    {
      id: "surg-fine-motor",
      name: "Fine Motor Control",
      description: "Perform precise surgical movements with hands and fingers for 4-8 hours",
      frequency: "constant",
      physicalDemand: "light",
      requiredCapacity: 100,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "surg-standing",
      name: "Prolonged Standing",
      description: "Stand at operating table for 4-8 hours continuously",
      frequency: "constant",
      physicalDemand: "medium",
      requiredCapacity: 90,
      riskIfImpaired: "high",
      accommodationPossible: true,
      accommodationExamples: ["Anti-fatigue mat", "Surgical stool", "Shorter cases"],
    },
    {
      id: "surg-visual-acuity",
      name: "Visual Acuity and Focus",
      description: "Maintain sharp focus on surgical field for extended periods",
      frequency: "constant",
      physicalDemand: "light",
      requiredCapacity: 100,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "surg-tremor-control",
      name: "Tremor Control",
      description: "Eliminate hand tremor during delicate surgical procedures",
      frequency: "constant",
      physicalDemand: "light",
      requiredCapacity: 100,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "surg-infection-control",
      name: "Infection Control Compliance",
      description: "Maintain sterile technique and bloodborne pathogen precautions",
      frequency: "constant",
      physicalDemand: "light",
      requiredCapacity: 100,
      riskIfImpaired: "high",
      accommodationPossible: true,
      accommodationExamples: ["Enhanced PPE", "Dedicated surgical team"],
    },
  ],

  // Heavy Equipment Operator
  "heavy-equipment-operator": [
    {
      id: "heo-coordination",
      name: "Hand-Eye-Foot Coordination",
      description: "Coordinate hands, eyes, and feet simultaneously for equipment control",
      frequency: "constant",
      physicalDemand: "medium",
      requiredCapacity: 95,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
    {
      id: "heo-vibration",
      name: "Vibration Tolerance",
      description: "Tolerate continuous vibration from heavy equipment (8-10 hours/day)",
      frequency: "constant",
      physicalDemand: "light",
      requiredCapacity: 85,
      riskIfImpaired: "moderate",
      accommodationPossible: true,
      accommodationExamples: ["Vibration-damping seat", "Shorter shifts"],
    },
    {
      id: "heo-noise",
      name: "Noise Tolerance",
      description: "Work in high-noise environment (90+ dB) with hearing protection",
      frequency: "constant",
      physicalDemand: "light",
      requiredCapacity: 80,
      riskIfImpaired: "moderate",
      accommodationPossible: true,
      accommodationExamples: ["Double hearing protection", "Noise-canceling headset"],
    },
    {
      id: "heo-situational-awareness",
      name: "Situational Awareness",
      description: "Monitor equipment, surroundings, and worker safety continuously",
      frequency: "constant",
      physicalDemand: "light",
      requiredCapacity: 95,
      riskIfImpaired: "critical",
      accommodationPossible: false,
      accommodationExamples: [],
    },
  ],

  // Physician Assistant
  "physician-assistant": [
    {
      id: "pa-patient-interaction",
      name: "Patient Interaction and Communication",
      description: "Communicate with patients, take history, explain procedures",
      frequency: "constant",
      physicalDemand: "light",
      requiredCapacity: 85,
      riskIfImpaired: "moderate",
      accommodationPossible: true,
      accommodationExamples: ["Hearing aids", "Written materials", "Extended appointment time"],
    },
    {
      id: "pa-physical-exam",
      name: "Physical Examination",
      description: "Perform physical exams, palpation, auscultation",
      frequency: "frequent",
      physicalDemand: "light",
      requiredCapacity: 90,
      riskIfImpaired: "moderate",
      accommodationPossible: true,
      accommodationExamples: ["Assistive devices", "Modified techniques"],
    },
    {
      id: "pa-standing-walking",
      name: "Standing and Walking",
      description: "Stand and walk between patient rooms for 8+ hours",
      frequency: "constant",
      physicalDemand: "light",
      requiredCapacity: 85,
      riskIfImpaired: "moderate",
      accommodationPossible: true,
      accommodationExamples: ["Mobility aids", "Shorter shifts", "Telemedicine"],
    },
    {
      id: "pa-infection-exposure",
      name: "Infection Exposure Management",
      description: "Work with infectious patients while maintaining infection control",
      frequency: "frequent",
      physicalDemand: "light",
      requiredCapacity: 90,
      riskIfImpaired: "high",
      accommodationPossible: true,
      accommodationExamples: ["Enhanced PPE", "Vaccination", "Restricted patient population"],
    },
  ],
};

/**
 * DOL Medical Requirements Database
 */
export const dolMedicalRequirementsDatabase: DOLMedicalRequirement[] = [
  // Commercial Driver
  {
    jobTitle: "Commercial Bus Driver",
    socCode: "53-3032",
    medicalCondition: "Seizure Disorder",
    requirement: "Must be seizure-free for minimum 8-10 years",
    source: "FMCSA/DOT",
    severity: "disqualifying",
    testRequired: ["EEG", "Neurology clearance"],
  },
  {
    jobTitle: "Commercial Bus Driver",
    socCode: "53-3032",
    medicalCondition: "Uncontrolled Hypertension",
    requirement: "Blood pressure must be < 140/90 mmHg",
    source: "FMCSA/DOT",
    severity: "conditional",
    testRequired: ["Blood pressure monitoring", "Cardiology evaluation"],
  },
  {
    jobTitle: "Commercial Bus Driver",
    socCode: "53-3032",
    medicalCondition: "Diabetes Mellitus",
    requirement: "Must be stable on medication, no hypoglycemic episodes",
    source: "FMCSA/DOT",
    severity: "conditional",
    testRequired: ["HbA1c", "Glucose monitoring", "Endocrinology clearance"],
  },
  {
    jobTitle: "Commercial Bus Driver",
    socCode: "53-3032",
    medicalCondition: "Vision Impairment",
    requirement: "Binocular vision 20/40 or better",
    source: "FMCSA/DOT",
    severity: "disqualifying",
    testRequired: ["Visual acuity test", "Ophthalmology evaluation"],
  },

  // Firefighter
  {
    jobTitle: "Firefighter",
    socCode: "33-2011",
    medicalCondition: "Asthma",
    requirement: "Must be well-controlled, no recent exacerbations",
    source: "NFPA 1582",
    severity: "conditional",
    testRequired: ["Spirometry", "FEV1 > 80% predicted", "Pulmonology clearance"],
  },
  {
    jobTitle: "Firefighter",
    socCode: "33-2011",
    medicalCondition: "Cardiac Arrhythmia",
    requirement: "Must have cardiology clearance for duty",
    source: "NFPA 1582",
    severity: "conditional",
    testRequired: ["ECG", "Echocardiogram", "Stress test", "Cardiology clearance"],
  },
  {
    jobTitle: "Firefighter",
    socCode: "33-2011",
    medicalCondition: "Hearing Loss",
    requirement: "Average hearing loss < 40 dB at 500, 1000, 2000, 3000 Hz",
    source: "NFPA 1582",
    severity: "conditional",
    testRequired: ["Audiometry", "Audiology evaluation"],
  },

  // Surgeon
  {
    jobTitle: "Surgeon",
    socCode: "29-1181",
    medicalCondition: "Essential Tremor",
    requirement: "Must not impair surgical precision",
    source: "ACOEM",
    severity: "conditional",
    testRequired: ["Tremor assessment", "Neurology evaluation", "Simulated surgery test"],
  },
  {
    jobTitle: "Surgeon",
    socCode: "29-1181",
    medicalCondition: "Bloodborne Pathogen Exposure",
    requirement: "Must maintain infection control protocols",
    source: "OSHA",
    severity: "conditional",
    testRequired: ["Vaccination status", "Baseline serology"],
  },
];

/**
 * Analyze EJF conflicts with medical conditions
 */
export function analyzeEJFConflicts(jobTitle: string, medicalConditions: string[]): EJFConflictAnalysis[] {
  const normalizedJob = jobTitle.toLowerCase().replace(/\s+/g, "-");
  const ejfs = essentialJobFunctionsDatabase[normalizedJob] || [];

  const analyses: EJFConflictAnalysis[] = [];

  medicalConditions.forEach(condition => {
    const conflictingFunctions = ejfs
      .map(ejf => {
        const conflict = assessConflict(condition, ejf);
        return {
          function: ejf,
          conflictSeverity: conflict.severity,
          explanation: conflict.explanation,
          accommodationFeasible: ejf.accommodationPossible && conflict.severity !== "critical",
        };
      })
      .filter(c => c.conflictSeverity !== "low");

    if (conflictingFunctions.length > 0) {
      const overallDirectThreat = Math.max(...conflictingFunctions.map(c => severityToScore(c.conflictSeverity)));

      const accommodationOptions = conflictingFunctions
        .filter(c => c.accommodationFeasible && c.function.accommodationExamples.length > 0)
        .flatMap(c => c.function.accommodationExamples);

      let recommendation = "";
      if (overallDirectThreat > 0.8) {
        recommendation = "EMPLOYMENT NOT RECOMMENDED: Medical condition creates unmitigable direct threat to essential job functions.";
      } else if (overallDirectThreat > 0.5) {
        recommendation = "CONDITIONAL EMPLOYMENT: Medical condition conflicts with critical functions. Accommodations and medical management required.";
      } else {
        recommendation = "EMPLOYMENT FEASIBLE: Medical condition conflicts with some functions but accommodations are available.";
      }

      analyses.push({
        jobTitle,
        medicalCondition: condition,
        conflictingFunctions,
        overallDirectThreat,
        accommodationOptions: [...new Set(accommodationOptions)],
        recommendation,
      });
    }
  });

  return analyses;
}

/**
 * Assess conflict between condition and EJF
 */
function assessConflict(
  condition: string,
  ejf: EssentialJobFunction
): { severity: "low" | "moderate" | "high" | "critical"; explanation: string } {
  const conditionLower = condition.toLowerCase();

  // Seizure disorder
  if (conditionLower.includes("seizure")) {
    if (ejf.riskIfImpaired === "critical") {
      return {
        severity: "critical",
        explanation: "Seizure disorder creates unacceptable risk for critical function requiring constant alertness",
      };
    }
    if (ejf.requiredCapacity > 90) {
      return { severity: "high", explanation: "Seizure risk incompatible with high-demand function" };
    }
  }

  // Asthma
  if (conditionLower.includes("asthma")) {
    if (ejf.name.includes("Heat") || ejf.name.includes("Smoke") || ejf.name.includes("Respiratory")) {
      return { severity: "critical", explanation: "Asthma incompatible with respiratory hazard exposure" };
    }
    if (ejf.physicalDemand === "very-heavy") {
      return { severity: "high", explanation: "Asthma may limit heavy exertion capacity" };
    }
  }

  // Cardiac condition
  if (conditionLower.includes("heart") || conditionLower.includes("cardiac")) {
    if (ejf.name.includes("Cardiac Stress") || ejf.physicalDemand === "very-heavy") {
      return { severity: "critical", explanation: "Cardiac condition incompatible with extreme exertion" };
    }
    if (ejf.physicalDemand === "heavy") {
      return { severity: "high", explanation: "Cardiac condition limits heavy physical demands" };
    }
  }

  // Tremor
  if (conditionLower.includes("tremor")) {
    if (ejf.name.includes("Fine Motor") || ejf.name.includes("Tremor Control")) {
      return { severity: "critical", explanation: "Essential tremor incompatible with precision-required function" };
    }
  }

  // Hearing loss
  if (conditionLower.includes("hearing")) {
    if (ejf.name.includes("Communication") || ejf.name.includes("Emergency Response")) {
      return { severity: "moderate", explanation: "Hearing loss may impair communication and emergency response" };
    }
  }

  // Low back pain
  if (conditionLower.includes("back") || conditionLower.includes("lumbar")) {
    if (ejf.name.includes("Lifting") || ejf.name.includes("Carrying")) {
      return { severity: "high", explanation: "Back pain incompatible with heavy lifting/carrying" };
    }
  }

  return { severity: "low", explanation: "No significant conflict identified" };
}

/**
 * Convert severity to numeric score
 */
function severityToScore(severity: string): number {
  switch (severity) {
    case "critical":
      return 1;
    case "high":
      return 0.7;
    case "moderate":
      return 0.4;
    case "low":
      return 0.1;
    default:
      return 0;
  }
}

/**
 * Get DOL requirements for job
 */
export function getDOLRequirements(jobTitle: string): DOLMedicalRequirement[] {
  return dolMedicalRequirementsDatabase.filter(req => req.jobTitle.toLowerCase() === jobTitle.toLowerCase());
}

/**
 * Generate EJF analysis report
 */
export function generateEJFReport(jobTitle: string, medicalConditions: string[]): string {
  const analyses = analyzeEJFConflicts(jobTitle, medicalConditions);
  const dolReqs = getDOLRequirements(jobTitle);

  let report = "# ESSENTIAL JOB FUNCTIONS (EJF) ANALYSIS\n\n";
  report += `## Position: ${jobTitle}\n\n`;

  if (analyses.length === 0) {
    report += "No significant conflicts identified between medical conditions and essential job functions.\n\n";
  } else {
    report += "## Condition-EJF Conflicts\n\n";
    analyses.forEach(analysis => {
      report += `### ${analysis.medicalCondition}\n`;
      report += `**Direct Threat Score**: ${(analysis.overallDirectThreat * 100).toFixed(0)}%\n\n`;
      report += `**Conflicting Functions**:\n`;
      analysis.conflictingFunctions.forEach(cf => {
        report += `- **${cf.function.name}** (${cf.conflictSeverity}): ${cf.explanation}\n`;
      });
      report += `\n**Recommendation**: ${analysis.recommendation}\n\n`;
      if (analysis.accommodationOptions.length > 0) {
        report += `**Possible Accommodations**: ${analysis.accommodationOptions.join(", ")}\n\n`;
      }
    });
  }

  if (dolReqs.length > 0) {
    report += "## DOL/Regulatory Medical Requirements\n\n";
    dolReqs.forEach(req => {
      report += `- **${req.medicalCondition}** (${req.source}): ${req.requirement}\n`;
      report += `  - Severity: ${req.severity}\n`;
      report += `  - Tests Required: ${req.testRequired.join(", ")}\n\n`;
    });
  }

  return report;
}
