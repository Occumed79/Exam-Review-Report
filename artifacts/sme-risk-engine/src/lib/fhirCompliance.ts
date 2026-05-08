/**
 * FHIR Compliance and Healthcare Data Standards Module
 * Implements HL7 FHIR Occupational Data for Health (ODH) profiles
 * Supports SNOMED CT, LOINC, RxNorm, and ICD-10 coding
 */

export interface FHIRPatient {
  resourceType: "Patient";
  id: string;
  identifier: Array<{ system: string; value: string }>;
  name: Array<{ given: string[]; family: string }>;
  birthDate: string;
  gender: "male" | "female" | "other" | "unknown";
  address?: Array<{ city: string; state: string; country: string }>;
}

export interface FHIRCondition {
  resourceType: "Condition";
  id: string;
  clinicalStatus: "active" | "recurrence" | "relapse" | "inactive" | "remission" | "resolved";
  verificationStatus: "unconfirmed" | "provisional" | "differential" | "confirmed" | "refuted" | "entered-in-error";
  code: {
    coding: Array<{ system: string; code: string; display: string }>;
    text: string;
  };
  subject: { reference: string };
  onsetDateTime?: string;
  recordedDate: string;
  severity?: { coding: Array<{ system: string; code: string; display: string }> };
}

export interface FHIROccupationalDataForHealth {
  resourceType: "Observation";
  id: string;
  category: Array<{ coding: Array<{ system: string; code: string }> }>;
  code: {
    coding: Array<{ system: string; code: string; display: string }>;
    text: string;
  };
  subject: { reference: string };
  effectiveDateTime: string;
  valueCodeableConcept?: {
    coding: Array<{ system: string; code: string; display: string }>;
    text: string;
  };
  component?: Array<{
    code: { coding: Array<{ system: string; code: string; display: string }> };
    valueString?: string;
    valueCodeableConcept?: { coding: Array<{ system: string; code: string; display: string }> };
  }>;
}

export interface FHIRMedication {
  resourceType: "Medication";
  id: string;
  code: {
    coding: Array<{ system: string; code: string; display: string }>;
    text: string;
  };
}

export interface FHIRMedicationRequest {
  resourceType: "MedicationRequest";
  id: string;
  status: "active" | "on-hold" | "cancelled" | "completed" | "entered-in-error" | "draft" | "unknown";
  intent: "proposal" | "plan" | "order" | "original-order" | "reflex-order" | "filler-order" | "instance-order" | "option";
  medicationReference: { reference: string };
  subject: { reference: string };
  authoredOn: string;
  dosageInstruction?: Array<{
    text: string;
    timing?: { repeat: { frequency: number; period: number; periodUnit: string } };
    route?: { coding: Array<{ system: string; code: string; display: string }> };
    doseAndRate?: Array<{ doseQuantity?: { value: number; unit: string } }>;
  }>;
}

export interface SNOMEDCTCode {
  conceptId: string;
  term: string;
  fsn: string; // Fully Specified Name
  preferredTerm: string;
}

export interface LOINCCode {
  loincNum: string;
  component: string;
  property: string;
  timeAspect: string;
  system: string;
  scale: string;
  method: string;
  shortName: string;
}

/**
 * SNOMED CT Code Mappings for Occupational Health
 */
export const snomedCTCodes: Record<string, SNOMEDCTCode> = {
  "asthma": {
    conceptId: "195967001",
    term: "Asthma",
    fsn: "Asthma (disorder)",
    preferredTerm: "Asthma",
  },
  "diabetes": {
    conceptId: "73211009",
    term: "Diabetes mellitus",
    fsn: "Diabetes mellitus (disorder)",
    preferredTerm: "Diabetes mellitus",
  },
  "hypertension": {
    conceptId: "38341003",
    term: "Hypertension",
    fsn: "Essential hypertension (disorder)",
    preferredTerm: "Essential hypertension",
  },
  "seizure": {
    conceptId: "246545002",
    term: "Seizure",
    fsn: "Seizure (finding)",
    preferredTerm: "Seizure",
  },
  "chronic-low-back-pain": {
    conceptId: "82423001",
    term: "Chronic pain",
    fsn: "Chronic pain (finding)",
    preferredTerm: "Chronic pain",
  },
  "occupational-injury": {
    conceptId: "417746004",
    term: "Traumatic injury",
    fsn: "Traumatic injury (disorder)",
    preferredTerm: "Traumatic injury",
  },
};

/**
 * LOINC Code Mappings for Occupational Health Tests
 */
export const loincCodes: Record<string, LOINCCode> = {
  "fev1": {
    loincNum: "19868-9",
    component: "FEV1",
    property: "VFr",
    timeAspect: "Pt",
    system: "Respiratory system",
    scale: "Qn",
    method: "Spirometry",
    shortName: "FEV1",
  },
  "fvc": {
    loincNum: "19870-5",
    component: "FVC",
    property: "VFr",
    timeAspect: "Pt",
    system: "Respiratory system",
    scale: "Qn",
    method: "Spirometry",
    shortName: "FVC",
  },
  "blood-pressure": {
    loincNum: "85354-9",
    component: "Blood pressure",
    property: "Pres",
    timeAspect: "Pt",
    system: "Cardiovascular system",
    scale: "Qn",
    method: "Noninvasive",
    shortName: "BP",
  },
  "hba1c": {
    loincNum: "4548-4",
    component: "Hemoglobin A1c",
    property: "MFr",
    timeAspect: "Pt",
    system: "Blood",
    scale: "Qn",
    method: "Chromatography",
    shortName: "HbA1c",
  },
  "audiometry": {
    loincNum: "71952-9",
    component: "Hearing test",
    property: "Hearing",
    timeAspect: "Pt",
    system: "Auditory system",
    scale: "Qn",
    method: "Audiometry",
    shortName: "Audiogram",
  },
};

/**
 * ICD-10 Code Mappings for Occupational Conditions
 */
export const icd10Codes: Record<string, string> = {
  "asthma-occupational": "J45.9",
  "silicosis": "J62.8",
  "asbestosis": "J61",
  "noise-induced-hearing-loss": "H83.3",
  "vibration-white-finger": "I73.01",
  "carpal-tunnel-syndrome": "G56.01",
  "occupational-dermatitis": "L25.9",
  "work-related-stress": "F43.1",
  "work-related-injury": "V00-Y99",
};

/**
 * RxNorm Code Mappings for Common Medications
 */
export const rxNormCodes: Record<string, string> = {
  "albuterol": "RXN0000001",
  "metformin": "RXN0000002",
  "lisinopril": "RXN0000003",
  "atorvastatin": "RXN0000004",
  "omeprazole": "RXN0000005",
  "ibuprofen": "RXN0000006",
  "acetaminophen": "RXN0000007",
  "sertraline": "RXN0000008",
};

/**
 * O*NET / SOC Code Mappings
 */
export const socCodes: Record<string, string> = {
  "physician-assistant": "29-1071",
  "commercial-bus-driver": "33-1012",
  "heavy-equipment-operator": "47-2061",
  "firefighter": "33-2011",
  "commercial-truck-driver": "53-3032",
  "surgeon": "29-1181",
};

/**
 * Validate FHIR Condition Resource
 */
export function validateFHIRCondition(condition: FHIRCondition): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!condition.resourceType || condition.resourceType !== "Condition") {
    errors.push("Invalid resourceType: must be 'Condition'");
  }
  if (!condition.id) {
    errors.push("Missing required field: id");
  }
  if (!condition.code || !condition.code.coding || condition.code.coding.length === 0) {
    errors.push("Missing required field: code.coding");
  }
  if (!condition.subject || !condition.subject.reference) {
    errors.push("Missing required field: subject.reference");
  }
  if (!condition.recordedDate) {
    errors.push("Missing required field: recordedDate");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert SMECase to FHIR ODH Observation
 */
export function convertToFHIRODH(caseData: any): FHIROccupationalDataForHealth {
  return {
    resourceType: "Observation",
    id: `occ-data-${caseData.caseId}`,
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "social-history",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "11341-5",
          display: "Occupational data",
        },
      ],
      text: "Occupational Data for Health",
    },
    subject: { reference: `Patient/${caseData.caseId}` },
    effectiveDateTime: new Date().toISOString(),
    component: [
      {
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "11342-3",
              display: "Occupation",
            },
          ],
        },
        valueCodeableConcept: {
          coding: [
            {
              system: "http://www.onetonline.org",
              code: socCodes[caseData.jobTitle.toLowerCase().replace(/\s+/g, "-")] || "unknown",
              display: caseData.jobTitle,
            },
          ],
          text: caseData.jobTitle,
        },
      },
      {
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "11294-4",
              display: "Employer name",
            },
          ],
        },
        valueString: caseData.employer || "Unknown",
      },
      {
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "21844-6",
              display: "History of occupational hazard exposure",
            },
          ],
        },
        valueString: caseData.occupationalData?.hazardExposures?.join("; ") || "None documented",
      },
    ],
  };
}

/**
 * Get SNOMED CT code for condition
 */
export function getSNOMEDCTCode(conditionName: string): SNOMEDCTCode | null {
  const normalized = conditionName.toLowerCase().replace(/\s+/g, "-");
  return snomedCTCodes[normalized] || null;
}

/**
 * Get LOINC code for test
 */
export function getLOINCCode(testName: string): LOINCCode | null {
  const normalized = testName.toLowerCase().replace(/\s+/g, "-");
  return loincCodes[normalized] || null;
}

/**
 * Get ICD-10 code for condition
 */
export function getICD10Code(conditionName: string): string | null {
  const normalized = conditionName.toLowerCase().replace(/\s+/g, "-");
  return icd10Codes[normalized] || null;
}

/**
 * Generate FHIR-compliant report metadata
 */
export function generateFHIRMetadata(caseData: any): Record<string, any> {
  return {
    resourceType: "Bundle",
    type: "document",
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: "Composition",
          id: `composition-${caseData.caseId}`,
          status: "final",
          type: {
            coding: [
              {
                system: "http://loinc.org",
                code: "34133-9",
                display: "Summary of episode note",
              },
            ],
          },
          subject: { reference: `Patient/${caseData.caseId}` },
          date: new Date().toISOString(),
          author: [
            {
              reference: `Practitioner/${caseData.reviewingSME}`,
            },
          ],
          title: "Occupational Health Risk Assessment",
          section: [
            {
              title: "Medical History",
              code: {
                coding: [
                  {
                    system: "http://loinc.org",
                    code: "11348-0",
                    display: "History of past illness",
                  },
                ],
              },
            },
            {
              title: "Occupational Data",
              code: {
                coding: [
                  {
                    system: "http://loinc.org",
                    code: "11341-5",
                    display: "Occupational data",
                  },
                ],
              },
            },
            {
              title: "Risk Assessment",
              code: {
                coding: [
                  {
                    system: "http://loinc.org",
                    code: "51846-4",
                    display: "Assessment",
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };
}
