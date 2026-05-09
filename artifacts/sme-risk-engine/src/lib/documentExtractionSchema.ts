export interface DocumentExtractionSchema {
  demographics: {
    examineeName: string;
    dob: string;
    jobTitle: string;
    employer: string;
    caseId: string;
  };
  medicalConditions: {
    condition: string;
    status: string;
    riskLevel: string;
    notes: string;
  }[];
  injuries: {
    injuryType: string;
    dateOfInjury: string;
    treatmentReceived: string;
    residualPain: number;
    workRestrictions: string;
  }[];
  jobDuties: {
    physicalDemands: string[];
    cognitiveDemands: string[];
    environmentalDemands: string[];
    essentialFunctions: string;
  };
  documentationGaps: {
    description: string;
    category: string;
    severity: "high" | "moderate" | "low";
    relatedCondition: string;
  }[];
  rawText: string;
  pageReferences: {
    section: string;
    pageNumber: number;
  }[];
}
