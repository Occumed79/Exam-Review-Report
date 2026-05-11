import { useState, useMemo } from "react";
import { Search, BookOpen, ExternalLink, ChevronDown, ChevronRight, Tag, Filter } from "lucide-react";

interface Citation {
  id: string;
  authors: string;
  title: string;
  journal: string;
  year: number;
  doi?: string;
  url?: string;
  category: string;
  tags: string[];
  relevance: string;
  usedIn: string[];
}

const CATEGORIES = [
  "All",
  "Cardiovascular",
  "Occupational Medicine",
  "Case Studies",
  "Data Standards",
  "Compliance & Governance",
  "Pharmacology",
  "Infectious Disease",
  "Renal / Metabolic",
  "Environmental / Toxicology",
  "Neurology / Psychiatry",
  "Fitness for Duty Standards",
  "Clinical Risk Calculators",
  "Global Health / AOR",
  "Workplace Safety Updates",
];

type SafetyUpdate = {
  id: string;
  jurisdiction: "Federal" | "State" | "Local";
  title: string;
  summary: string;
  status: string;
  updated: string;
  tags: string[];
  source?: string;
};

const SAFETY_UPDATES: SafetyUpdate[] = [
  {
    id: "fed-osha-heat",
    jurisdiction: "Federal",
    title: "OSHA Heat Injury and Illness Prevention Rule",
    summary: "Federal rulemaking and enforcement focus on heat exposure controls, acclimatization, water, rest, and shade for outdoor and indoor workers.",
    status: "Active federal rulemaking / enforcement priority",
    updated: "2025",
    tags: ["heat", "PPE", "acclimatization"],
    source: "https://www.osha.gov/heat-exposure",
  },
  {
    id: "fed-nih-worksite",
    jurisdiction: "Federal",
    title: "NIOSH Worksite Safety Guidance",
    summary: "Continued federal guidance on ergonomics, respirator tolerance, fatigue, and hazard communication for safety-sensitive workplaces.",
    status: "Published guidance",
    updated: "2025",
    tags: ["ergonomics", "respiratory", "fatigue"],
    source: "https://www.cdc.gov/niosh/",
  },
  {
    id: "state-ca-heat",
    jurisdiction: "State",
    title: "California Cal/OSHA Heat Illness Prevention",
    summary: "State standards continue to require water, shade, training, and written prevention procedures for heat-exposed workers.",
    status: "State standard in force",
    updated: "2025",
    tags: ["Cal/OSHA", "heat", "field work"],
    source: "https://www.dir.ca.gov/dosh/heatillnessinfo.html",
  },
  {
    id: "state-ny-violence",
    jurisdiction: "State",
    title: "New York Workplace Violence Prevention",
    summary: "New York employers remain subject to workplace violence prevention program requirements in covered settings.",
    status: "State compliance requirement",
    updated: "2025",
    tags: ["violence", "training", "policy"],
    source: "https://dol.ny.gov/workplace-violence-prevention-programs",
  },
  {
    id: "local-city-ems-heat",
    jurisdiction: "Local",
    title: "Municipal EMS / Fire Heat Response Protocols",
    summary: "Local agencies are updating hydration, work-rest, and medic standby protocols for responders in extreme heat events.",
    status: "Local policy update",
    updated: "2025",
    tags: ["EMS", "fire", "operations"],
  },
  {
    id: "local-port-dust",
    jurisdiction: "Local",
    title: "Port / Industrial Dust Exposure Controls",
    summary: "Local industrial districts are tightening dust monitoring, mask guidance, and respiratory symptom reporting after recurring air quality events.",
    status: "Local advisory",
    updated: "2025",
    tags: ["dust", "air quality", "respiratory"],
  },
];

const CITATIONS: Citation[] = [
  // ── Cardiovascular ──────────────────────────────────────────────────────────
  {
    id: "goff2014",
    authors: "Goff DC Jr, Lloyd-Jones DM, Bennett G, et al.",
    title: "2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk: A Report of the American College of Cardiology/American Heart Association Task Force on Practice Guidelines",
    journal: "Circulation",
    year: 2014,
    doi: "10.1161/01.cir.0000437741.48606.98",
    url: "https://doi.org/10.1161/01.cir.0000437741.48606.98",
    category: "Cardiovascular",
    tags: ["ASCVD", "Pooled Cohort Equations", "risk stratification"],
    relevance: "Basis for the ACC/AHA Pooled Cohort Equations used in the ASCVD calculator. Defines 10-year atherosclerotic cardiovascular disease risk thresholds.",
    usedIn: ["Clinical Calculator (ASCVD)", "ClearanceMatrix cardiovascular risk"],
  },
  {
    id: "wilson1998",
    authors: "Wilson PWF, D'Agostino RB, Levy D, Belanger AM, Silbershatz H, Kannel WB.",
    title: "Prediction of Coronary Heart Disease Using Risk Factor Categories",
    journal: "Circulation",
    year: 1998,
    doi: "10.1161/01.CIR.97.18.1837",
    url: "https://doi.org/10.1161/01.CIR.97.18.1837",
    category: "Cardiovascular",
    tags: ["Framingham", "CHD risk", "point score"],
    relevance: "Original Framingham Heart Study point-score method for 10-year coronary heart disease risk estimation.",
    usedIn: ["Clinical Calculator (Framingham)"],
  },
  {
    id: "arnett2019",
    authors: "Arnett DK, Blumenthal RS, Albert MA, et al.",
    title: "2019 ACC/AHA Guideline on the Primary Prevention of Cardiovascular Disease",
    journal: "Circulation",
    year: 2019,
    doi: "10.1161/CIR.0000000000000678",
    url: "https://doi.org/10.1161/CIR.0000000000000678",
    category: "Cardiovascular",
    tags: ["primary prevention", "statin", "risk enhancers"],
    relevance: "Defines cardiovascular risk-enhancing factors and statin therapy thresholds. Applies to fitness-for-duty cardiovascular clearance.",
    usedIn: ["ClearanceMatrix", "Case Hub — Risk Scores"],
  },
  {
    id: "thygesen2018",
    authors: "Thygesen K, Alpert JS, Jaffe AS, et al.",
    title: "Fourth Universal Definition of Myocardial Infarction",
    journal: "Journal of the American College of Cardiology",
    year: 2018,
    doi: "10.1016/j.jacc.2018.08.1038",
    url: "https://doi.org/10.1016/j.jacc.2018.08.1038",
    category: "Cardiovascular",
    tags: ["MI", "troponin", "STEMI", "NSTEMI"],
    relevance: "Defines myocardial infarction criteria. Relevant for return-to-work and fitness-for-duty determinations post-MI.",
    usedIn: ["Case Hub — Medical Conditions", "ClearanceMatrix"],
  },
  // ── Occupational Medicine ──────────────────────────────────────────────────
  {
    id: "niosh2021",
    authors: "National Institute for Occupational Safety and Health (NIOSH).",
    title: "Criteria for a Recommended Standard: Occupational Exposure to Heat and Hot Environments",
    journal: "DHHS (NIOSH) Publication",
    year: 2021,
    url: "https://www.cdc.gov/niosh/docs/2016-106/",
    category: "Occupational Medicine",
    tags: ["heat illness", "WBGT", "work-rest ratios", "acclimatization"],
    relevance: "Defines occupational heat exposure limits, WBGT thresholds, acclimatization requirements. Applied to AOR risk assessment for heat-exposed personnel.",
    usedIn: ["AOR Intelligence Monitor", "Drug Checker (heat risk flags)"],
  },
  {
    id: "nfpa1582",
    authors: "National Fire Protection Association.",
    title: "NFPA 1582: Standard on Comprehensive Occupational Medical Program for Fire Departments",
    journal: "NFPA Standard",
    year: 2022,
    url: "https://www.nfpa.org/codes-and-standards/1/5/8/2",
    category: "Fitness for Duty Standards",
    tags: ["firefighter", "Category A", "Category B", "medical clearance"],
    relevance: "Defines Category A and B medical conditions for firefighter fitness. Used in ClearanceMatrix for firefighter job type determinations.",
    usedIn: ["ClearanceMatrix — Firefighter column"],
  },
  {
    id: "dotfmcsa2015",
    authors: "Federal Motor Carrier Safety Administration (FMCSA).",
    title: "Medical Examiner Handbook: Physical Qualification Standards for CMV Operators",
    journal: "FMCSA Technical Advisory Criteria",
    year: 2015,
    url: "https://www.fmcsa.dot.gov/regulations/medical/medical-examiner-handbook",
    category: "Fitness for Duty Standards",
    tags: ["DOT", "CDL", "commercial driver", "FMCSA"],
    relevance: "Physical qualification standards for commercial motor vehicle drivers. Covers cardiovascular, diabetes, seizure, and vision criteria.",
    usedIn: ["ClearanceMatrix — DOT/CDL column"],
  },
  {
    id: "faaamephysical2023",
    authors: "Federal Aviation Administration — Aerospace Medical Certification Division.",
    title: "Guide for Aviation Medical Examiners",
    journal: "FAA Publication",
    year: 2023,
    url: "https://www.faa.gov/licenses_certificates/medical_certification/medicalproviders/ame_guide",
    category: "Fitness for Duty Standards",
    tags: ["aviation", "AME", "First Class", "Second Class", "Third Class"],
    relevance: "Defines medical standards for aviation first/second/third class certificates. Applied in ClearanceMatrix aviation column.",
    usedIn: ["ClearanceMatrix — Aviation column"],
  },
  {
    id: "acoem2019",
    authors: "American College of Occupational and Environmental Medicine (ACOEM).",
    title: "Occupational Medical Examinations: Principles, Practice, and Evidence — ACOEM Position Statement",
    journal: "Journal of Occupational and Environmental Medicine",
    year: 2019,
    url: "https://acoem.org/",
    category: "Occupational Medicine",
    tags: ["fitness for duty", "return to work", "SME role"],
    relevance: "Foundational document defining the role of occupational medicine physicians and SME reviewers in fitness determination.",
    usedIn: ["Dashboard", "Case Hub"],
  },
  // ── Data Standards ─────────────────────────────────────────────────────────
  {
    id: "hl7-odh",
    authors: "HL7 International",
    title: "HL7 FHIR Occupational Data for Health Implementation Guide",
    journal: "HL7 FHIR IG",
    year: 2024,
    url: "http://build.fhir.org/ig/HL7/us-odh/",
    category: "Data Standards",
    tags: ["FHIR", "ODH", "occupation", "employer"],
    relevance: "Defines the occupational data model for work history, employer, job duties, and work classification.",
    usedIn: ["Case Intake", "Job Duties", "Data Integration"],
  },
  {
    id: "snomed-loinc-rxnorm",
    authors: "HL7 / SNOMED International / Regenstrief / NIH",
    title: "Clinical Terminologies for Occupational Health Interoperability",
    journal: "Standards Overview",
    year: 2024,
    category: "Data Standards",
    tags: ["SNOMED CT", "LOINC", "RxNorm", "ICD-10"],
    relevance: "Terminology set for diagnoses, lab tests, medications, and coded occupational data exchange.",
    usedIn: ["Case Intake", "Clinical Calculator", "Report Builder"],
  },
  {
    id: "onet-soc",
    authors: "U.S. Department of Labor / U.S. Census Bureau",
    title: "O*NET and SOC Occupational Classification References",
    journal: "Labor Data Standard",
    year: 2024,
    category: "Data Standards",
    tags: ["O*NET", "SOC", "job title", "job descriptors"],
    relevance: "Standard occupational descriptors for mapping job titles, physical demands, and safety-sensitive roles.",
    usedIn: ["Case Intake", "Essential Functions", "Occupational Data"],
  },
  // ── Compliance & Governance ────────────────────────────────────────────────
  {
    id: "hipaa-hhs",
    authors: "U.S. Department of Health and Human Services",
    title: "HIPAA De-identification Guidance",
    journal: "HHS Guidance",
    year: 2024,
    url: "https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html",
    category: "Compliance & Governance",
    tags: ["HIPAA", "de-identification", "privacy", "PHI"],
    relevance: "Defines Safe Harbor and expert determination approaches for PHI de-identification.",
    usedIn: ["Settings", "Data Governance", "Model Training"],
  },
  {
    id: "bls-injury-data",
    authors: "U.S. Bureau of Labor Statistics",
    title: "Occupational Injury and Illness Statistics",
    journal: "BLS Data",
    year: 2025,
    url: "https://www.bls.gov/iif/",
    category: "Compliance & Governance",
    tags: ["injury statistics", "industry", "occupation", "surveillance"],
    relevance: "Primary national injury and illness data source for risk benchmarking and reporting.",
    usedIn: ["Dashboard", "Occupational Data", "Case Studies"],
  },
  {
    id: "osha-niosh-guidance",
    authors: "OSHA / NIOSH / CDC",
    title: "Occupational Health Guidance and Surveillance Resources",
    journal: "Government Guidance",
    year: 2025,
    url: "https://www.cdc.gov/niosh/",
    category: "Compliance & Governance",
    tags: ["OSHA", "NIOSH", "CDC", "surveillance"],
    relevance: "Primary reference family for guidance, surveillance, and exposure thresholds.",
    usedIn: ["Settings", "Guidelines", "Sources"],
  },
  // ── Case Studies ───────────────────────────────────────────────────────────
  {
    id: "case-heat-exposure-firefighters",
    authors: "SME Risk Intelligence Engine",
    title: "Firefighter Heat Exposure, Hydration Failure, and Return-to-Duty Review",
    journal: "Occupational Health Case Study",
    year: 2025,
    category: "Case Studies",
    tags: ["heat", "firefighter", "hydration", "return to duty"],
    relevance: "Shows how heat exposure, medications, and physical job demands can combine into a duty-limiting occupational risk.",
    usedIn: ["Case Hub", "Job Duties", "Risk Scoring"],
  },
  {
    id: "case-driver-diabetes-syncope",
    authors: "SME Risk Intelligence Engine",
    title: "Commercial Driver With Diabetes, Hypoglycemia, and Sudden Incapacitation Concern",
    journal: "Occupational Health Case Study",
    year: 2025,
    category: "Case Studies",
    tags: ["driver", "diabetes", "hypoglycemia", "DOT"],
    relevance: "Illustrates how glycemic instability and medication effects can affect safety-sensitive driving clearance.",
    usedIn: ["ClearanceMatrix", "Case Hub", "Clinical Calculator"],
  },
  {
    id: "case-deployment-asthma-dust",
    authors: "SME Risk Intelligence Engine",
    title: "Deployment Worker With Asthma, Dust Exposure, and Limited Medical Access",
    journal: "Occupational Health Case Study",
    year: 2025,
    category: "Case Studies",
    tags: ["deployment", "asthma", "dust", "remote care"],
    relevance: "Demonstrates how remote deployment, respiratory disease, and poor access to care intersect in occupational review.",
    usedIn: ["AOR Intelligence Monitor", "Country Risk", "Case Hub"],
  },
  {
    id: "case-law-enforcement-spine",
    authors: "SME Risk Intelligence Engine",
    title: "Law Enforcement Officer With Lumbar Injury and Essential Function Limits",
    journal: "Occupational Health Case Study",
    year: 2025,
    category: "Case Studies",
    tags: ["law enforcement", "lumbar injury", "lifting", "essential functions"],
    relevance: "Shows how injury history maps to lifting, restraint, pursuit, and safety-sensitive role demands.",
    usedIn: ["Injury History", "Essential Functions", "Risk Scoring"],
  },
  // ── Pharmacology ──────────────────────────────────────────────────────────
  {
    id: "micromedex2024",
    authors: "IBM Micromedex / Merative.",
    title: "Micromedex Drug Interactions & Drug Information",
    journal: "Merative Micromedex Database",
    year: 2024,
    url: "https://www.micromedexsolutions.com/",
    category: "Pharmacology",
    tags: ["drug interactions", "contraindications", "clinical pharmacology"],
    relevance: "Reference standard for drug-drug interaction severity classification. Basis for Drug Checker interaction data.",
    usedIn: ["Drug Checker — Interaction data"],
  },
  {
    id: "lexicomp2024",
    authors: "Wolters Kluwer Clinical Drug Information.",
    title: "Lexicomp Drug Interactions",
    journal: "Lexicomp Online Database",
    year: 2024,
    url: "https://online.lexi.com/",
    category: "Pharmacology",
    tags: ["drug interactions", "QTc", "CYP450"],
    relevance: "Supplementary drug interaction reference. Used for QTc prolongation and CYP450 interaction data.",
    usedIn: ["Drug Checker — QTc / CARD flags"],
  },
  {
    id: "crediblemeds2024",
    authors: "Arizona CERT / CredibleMeds.",
    title: "QTDrugs List — Drug Safety Classification System for QT Risk",
    journal: "CredibleMeds Database",
    year: 2024,
    url: "https://crediblemeds.org/",
    category: "Pharmacology",
    tags: ["QTc", "torsades de pointes", "cardiac arrhythmia"],
    relevance: "Classifies drugs by QTc prolongation risk. Used for CARD flags in Drug Checker for drugs like mefloquine and azithromycin.",
    usedIn: ["Drug Checker — Cardiac/QT risk (CARD)"],
  },
  {
    id: "pham2014",
    authors: "Pham AQ, Tran H, Amaya M, et al.",
    title: "Beta-Blockers and Heat-Related Illness in Exercising Patients",
    journal: "Southern Medical Journal",
    year: 2014,
    doi: "10.14423/SMJ.0000000000000055",
    category: "Pharmacology",
    tags: ["beta-blocker", "heat illness", "exercise", "occupational"],
    relevance: "Documents impaired thermoregulation in beta-blocker users during physical exertion. Used for HEAT flag on metoprolol.",
    usedIn: ["Drug Checker — HEAT flag (metoprolol)"],
  },
  {
    id: "cdc_yellowbook_2024",
    authors: "Centers for Disease Control and Prevention.",
    title: "CDC Yellow Book 2024: Health Information for International Travel",
    journal: "CDC Yellow Book",
    year: 2024,
    url: "https://wwwnc.cdc.gov/travel/page/yellowbook-home",
    category: "Infectious Disease",
    tags: ["travel medicine", "prophylaxis", "antimalarial", "vaccines"],
    relevance: "Authoritative reference for international travel health requirements, antimalarial selection, and vaccine requirements. Basis for AOR event drug risk information.",
    usedIn: ["Drug Checker — AOR Risks", "AOR Intelligence Monitor"],
  },
  // ── Renal / Metabolic ──────────────────────────────────────────────────────
  {
    id: "inker2021",
    authors: "Inker LA, Eneanya ND, Coresh J, et al.",
    title: "New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race",
    journal: "New England Journal of Medicine",
    year: 2021,
    doi: "10.1056/NEJMoa2102953",
    url: "https://doi.org/10.1056/NEJMoa2102953",
    category: "Renal / Metabolic",
    tags: ["eGFR", "CKD-EPI 2021", "creatinine", "kidney function"],
    relevance: "2021 CKD-EPI equation (race-free) for eGFR estimation. Used in the eGFR Clinical Calculator.",
    usedIn: ["Clinical Calculator (eGFR)"],
  },
  {
    id: "kdigo2022",
    authors: "KDIGO CKD Work Group.",
    title: "KDIGO 2022 Clinical Practice Guideline for Evaluation and Management of Chronic Kidney Disease",
    journal: "Kidney International",
    year: 2022,
    doi: "10.1016/j.kint.2022.01.010",
    url: "https://doi.org/10.1016/j.kint.2022.01.010",
    category: "Renal / Metabolic",
    tags: ["CKD staging", "G1-G5", "proteinuria", "renal deployment"],
    relevance: "Defines CKD staging G1-G5. Used to interpret eGFR results and flag renal concerns for deployment.",
    usedIn: ["Clinical Calculator (eGFR — stage interpretation)", "Case Hub"],
  },
  {
    id: "who_bmi2000",
    authors: "World Health Organization.",
    title: "Obesity: Preventing and Managing the Global Epidemic. Report of a WHO Consultation",
    journal: "WHO Technical Report Series 894",
    year: 2000,
    url: "https://www.who.int/publications/i/item/9241208945",
    category: "Renal / Metabolic",
    tags: ["BMI", "obesity classification", "underweight", "overweight"],
    relevance: "WHO standard BMI classification thresholds. Used in BMI Clinical Calculator interpretation.",
    usedIn: ["Clinical Calculator (BMI)"],
  },
  {
    id: "ada2024",
    authors: "American Diabetes Association.",
    title: "Standards of Care in Diabetes — 2024",
    journal: "Diabetes Care",
    year: 2024,
    doi: "10.2337/dc24-SINT",
    url: "https://doi.org/10.2337/dc24-SINT",
    category: "Renal / Metabolic",
    tags: ["diabetes", "A1C", "glucose targets", "fitness for duty"],
    relevance: "Defines diabetes management standards. Relevant for occupational evaluation of employees with T2DM and deployment considerations.",
    usedIn: ["Case Hub — Endocrine conditions", "Drug Checker (metformin, insulin)"],
  },
  // ── Fitness Standards ───────────────────────────────────────────────────────
  {
    id: "acsm2022",
    authors: "American College of Sports Medicine.",
    title: "ACSM's Guidelines for Exercise Testing and Prescription, 11th Edition",
    journal: "Lippincott Williams & Wilkins",
    year: 2022,
    category: "Fitness for Duty Standards",
    tags: ["METs", "VO2max", "exercise testing", "functional capacity"],
    relevance: "Defines MET values for activity levels and exercise testing methodology. Used in METs Clinical Calculator.",
    usedIn: ["Clinical Calculator (METs)"],
  },
  // ── Global Health / AOR ─────────────────────────────────────────────────────
  {
    id: "who_ihr2005",
    authors: "World Health Organization.",
    title: "International Health Regulations (2005), Third Edition",
    journal: "WHO Publication",
    year: 2016,
    url: "https://www.who.int/publications/i/item/9789241580496",
    category: "Global Health / AOR",
    tags: ["IHR", "PHEIC", "outbreak", "international surveillance"],
    relevance: "Legal framework for international disease surveillance and PHEIC declarations. Context for AOR event monitoring.",
    usedIn: ["AOR Intelligence Monitor — outbreak sourcing"],
  },
  {
    id: "who_mpox2024",
    authors: "World Health Organization.",
    title: "Mpox (monkeypox): WHO Situation Reports — 2024",
    journal: "WHO Disease Outbreak News",
    year: 2024,
    url: "https://www.who.int/emergencies/disease-outbreak-news/item/2024-DON522",
    category: "Global Health / AOR",
    tags: ["mpox", "Clade Ib", "DRC", "immunocompromised", "outbreak"],
    relevance: "WHO surveillance data on Mpox Clade Ib in DRC and cross-border spread. Used in AOR event evt-005.",
    usedIn: ["AOR Intelligence Monitor — DRC Mpox event"],
  },
  {
    id: "cdc_dengue2024",
    authors: "Centers for Disease Control and Prevention.",
    title: "Dengue: Epidemiology, Clinical Features, and Prevention",
    journal: "CDC Travelers' Health",
    year: 2024,
    url: "https://wwwnc.cdc.gov/travel/diseases/dengue",
    category: "Infectious Disease",
    tags: ["dengue", "vector-borne", "hemorrhagic fever", "anticoagulant interaction"],
    relevance: "Defines dengue clinical risk and anticoagulant interaction concern for warfarin users in endemic AOR regions.",
    usedIn: ["Drug Checker — warfarin AOR risks", "AOR Monitor — Bangladesh event"],
  },
  {
    id: "paho_yellowfever2024",
    authors: "Pan American Health Organization (PAHO).",
    title: "Yellow Fever: PAHO/WHO Situation Report, Colombia — 2024",
    journal: "PAHO Epidemiological Updates",
    year: 2024,
    url: "https://www.paho.org/en/epidemiological-alerts-and-updates",
    category: "Global Health / AOR",
    tags: ["yellow fever", "Colombia", "vaccination", "Amazon basin"],
    relevance: "Epidemiological situation for yellow fever in Colombia's Amazon basin departments. Used in AOR event evt-007.",
    usedIn: ["AOR Intelligence Monitor — Colombia Yellow Fever event"],
  },
  {
    id: "ocha_sudan2025",
    authors: "United Nations Office for the Coordination of Humanitarian Affairs (OCHA).",
    title: "Sudan: Humanitarian Situation Report — 2025",
    journal: "OCHA ReliefWeb",
    year: 2025,
    url: "https://reliefweb.int/disasters/OC-2023-000080-SDN",
    category: "Global Health / AOR",
    tags: ["Sudan", "conflict", "medical evacuation", "infrastructure"],
    relevance: "Humanitarian and medical infrastructure status in Sudan conflict zones. Used in AOR event evt-001.",
    usedIn: ["AOR Intelligence Monitor — Sudan event"],
  },
  {
    id: "who_euro_ukraine2024",
    authors: "WHO Regional Office for Europe.",
    title: "Health System Functionality in Ukraine: EURO Monitoring — 2024–2025",
    journal: "WHO EURO Situation Reports",
    year: 2024,
    url: "https://www.euro.who.int/en/health-topics/emergencies/ukraine-emergency",
    category: "Global Health / AOR",
    tags: ["Ukraine", "healthcare infrastructure", "cold chain", "power grid"],
    relevance: "Tracks healthcare system functionality and cold chain disruption in Ukraine. Used in AOR event evt-004.",
    usedIn: ["AOR Intelligence Monitor — Ukraine event"],
  },
  // ── Neurology / Psychiatry ──────────────────────────────────────────────────
  {
    id: "ilae2014",
    authors: "Fisher RS, Acevedo C, Arzimanoglou A, et al.",
    title: "ILAE Official Report: A Practical Clinical Definition of Epilepsy",
    journal: "Epilepsia",
    year: 2014,
    doi: "10.1111/epi.12550",
    url: "https://doi.org/10.1111/epi.12550",
    category: "Neurology / Psychiatry",
    tags: ["epilepsy", "seizure", "fitness for duty", "aviation", "DOT"],
    relevance: "Defines epilepsy for clinical and occupational purposes. Directly relevant to aviation AME and FMCSA DOT disqualifying conditions.",
    usedIn: ["ClearanceMatrix", "Case Hub — Neurologic conditions"],
  },
  {
    id: "samhsa2023",
    authors: "Substance Abuse and Mental Health Services Administration (SAMHSA).",
    title: "Federal Workplace Drug Testing Programs: Scientific and Technical Guidelines",
    journal: "SAMHSA Federal Register",
    year: 2023,
    url: "https://www.samhsa.gov/workplace/drug-free-workplace-programs/federal-programs",
    category: "Neurology / Psychiatry",
    tags: ["drug testing", "workplace", "federal", "safety-sensitive"],
    relevance: "Governs drug testing in federal safety-sensitive occupations. Used for context in Drug Checker SED flags.",
    usedIn: ["Drug Checker — SED flag (safety-sensitive roles)"],
  },
  // ── Environmental ──────────────────────────────────────────────────────────
  {
    id: "who_pm2_2021",
    authors: "World Health Organization.",
    title: "WHO Global Air Quality Guidelines: Particulate Matter (PM₂.₅ and PM₁₀), Ozone, NO₂, SO₂ and CO",
    journal: "WHO Publication",
    year: 2021,
    url: "https://www.who.int/publications/i/item/9789240034228",
    category: "Environmental / Toxicology",
    tags: ["PM2.5", "air quality", "dust", "respiratory", "COPD"],
    relevance: "WHO air quality guidelines for PM₂.₅ and PM₁₀. Basis for dust/respiratory risk flagging in AOR events.",
    usedIn: ["AOR Intelligence Monitor — Iraq dust storms event"],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function CitationCard({ c, highlight }: { c: Citation; highlight?: string }) {
  const [expanded, setExpanded] = useState(false);

  const hl = (text: string) => {
    if (!highlight) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "rgba(180,215,208,0.25)", color: "#fff", borderRadius: "2px", padding: "0 1px" }}>
          {text.slice(idx, idx + highlight.length)}
        </mark>
        {text.slice(idx + highlight.length)}
      </>
    );
  };

  return (
    <div style={{
      borderRadius: "10px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem",
          padding: "0.875rem 1rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <BookOpen size={14} style={{ color: "rgba(180,215,208,0.6)", flexShrink: 0, marginTop: "2px" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fff", lineHeight: 1.4, marginBottom: "0.15rem" }}>
            {hl(c.title)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>
            {hl(c.authors)} — <em>{hl(c.journal)}</em>, {c.year}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {c.tags.map(t => (
              <span key={t} style={{ padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
          {c.doi && (
            <a
              href={c.url || `https://doi.org/${c.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ color: "#b4d7d0", display: "flex" }}
              title="Open DOI"
            >
              <ExternalLink size={12} />
            </a>
          )}
          {!c.doi && c.url && (
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ color: "#b4d7d0", display: "flex" }}
              title="Open URL"
            >
              <ExternalLink size={12} />
            </a>
          )}
          {expanded ? <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronRight size={13} style={{ color: "rgba(255,255,255,0.3)" }} />}
        </div>
      </button>

      {expanded && (
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.25rem" }}>Relevance to this tool</div>
            <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{c.relevance}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.25rem" }}>Used in</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {c.usedIn.map(u => (
                <span key={u} style={{ padding: "0.15rem 0.5rem", borderRadius: "5px", background: "rgba(180,215,208,0.08)", border: "1px solid rgba(180,215,208,0.15)", fontSize: "0.6875rem", color: "rgba(180,215,208,0.8)", fontWeight: 600 }}>
                  {u}
                </span>
              ))}
            </div>
          </div>
          {(c.doi || c.url) && (
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.25rem" }}>
                {c.doi ? "DOI" : "URL"}
              </div>
              <a
                href={c.url || `https://doi.org/${c.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.75rem", color: "#b4d7d0", wordBreak: "break-all" }}
              >
                {c.doi ? `https://doi.org/${c.doi}` : c.url}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Citations() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [updateFilter, setUpdateFilter] = useState<"All" | "Federal" | "State" | "Local">("All");

  const filtered = useMemo(() => {
    let list = CITATIONS;
    if (activeCategory !== "All") {
      list = list.filter(c => c.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.authors.toLowerCase().includes(q) ||
        c.journal.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.relevance.toLowerCase().includes(q) ||
        c.usedIn.some(u => u.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, activeCategory]);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = { All: CITATIONS.length };
    CITATIONS.forEach(c => {
      m[c.category] = (m[c.category] ?? 0) + 1;
    });
    return m;
  }, []);

  const yearGroups = useMemo(() => {
    const groups: Record<string, Citation[]> = {};
    [...filtered].sort((a, b) => b.year - a.year).forEach(c => {
      const y = String(c.year);
      if (!groups[y]) groups[y] = [];
      groups[y].push(c);
    });
    return groups;
  }, [filtered]);

  const filteredUpdates = useMemo(() => {
    let list = SAFETY_UPDATES;
    if (updateFilter !== "All") {
      list = list.filter(u => u.jurisdiction === updateFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.title.toLowerCase().includes(q) ||
        u.summary.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q) ||
        u.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, updateFilter]);

  const caseStudies = useMemo(() => {
    let list = CITATIONS.filter(c => c.category === "Case Studies");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.authors.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.relevance.toLowerCase().includes(q) ||
        c.usedIn.some(u => u.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "1rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
          Citations & References
        </h1>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", margin: "0.25rem 0 0" }}>
          All clinical guidelines, databases, and primary sources referenced throughout this tool — with links to originals.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {[
          { label: "Total Citations", value: CITATIONS.length },
          { label: "Categories", value: CATEGORIES.length - 1 },
          { label: "Shown", value: filtered.length },
        ].map(s => (
          <div key={s.label} style={{ padding: "0.5rem 0.875rem", borderRadius: "8px", background: "rgba(180,215,208,0.07)", border: "1px solid rgba(180,215,208,0.15)" }}>
                  <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "#b4d7d0" }}>{s.value}</span>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginLeft: "0.375rem" }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "1rem", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fff" }}>Workplace Safety Updates</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>Federal, state, and local safety changes tracked for occupational medicine review.</div>
          </div>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {(["All", "Federal", "State", "Local"] as const).map(v => (
              <button
                key={v}
                onClick={() => setUpdateFilter(v)}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: updateFilter === v ? "rgba(180,215,208,0.12)" : "rgba(255,255,255,0.03)",
                  color: updateFilter === v ? "#b4d7d0" : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {filteredUpdates.map(u => (
            <div key={u.id} style={{ padding: "0.8rem", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#b4d7d0", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>{u.jurisdiction}</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>{u.title}</div>
                </div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)" }}>{u.updated}</div>
              </div>
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", marginTop: "0.35rem", lineHeight: 1.5 }}>{u.summary}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
                <span style={{ padding: "0.12rem 0.45rem", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontSize: "0.62rem", fontWeight: 700 }}>{u.status}</span>
                {u.tags.map(t => (
                    <span key={t} style={{ padding: "0.12rem 0.45rem", borderRadius: "4px", background: "rgba(180,215,208,0.08)", color: "#b4d7d0", fontSize: "0.62rem", fontWeight: 700 }}>{t}</span>
                ))}
              </div>
              {u.source && (
                <a href={u.source} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", marginTop: "0.5rem", color: "#b4d7d0", fontSize: "0.75rem" }}>
                  Open source
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "1rem", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
          Deep Case Studies
        </div>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          {caseStudies.map(c => (
            <div key={c.id} style={{ padding: "0.85rem", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>{c.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>{c.journal} · {c.year}</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {c.tags.map(t => <span key={t} style={{ padding: "0.12rem 0.45rem", borderRadius: "4px", background: "rgba(180,215,208,0.08)", color: "#b4d7d0", fontSize: "0.62rem", fontWeight: 700 }}>{t}</span>)}
                </div>
              </div>
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", marginTop: "0.35rem", lineHeight: 1.5 }}>{c.relevance}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
                {c.usedIn.map(u => <span key={u} style={{ padding: "0.12rem 0.45rem", borderRadius: "4px", background: "rgba(214,200,170,0.08)", color: "#d6c8aa", fontSize: "0.62rem", fontWeight: 700 }}>{u}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", flex: 1, minHeight: 0 }}>
        {/* Sidebar: category filters */}
        <div style={{ width: "195px", flexShrink: 0, overflowY: "auto" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Filter size={10} />
              Category
            </div>
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat;
              const count = catCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.5rem 0.75rem",
                    background: active ? "rgba(180,215,208,0.08)" : "transparent",
                    border: "none",
                    borderLeft: active ? "2px solid #b4d7d0" : "2px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "0.8125rem", color: active ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: active ? 600 : 400 }}>{cat}</span>
                  <span style={{ fontSize: "0.6875rem", color: active ? "#b4d7d0" : "rgba(255,255,255,0.25)", fontWeight: 600 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main list */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, author, journal, tag, or module…"
              style={{
                width: "100%",
                paddingLeft: "2.25rem",
                paddingRight: "0.75rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "0.8125rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.3)" }}>
              <Tag size={28} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.4 }} />
              No citations match your search.
            </div>
          )}

          {Object.entries(yearGroups).map(([year, cits]) => (
            <div key={year}>
              <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", paddingLeft: "0.25rem" }}>
                {year}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {cits.map(c => (
                  <CitationCard key={c.id} c={c} highlight={search || undefined} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
