/**
 * Exposure Metrics and O*NET Job Classification Module
 * Integrates occupational exposure data, job demands, and industry-specific risk factors
 */

export interface ExposureMetric {
  type: "chemical" | "physical" | "biological" | "ergonomic" | "psychosocial";
  name: string;
  level: number; // 0-100 severity
  threshold: number; // OSHA PEL or ACGIH TLV equivalent
  duration: string; // e.g., "8-hour TWA"
  frequency: "continuous" | "frequent" | "occasional" | "rare";
  controls: string[]; // PPE, engineering controls, etc.
}

export interface ONETJobProfile {
  socCode: string;
  jobTitle: string;
  physicalDemands: PhysicalDemand[];
  workEnvironment: WorkEnvironment[];
  hazards: string[];
  injuryRatePercentile: number; // 0-100
  baselineInjuryRate: number; // per 100,000 workers
}

export interface PhysicalDemand {
  demand: string;
  level: "sedentary" | "light" | "medium" | "heavy" | "very-heavy";
  frequency: "rarely" | "occasionally" | "frequently" | "constantly";
}

export interface WorkEnvironment {
  condition: string;
  exposure: "minimal" | "moderate" | "frequent" | "constant";
  risk: "low" | "moderate" | "high";
}

/**
 * O*NET Job Profiles Database
 * Based on O*NET 27.3 and BLS occupational injury data
 */
export const onetJobProfiles: Record<string, ONETJobProfile> = {
  "29-1071": { // Physician Assistant
    socCode: "29-1071",
    jobTitle: "Physician Assistant",
    physicalDemands: [
      { demand: "Standing", level: "light", frequency: "frequently" },
      { demand: "Walking", level: "light", frequency: "frequently" },
      { demand: "Reaching", level: "light", frequency: "frequently" },
      { demand: "Fine Manipulation", level: "light", frequency: "constantly" },
    ],
    workEnvironment: [
      { condition: "Infectious Disease Exposure", exposure: "frequent", risk: "high" },
      { condition: "Bloodborne Pathogen Exposure", exposure: "frequent", risk: "high" },
      { condition: "Radiation Exposure", exposure: "occasional", risk: "moderate" },
      { condition: "Chemical Exposure", exposure: "occasional", risk: "moderate" },
    ],
    hazards: ["Needlestick injury", "Infectious disease", "Radiation", "Chemical exposure"],
    injuryRatePercentile: 35,
    baselineInjuryRate: 45,
  },
  "33-1012": { // Commercial Bus Operator
    socCode: "33-1012",
    jobTitle: "Commercial Bus Operator",
    physicalDemands: [
      { demand: "Sitting", level: "medium", frequency: "constantly" },
      { demand: "Reaching", level: "light", frequency: "frequently" },
      { demand: "Coordination", level: "medium", frequency: "constantly" },
    ],
    workEnvironment: [
      { condition: "Vibration Exposure", exposure: "constant", risk: "moderate" },
      { condition: "Noise Exposure", exposure: "constant", risk: "moderate" },
      { condition: "Traffic Hazards", exposure: "constant", risk: "high" },
      { condition: "Shift Work", exposure: "constant", risk: "moderate" },
    ],
    hazards: ["Motor vehicle accident", "Repetitive strain", "Fatigue-related errors", "Hearing loss"],
    injuryRatePercentile: 72,
    baselineInjuryRate: 185,
  },
  "47-2061": { // Heavy Equipment Operator
    socCode: "47-2061",
    jobTitle: "Heavy Equipment Operator",
    physicalDemands: [
      { demand: "Sitting", level: "medium", frequency: "constantly" },
      { demand: "Reaching", level: "medium", frequency: "frequently" },
      { demand: "Coordination", level: "heavy", frequency: "constantly" },
    ],
    workEnvironment: [
      { condition: "Vibration Exposure", exposure: "constant", risk: "high" },
      { condition: "Noise Exposure", exposure: "constant", risk: "high" },
      { condition: "Dust/Particulate", exposure: "frequent", risk: "moderate" },
      { condition: "Weather Exposure", exposure: "constant", risk: "moderate" },
    ],
    hazards: ["Crush injuries", "Rollover accidents", "Hearing loss", "Vibration white finger"],
    injuryRatePercentile: 85,
    baselineInjuryRate: 245,
  },
  "33-2011": { // Firefighter
    socCode: "33-2011",
    jobTitle: "Firefighter",
    physicalDemands: [
      { demand: "Lifting", level: "very-heavy", frequency: "frequently" },
      { demand: "Carrying", level: "very-heavy", frequency: "frequently" },
      { demand: "Climbing", level: "heavy", frequency: "frequently" },
      { demand: "Balance", level: "heavy", frequency: "frequently" },
    ],
    workEnvironment: [
      { condition: "Heat Exposure", exposure: "frequent", risk: "high" },
      { condition: "Smoke/Toxic Gases", exposure: "frequent", risk: "high" },
      { condition: "Extreme Temperatures", exposure: "frequent", risk: "high" },
      { condition: "Confined Spaces", exposure: "frequent", risk: "high" },
    ],
    hazards: ["Thermal burns", "Smoke inhalation", "Crush injuries", "Falls from height", "Cardiac events"],
    injuryRatePercentile: 92,
    baselineInjuryRate: 380,
  },
  "53-3032": { // Commercial Truck Driver
    socCode: "53-3032",
    jobTitle: "Commercial Truck Driver",
    physicalDemands: [
      { demand: "Sitting", level: "heavy", frequency: "constantly" },
      { demand: "Reaching", level: "light", frequency: "frequently" },
      { demand: "Lifting", level: "medium", frequency: "frequently" },
    ],
    workEnvironment: [
      { condition: "Vibration Exposure", exposure: "constant", risk: "high" },
      { condition: "Noise Exposure", exposure: "constant", risk: "moderate" },
      { condition: "Traffic Hazards", exposure: "constant", risk: "high" },
      { condition: "Fatigue", exposure: "constant", risk: "high" },
    ],
    hazards: ["Motor vehicle accident", "Repetitive strain injury", "Sleep apnea", "Hypertension"],
    injuryRatePercentile: 78,
    baselineInjuryRate: 210,
  },
  "29-1181": { // Surgeon
    socCode: "29-1181",
    jobTitle: "Surgeon",
    physicalDemands: [
      { demand: "Standing", level: "medium", frequency: "constantly" },
      { demand: "Fine Manipulation", level: "very-heavy", frequency: "constantly" },
      { demand: "Precision", level: "very-heavy", frequency: "constantly" },
    ],
    workEnvironment: [
      { condition: "Infectious Disease Exposure", exposure: "frequent", risk: "high" },
      { condition: "Bloodborne Pathogen Exposure", exposure: "frequent", risk: "high" },
      { condition: "Radiation Exposure", exposure: "occasional", risk: "moderate" },
      { condition: "Chemical Exposure", exposure: "occasional", risk: "moderate" },
    ],
    hazards: ["Needlestick injury", "Essential tremor impact", "Infectious disease", "Fatigue-related errors"],
    injuryRatePercentile: 28,
    baselineInjuryRate: 35,
  },
};

/**
 * Exposure Metrics Database
 * OSHA PEL and ACGIH TLV reference values
 */
export const exposureThresholds: Record<string, ExposureMetric> = {
  "silica-dust": {
    type: "chemical",
    name: "Crystalline Silica (Respirable)",
    level: 0,
    threshold: 0.025, // mg/m³ (OSHA PEL)
    duration: "8-hour TWA",
    frequency: "continuous",
    controls: ["HEPA respirator", "Dust suppression", "Wet drilling"],
  },
  "lead": {
    type: "chemical",
    name: "Lead",
    level: 0,
    threshold: 0.05, // mg/m³ (OSHA PEL)
    duration: "8-hour TWA",
    frequency: "continuous",
    controls: ["Respirator", "Protective clothing", "Hygiene practices"],
  },
  "noise": {
    type: "physical",
    name: "Noise",
    level: 0,
    threshold: 90, // dB (OSHA PEL)
    duration: "8-hour TWA",
    frequency: "continuous",
    controls: ["Hearing protection", "Engineering controls", "Administrative controls"],
  },
  "vibration": {
    type: "physical",
    name: "Hand-Arm Vibration",
    level: 0,
    threshold: 2.8, // m/s² (ACGIH TLV)
    duration: "8-hour TWA",
    frequency: "continuous",
    controls: ["Vibration-damping gloves", "Tool rotation", "Rest breaks"],
  },
  "heat": {
    type: "physical",
    name: "Heat Stress",
    level: 0,
    threshold: 32.2, // °C WBGT (ACGIH TLV)
    duration: "Continuous",
    frequency: "continuous",
    controls: ["Hydration", "Cooling stations", "Work rotation", "Acclimatization"],
  },
  "bloodborne-pathogen": {
    type: "biological",
    name: "Bloodborne Pathogen Exposure",
    level: 0,
    threshold: 0, // No safe threshold
    duration: "Per exposure event",
    frequency: "occasional",
    controls: ["Universal precautions", "PPE", "Vaccination", "Post-exposure prophylaxis"],
  },
  "ergonomic-strain": {
    type: "ergonomic",
    name: "Repetitive Strain / Ergonomic Hazard",
    level: 0,
    threshold: 0, // Job-specific
    duration: "Cumulative",
    frequency: "frequent",
    controls: ["Workstation ergonomics", "Job rotation", "Stretching programs", "Strength training"],
  },
  "psychosocial-stress": {
    type: "psychosocial",
    name: "Psychosocial Stress / Burnout",
    level: 0,
    threshold: 0, // Organization-specific
    duration: "Chronic",
    frequency: "constant",
    controls: ["Peer support", "Mental health resources", "Workload management", "Leadership training"],
  },
};

/**
 * Get O*NET profile for a job title
 */
export function getONETProfile(jobTitle: string): ONETJobProfile | null {
  const normalized = jobTitle.toLowerCase();
  
  // Simple matching logic (in production, use fuzzy matching or API)
  if (normalized.includes("bus") && normalized.includes("driver")) {
    return onetJobProfiles["33-1012"];
  }
  if (normalized.includes("truck") && normalized.includes("driver")) {
    return onetJobProfiles["53-3032"];
  }
  if (normalized.includes("heavy") && normalized.includes("equipment")) {
    return onetJobProfiles["47-2061"];
  }
  if (normalized.includes("firefighter")) {
    return onetJobProfiles["33-2011"];
  }
  if (normalized.includes("surgeon")) {
    return onetJobProfiles["29-1181"];
  }
  if (normalized.includes("physician") || normalized.includes("pa")) {
    return onetJobProfiles["29-1071"];
  }
  
  return null;
}

/**
 * Calculate occupational exposure risk based on job profile
 */
export function calculateOccupationalExposureRisk(jobTitle: string): number {
  const profile = getONETProfile(jobTitle);
  if (!profile) return 0.3; // Default moderate risk
  
  // Calculate risk based on injury rate percentile
  return Math.min(1, profile.injuryRatePercentile / 100);
}

/**
 * Get exposure recommendations based on job and medical conditions
 */
export function getExposureRecommendations(jobTitle: string, medicalConditions: string[]): string[] {
  const profile = getONETProfile(jobTitle);
  const recommendations: string[] = [];
  
  if (!profile) return recommendations;
  
  // Check for hazard-condition conflicts
  const conditionLower = medicalConditions.map(c => c.toLowerCase());
  
  profile.workEnvironment.forEach(env => {
    if (env.risk === "high") {
      if (conditionLower.some(c => c.includes("asthma")) && env.condition.includes("Dust")) {
        recommendations.push(`CRITICAL: Asthma + Dust exposure - Respiratory protection mandatory`);
      }
      if (conditionLower.some(c => c.includes("heart")) && env.condition.includes("Heat")) {
        recommendations.push(`CRITICAL: Cardiac condition + Heat exposure - Medical monitoring required`);
      }
      if (conditionLower.some(c => c.includes("seizure")) && env.condition.includes("Traffic")) {
        recommendations.push(`CRITICAL: Seizure disorder + Vehicle operation - Fitness for duty evaluation required`);
      }
    }
  });
  
  return recommendations;
}

/**
 * Generate exposure profile for report
 */
export function generateExposureProfile(jobTitle: string): string {
  const profile = getONETProfile(jobTitle);
  if (!profile) return "Job profile not found in O*NET database";
  
  const hazardList = profile.hazards.join(", ");
  const injuryContext = profile.injuryRatePercentile > 75 
    ? "HIGH-RISK occupation" 
    : profile.injuryRatePercentile > 50 
    ? "MODERATE-RISK occupation" 
    : "LOW-RISK occupation";
  
  return `${profile.jobTitle} is a ${injuryContext} with baseline injury rate of ${profile.baselineInjuryRate} per 100,000 workers. Primary hazards: ${hazardList}.`;
}
