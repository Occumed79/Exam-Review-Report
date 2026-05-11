import { SMECase, MedicalCondition, JobDuties } from './types';

export interface RiskScoreResult {
  supportPlanningNeed: number;
  documentationConcern: number;
  treatmentContinuityConcern: number;
  followUpFeasibilityConcern: number;
  modifiers: string[];
}

export function calculateWeightedRisk(caseData: SMECase): RiskScoreResult {
  let scores = {
    supportPlanningNeed: 0,
    documentationConcern: 0,
    treatmentContinuityConcern: 0,
    followUpFeasibilityConcern: 0,
  };
  
  const modifiers: string[] = [];

  // 1. Job-Duty Modifiers
  const jd = caseData.jobDuties.safetySensitiveFlags;
  if (jd.driving) { scores.supportPlanningNeed += 2; modifiers.push("Job: Driving"); }
  if (jd.aviation) { scores.supportPlanningNeed += 3; modifiers.push("Job: Aviation"); }
  if (jd.emergencyResponse) { scores.supportPlanningNeed += 2; modifiers.push("Job: Emergency Response"); }
  if (jd.workingAlone) { scores.supportPlanningNeed += 1; modifiers.push("Job: Working Alone"); }

  // 2. Condition Modifiers
  caseData.medicalConditions.forEach(mc => {
    if (mc.hospitalizations > 0) { scores.documentationConcern += 2; modifiers.push(`Condition: ${mc.conditionName} (Prior Hospitalization)`); }
    if (mc.erVisits > 0) { scores.documentationConcern += 1; modifiers.push(`Condition: ${mc.conditionName} (Prior ER Visit)`); }
    if (mc.incapacitationRisk === 'Possible' || mc.incapacitationRisk === 'High') {
      scores.supportPlanningNeed += 3;
      modifiers.push(`Condition: ${mc.conditionName} (Incapacitation Risk)`);
    }
    
    // 3. Medication Modifiers
    const tc = mc.treatmentContinuity;
    if (tc.sedatingMedication) { scores.supportPlanningNeed += 2; modifiers.push(`Med: ${mc.conditionName} (Sedating)`); }
    if (tc.powerRequirement) { scores.treatmentContinuityConcern += 3; modifiers.push(`Med: ${mc.conditionName} (Power Required)`); }
    if (mc.refrigerationNeeded) { scores.treatmentContinuityConcern += 3; modifiers.push(`Med: ${mc.conditionName} (Refrigeration Required)`); }
  });

  // 4. Deployment Modifiers
  if (caseData.deploymentCountry && caseData.deploymentCountry !== 'USA') {
    scores.followUpFeasibilityConcern += 2;
    modifiers.push("Deployment: International");
  }

  return {
    supportPlanningNeed: Math.min(scores.supportPlanningNeed, 10),
    documentationConcern: Math.min(scores.documentationConcern, 10),
    treatmentContinuityConcern: Math.min(scores.treatmentContinuityConcern, 10),
    followUpFeasibilityConcern: Math.min(scores.followUpFeasibilityConcern, 10),
    modifiers
  };
}
