/**
 * Offline O*NET Job Database
 * Curated from O*NET 30.2 for common occupational medicine evaluation contexts.
 * Covers physical demands, essential functions, and safety-sensitive designations.
 * Updated: 2026 | Source: O*NET OnLine (onetonline.org) + DOL BLS
 */

export interface ONetJob {
  socCode: string;
  title: string;
  category: string;
  safetySensitive: boolean;
  physicalDemands: string[];
  essentialFunctions: string[];
  cognitiveRequirements: string[];
  environmentalExposures: string[];
  relevantStandards: string[];
  onetUrl: string;
  blsUrl: string;
}

export const ONET_JOB_DATABASE: ONetJob[] = [

  // ─── PROTECTIVE SERVICES ────────────────────────────────────────────────────
  {
    socCode: '33-2011.00',
    title: 'Firefighter',
    category: 'Protective Services',
    safetySensitive: true,
    physicalDemands: [
      'Wear and operate SCBA (self-contained breathing apparatus)',
      'Carry equipment weighing 50–75 lbs over extended distances',
      'Climb ladders and stairs under load in full PPE',
      'Perform sustained aerobic exertion in high-heat environments',
      'Drag/carry victims or injured personnel',
      'Operate fire suppression equipment under pressure',
      'Work in confined spaces, at heights, and in low-visibility',
      'Respond to emergencies at any time with rapid mobilization',
    ],
    essentialFunctions: [
      'Respond to fire alarms and emergency calls within required time',
      'Control and extinguish fires using water, chemical agents, or other suppression',
      'Rescue survivors from burning buildings, accident sites, and water hazards',
      'Administer emergency medical services including CPR and ALS/BLS',
      'Operate and drive fire apparatus and specialty vehicles',
      'Perform ventilation operations using power tools and hand tools',
      'Conduct hazardous materials response and containment',
      'Perform search and rescue in smoke-filled or structurally compromised environments',
      'Maintain situational awareness and communicate via radio under stress',
      'Conduct pre-fire planning and building inspections',
    ],
    cognitiveRequirements: [
      'Rapid decision-making under extreme time pressure',
      'Spatial orientation in dark, smoke-filled environments',
      'Command and control of incident scenes',
      'Memory for building layouts, hazmat protocols, medical procedures',
    ],
    environmentalExposures: [
      'Extreme heat (structural fires 800–1200°F radiant environment)',
      'Chemical/combustion product inhalation risk',
      'Infectious disease exposure (EMS response)',
      'Traumatic stress and PTSD risk',
      'Shift work with disrupted circadian rhythm',
      'Noise exposure (sirens, power tools)',
    ],
    relevantStandards: ['NFPA 1582', 'NFPA 1500', 'IAFF/IAFC Wellness-Fitness Initiative', 'DOT/FMCSA (if driving apparatus)'],
    onetUrl: 'https://www.onetonline.org/link/summary/33-2011.00',
    blsUrl: 'https://www.bls.gov/ooh/protective-service/firefighters.htm',
  },

  {
    socCode: '33-3051.00',
    title: 'Police Officer',
    category: 'Protective Services',
    safetySensitive: true,
    physicalDemands: [
      'Pursue and apprehend suspects on foot',
      'Apply physical restraint and defensive tactics',
      'Operate patrol vehicle including emergency driving',
      'Wear body armor (15–20 lbs) for full shift duration',
      'Draw and deploy firearms safely under stress',
      'Respond to violent incidents requiring physical intervention',
    ],
    essentialFunctions: [
      'Patrol assigned area by vehicle or foot to prevent and detect crime',
      'Respond to emergency calls for service',
      'Investigate crimes and accidents, gather evidence',
      'Arrest and process suspects, applying appropriate force continuum',
      'Prepare written reports and maintain detailed documentation',
      'Testify in court proceedings',
      'Conduct traffic stops and enforce vehicle code',
      'Provide emergency first aid and coordinate EMS response',
    ],
    cognitiveRequirements: [
      'High-stress decision-making under threat conditions',
      'Risk assessment in unpredictable environments',
      'Memory for case details, legal codes, suspect descriptions',
      'Sustained alertness during long shifts',
    ],
    environmentalExposures: [
      'Traumatic incident exposure (violence, death, injury)',
      'Shift work and irregular hours',
      'Environmental extremes (weather, confined spaces)',
      'Infectious disease risk',
      'Noise exposure (sirens, firearms)',
    ],
    relevantStandards: ['IACP Fitness Standards', 'State POST standards', 'DOT/FMCSA (if operating CDL vehicle)'],
    onetUrl: 'https://www.onetonline.org/link/summary/33-3051.00',
    blsUrl: 'https://www.bls.gov/ooh/protective-service/police-and-detectives.htm',
  },

  {
    socCode: '33-3021.00',
    title: 'Detectives and Criminal Investigators',
    category: 'Protective Services',
    safetySensitive: true,
    physicalDemands: [
      'Potential physical confrontation and use of force',
      'Extended surveillance in variable environments',
      'Armed carry and safe firearms deployment',
    ],
    essentialFunctions: [
      'Investigate criminal cases and gather evidence',
      'Interview witnesses, victims, and suspects',
      'Prepare detailed case reports and affidavits',
      'Testify in court proceedings',
      'Coordinate with prosecutorial and law enforcement agencies',
    ],
    cognitiveRequirements: [
      'Analytical reasoning and pattern recognition',
      'Sustained concentration over long investigation periods',
      'Stress tolerance during high-stakes investigations',
    ],
    environmentalExposures: [
      'Potential trauma exposure from crime scenes',
      'Irregular hours and shift work',
    ],
    relevantStandards: ['State POST standards', 'Agency-specific fitness requirements'],
    onetUrl: 'https://www.onetonline.org/link/summary/33-3021.00',
    blsUrl: 'https://www.bls.gov/ooh/protective-service/police-and-detectives.htm',
  },

  // ─── TRANSPORTATION ──────────────────────────────────────────────────────────
  {
    socCode: '53-3032.00',
    title: 'Heavy and Tractor-Trailer Truck Driver',
    category: 'Transportation',
    safetySensitive: true,
    physicalDemands: [
      'Operate commercial vehicle for extended periods (up to 11 hrs/day)',
      'Enter and exit cab frequently (climbing 3–5 ft)',
      'Perform pre/post-trip vehicle inspection',
      'Load and secure cargo up to 50 lbs',
      'Maintain alertness for extended continuous periods',
    ],
    essentialFunctions: [
      'Operate Class A or B commercial vehicle safely in all traffic and weather conditions',
      'Complete pre/post-trip inspections per FMCSA 49 CFR 396',
      'Maintain HOS (hours of service) logs accurately',
      'Communicate with dispatch and comply with routing instructions',
      'Secure loads appropriately per cargo type',
      'Perform coupling/uncoupling of trailers',
    ],
    cognitiveRequirements: [
      'Sustained attention for hours of continuous driving',
      'Spatial judgment for large vehicle maneuvering',
      'Rapid hazard recognition and avoidance',
      'Navigation and route-planning',
    ],
    environmentalExposures: [
      'Extended periods of vibration and seated posture',
      'Diesel fume exposure during loading/unloading',
      'Night driving and shift work',
      'Weather-related hazards',
    ],
    relevantStandards: ['DOT/FMCSA 49 CFR Part 391 (Medical Standards)', 'DOT/FMCSA Federal Diabetes Exemption', 'FMCSA Federal Seizure Exemption', 'FMCSA Sleep Apnea Guidance'],
    onetUrl: 'https://www.onetonline.org/link/summary/53-3032.00',
    blsUrl: 'https://www.bls.gov/ooh/transportation-and-material-moving/heavy-and-tractor-trailer-truck-drivers.htm',
  },

  {
    socCode: '53-3041.00',
    title: 'School Bus Driver',
    category: 'Transportation',
    safetySensitive: true,
    physicalDemands: [
      'Operate school bus safely in urban and suburban environments',
      'Monitor student behavior while driving',
      'Assist students with mobility limitations',
    ],
    essentialFunctions: [
      'Transport students safely to and from school along assigned routes',
      'Maintain discipline and safety of passengers',
      'Perform pre-trip inspection and maintain vehicle records',
      'Respond appropriately to vehicle emergencies',
    ],
    cognitiveRequirements: [
      'Undivided attention for student safety and traffic',
      'Route memory and navigation',
    ],
    environmentalExposures: ['Urban traffic stress', 'Exhaust fume exposure'],
    relevantStandards: ['State CDL/bus driver medical standards', 'DOT/FMCSA medical certificate requirements'],
    onetUrl: 'https://www.onetonline.org/link/summary/53-3041.00',
    blsUrl: 'https://www.bls.gov/ooh/transportation-and-material-moving/bus-drivers.htm',
  },

  {
    socCode: '53-2011.00',
    title: 'Airline Pilot, Copilot, and Flight Engineer',
    category: 'Transportation (Aviation)',
    safetySensitive: true,
    physicalDemands: [
      'Operate aircraft flight controls with precision',
      'Maintain situational awareness in 3D space',
      'Respond rapidly to emergency procedures',
      'Sustain alertness during long-haul flights',
    ],
    essentialFunctions: [
      'Operate aircraft safely in all weather conditions per FAR Part 91/121/135',
      'Perform pre-flight inspection and weight/balance calculations',
      'Communicate with ATC and crew per CRM protocols',
      'Execute emergency procedures accurately under pressure',
      'File flight plans and comply with airspace regulations',
    ],
    cognitiveRequirements: [
      'High cognitive load under emergency conditions',
      'Spatial orientation and vestibular stability',
      'Multitasking across multiple information streams',
      'Crew resource management and communication',
    ],
    environmentalExposures: [
      'Hypoxia risk at altitude',
      'Cosmic radiation (long-haul)',
      'Circadian disruption from time zone crossing',
      'Pressure changes affecting ears and sinuses',
    ],
    relevantStandards: ['FAA Class 1/2/3 Medical Certificate (14 CFR Part 67)', 'FAA Special Issuance Policy', 'ICAO Standards'],
    onetUrl: 'https://www.onetonline.org/link/summary/53-2011.00',
    blsUrl: 'https://www.bls.gov/ooh/transportation-and-material-moving/airline-and-commercial-pilots.htm',
  },

  // ─── MILITARY / DEFENSE ─────────────────────────────────────────────────────
  {
    socCode: '55-1017.00',
    title: 'Military Officer (General)',
    category: 'Military / Defense',
    safetySensitive: true,
    physicalDemands: [
      'Meet branch-specific physical fitness standards (APFT/ACFT/PFT)',
      'Carry combat load (60–120 lbs) over extended distances',
      'Operate in austere environments without medical access',
      'Rapid mobilization and extended operational duty',
    ],
    essentialFunctions: [
      'Lead and direct military personnel in training and operations',
      'Maintain personal physical fitness meeting branch standards',
      'Deploy to forward operating locations including combat zones',
      'Operate and maintain military equipment and weapons systems',
      'Complete all required military training and readiness standards',
    ],
    cognitiveRequirements: [
      'Command decision-making under combat stress',
      'Situational awareness in complex tactical environments',
      'Sustained performance under sleep deprivation',
    ],
    environmentalExposures: [
      'Combat stress and PTSD risk',
      'Extreme climate exposure (heat, cold, altitude)',
      'Chemical, biological, radiological, nuclear (CBRN) risk',
      'Limited medical access in forward areas',
    ],
    relevantStandards: ['DoDI 6130.03 (Medical Standards for Military Service)', 'MOD JSP 950 (UK)', 'AR 40-501', 'NAVMED P-117'],
    onetUrl: 'https://www.onetonline.org/link/summary/55-1017.00',
    blsUrl: 'https://www.bls.gov/ooh/military/military-careers.htm',
  },

  {
    socCode: '55-3019.00',
    title: 'Military Enlisted Tactical Operations (Combat)',
    category: 'Military / Defense',
    safetySensitive: true,
    physicalDemands: [
      'Carry combat load 60–100+ lbs over rough terrain',
      'Sprint, crawl, and maneuver under fire',
      'Operate crew-served weapons and personal firearms',
      'Survive in austere environments for extended periods',
      'Perform physical tasks under extreme stress and fatigue',
    ],
    essentialFunctions: [
      'Execute combat missions as directed by command',
      'Operate and maintain assigned weapons systems',
      'Perform battle drills and tactical movement',
      'Provide immediate medical care (CLS/Combat Lifesaver)',
      'Operate communications equipment',
    ],
    cognitiveRequirements: [
      'Battle management under extreme stress',
      'Rapid threat identification',
      'Team coordination in noise and confusion',
    ],
    environmentalExposures: [
      'Direct combat exposure',
      'Blast/TBI risk',
      'PTSD risk from cumulative trauma',
      'Extreme heat/cold/altitude',
      'Infectious disease in austere environments',
    ],
    relevantStandards: ['DoDI 6130.03', 'AR 40-501', 'MOD Deployment Medical Standards'],
    onetUrl: 'https://www.onetonline.org/link/summary/55-3019.00',
    blsUrl: 'https://www.bls.gov/ooh/military/military-careers.htm',
  },

  // ─── CONSTRUCTION / INDUSTRIAL ──────────────────────────────────────────────
  {
    socCode: '47-2111.00',
    title: 'Electrician',
    category: 'Construction / Skilled Trades',
    safetySensitive: true,
    physicalDemands: [
      'Work at heights on ladders and scaffolding',
      'Work in confined spaces (conduit, crawl spaces)',
      'Bend and pull wire in tight spaces',
      'Lift and carry materials up to 50 lbs',
      'Stand, kneel, crouch for extended periods',
    ],
    essentialFunctions: [
      'Install, maintain, and repair electrical wiring and systems',
      'Read and interpret blueprints and technical schematics',
      'Follow NEC and local electrical codes',
      'Troubleshoot electrical failures safely',
      'Work safely around energized conductors using PPE and LOTO',
    ],
    cognitiveRequirements: [
      'Spatial reasoning for wiring diagrams',
      'Color discrimination for wire identification',
    ],
    environmentalExposures: [
      'Electrical shock hazard',
      'Fall risk at height',
      'Confined space entry risk',
      'Chemical exposure (solvents, adhesives)',
    ],
    relevantStandards: ['OSHA 29 CFR 1926.403 (Electrical)', 'NFPA 70E', 'NIOSH confined space'],
    onetUrl: 'https://www.onetonline.org/link/summary/47-2111.00',
    blsUrl: 'https://www.bls.gov/ooh/construction-and-extraction/electricians.htm',
  },

  {
    socCode: '47-2152.00',
    title: 'Plumber',
    category: 'Construction / Skilled Trades',
    safetySensitive: false,
    physicalDemands: [
      'Work in confined spaces (crawl spaces, equipment rooms)',
      'Lift pipe and fixtures up to 50 lbs',
      'Kneel, crouch, and work in cramped quarters',
      'Climb ladders and work at heights',
    ],
    essentialFunctions: [
      'Install and repair piping systems, fixtures, and appliances',
      'Read blueprints and specifications',
      'Inspect and test systems for leaks and compliance',
      'Apply solder, fittings, and sealants per code',
    ],
    cognitiveRequirements: ['Spatial reasoning for piping layout', 'Code knowledge and compliance'],
    environmentalExposures: [
      'Chemical exposure (solvents, sealants, lead pipe in older structures)',
      'Confined space risk',
      'Back injury risk from awkward postures',
    ],
    relevantStandards: ['OSHA 29 CFR 1926.651 (Excavations)', 'NIOSH confined space standards'],
    onetUrl: 'https://www.onetonline.org/link/summary/47-2152.00',
    blsUrl: 'https://www.bls.gov/ooh/construction-and-extraction/plumbers-pipefitters-and-steamfitters.htm',
  },

  // ─── HEALTHCARE ─────────────────────────────────────────────────────────────
  {
    socCode: '29-1141.00',
    title: 'Registered Nurse',
    category: 'Healthcare',
    safetySensitive: false,
    physicalDemands: [
      'Stand and walk for 8–12 hour shifts',
      'Lift and reposition patients (up to 35 lbs unassisted per NIOSH guidelines)',
      'Use proper body mechanics for patient handling with assist devices',
      'Manual dexterity for IV placement, wound care, medication administration',
    ],
    essentialFunctions: [
      'Assess patient condition and vital signs',
      'Administer medications and treatments per physician orders',
      'Operate and monitor patient care equipment',
      'Document care accurately in electronic health record',
      'Communicate clinical findings to interdisciplinary team',
      'Provide patient and family education',
    ],
    cognitiveRequirements: [
      'Clinical decision-making under time pressure',
      'Medication knowledge and safety checks',
      'Multitasking across multiple patients',
    ],
    environmentalExposures: [
      'Bloodborne pathogen exposure risk',
      'Latex allergy risk',
      'Radiation exposure (diagnostic imaging departments)',
      'Compassion fatigue and secondary trauma',
      'Shift work and night shifts',
    ],
    relevantStandards: ['OSHA Bloodborne Pathogens Standard 29 CFR 1910.1030', 'NIOSH safe patient handling', 'State Board of Nursing standards'],
    onetUrl: 'https://www.onetonline.org/link/summary/29-1141.00',
    blsUrl: 'https://www.bls.gov/ooh/healthcare/registered-nurses.htm',
  },

  {
    socCode: '29-2041.00',
    title: 'Emergency Medical Technician (EMT)',
    category: 'Healthcare / EMS',
    safetySensitive: true,
    physicalDemands: [
      'Lift, move, and carry patients on stretchers (shared load, up to 125+ lbs)',
      'Kneel and work at floor level for patient assessment',
      'Perform CPR with sustained physical exertion',
      'Carry equipment up multiple flights of stairs',
      'Work in confined spaces (vehicles, tight rooms)',
    ],
    essentialFunctions: [
      'Provide emergency medical care in pre-hospital setting',
      'Assess patient condition and determine appropriate intervention',
      'Administer medications and treatments per EMS protocol',
      'Transport patients safely to appropriate medical facility',
      'Operate and drive ambulance in emergency and non-emergency mode',
      'Communicate with receiving facility and medical control',
    ],
    cognitiveRequirements: [
      'Rapid triage and clinical assessment',
      'Protocol recall under stress',
      'Navigation for response routing',
    ],
    environmentalExposures: [
      'Traumatic incident exposure (violence, fatal accidents)',
      'Bloodborne pathogen risk',
      'Unpredictable patient behavior and assault risk',
      'Shift work and fatigue',
    ],
    relevantStandards: ['NHTSA EMS Standards', 'State EMS certification requirements', 'OSHA Bloodborne Pathogens Standard'],
    onetUrl: 'https://www.onetonline.org/link/summary/29-2041.00',
    blsUrl: 'https://www.bls.gov/ooh/healthcare/emts-and-paramedics.htm',
  },

  // ─── ENERGY / UTILITIES ─────────────────────────────────────────────────────
  {
    socCode: '51-8013.00',
    title: 'Power Plant Operator',
    category: 'Energy / Utilities',
    safetySensitive: true,
    physicalDemands: [
      'Climb ladders and stairs frequently in plant environment',
      'Work in high-heat environments near boilers and turbines',
      'Respond physically to emergency shutdowns',
      'Wear respiratory protection (SCBA for certain areas)',
    ],
    essentialFunctions: [
      'Monitor and control electrical generating systems',
      'Perform startup, shutdown, and emergency procedures',
      'Read instruments and adjust controls to maintain output',
      'Respond rapidly to alarms and system failures',
      'Maintain detailed logs of operations',
    ],
    cognitiveRequirements: [
      'Sustained attention for control room monitoring',
      'Rapid response to alarm conditions',
      'Complex system troubleshooting',
    ],
    environmentalExposures: [
      'High noise environments',
      'Heat stress in plant areas',
      'Chemical hazards (coal ash, cooling water chemicals)',
      'Radiation (nuclear facilities)',
    ],
    relevantStandards: ['NRC 10 CFR Part 26 (Nuclear - Drug/Alcohol)', 'NRC Fitness for Duty rules', 'OSHA Power Generation standards'],
    onetUrl: 'https://www.onetonline.org/link/summary/51-8013.00',
    blsUrl: 'https://www.bls.gov/ooh/production/power-plant-operators-distributors-and-dispatchers.htm',
  },

  // ─── MARITIME ───────────────────────────────────────────────────────────────
  {
    socCode: '53-5021.00',
    title: 'Captains, Mates, and Pilots of Water Vessels',
    category: 'Maritime',
    safetySensitive: true,
    physicalDemands: [
      'Maintain visual watch over extended periods',
      'Respond to vessel emergencies and man-overboard drills',
      'Navigate confined waterways requiring precise judgment',
    ],
    essentialFunctions: [
      'Navigate vessels safely in all weather and traffic conditions',
      'Direct crew and vessel operations',
      'Comply with USCG and IMO regulations',
      'Respond to vessel emergencies and coordinate rescue',
      'Maintain vessel logs and safety records',
    ],
    cognitiveRequirements: [
      'Navigation and chart reading',
      'Spatial judgment for vessel maneuvering',
      'Decision-making under weather/traffic pressure',
    ],
    environmentalExposures: [
      'Sea motion (vestibular demands)',
      'Weather extremes',
      'Isolation on extended voyages',
    ],
    relevantStandards: ['USCG 46 CFR Part 10 (Merchant Mariner Credentials)', 'USCG Physical Fitness Requirements', 'IMO STCW Standards'],
    onetUrl: 'https://www.onetonline.org/link/summary/53-5021.00',
    blsUrl: 'https://www.bls.gov/ooh/transportation-and-material-moving/water-transportation-occupations.htm',
  },

  // ─── MINING / EXTRACTION ────────────────────────────────────────────────────
  {
    socCode: '47-5041.00',
    title: 'Continuous Mining Machine Operator',
    category: 'Mining / Extraction',
    safetySensitive: true,
    physicalDemands: [
      'Operate heavy machinery in confined underground spaces',
      'Work in low-oxygen environments with respiratory protection',
      'Respond to mine emergency evacuation procedures',
      'Sustain alertness in monotonous operational environments',
    ],
    essentialFunctions: [
      'Operate continuous miner and associated equipment safely',
      'Monitor equipment instruments and respond to alarms',
      'Comply with MSHA safety standards',
      'Participate in emergency evacuation drills',
      'Maintain equipment per operational requirements',
    ],
    cognitiveRequirements: [
      'Sustained vigilance in monotonous underground settings',
      'Emergency response decision-making',
    ],
    environmentalExposures: [
      'Respirable coal dust / silica (pneumoconiosis risk)',
      'Noise-induced hearing loss risk',
      'Low oxygen / methane risk',
      'Vibration (whole-body from machinery)',
      'Claustrophobic environment',
    ],
    relevantStandards: ['MSHA 30 CFR Part 50 (Incident Reporting)', 'NIOSH Mining Standards', 'OSHA 29 CFR 1910.134 (Respiratory)'],
    onetUrl: 'https://www.onetonline.org/link/summary/47-5041.00',
    blsUrl: 'https://www.bls.gov/ooh/construction-and-extraction/mining-and-geological-engineers.htm',
  },

  // ─── DESK / SEDENTARY ───────────────────────────────────────────────────────
  {
    socCode: '43-3031.00',
    title: 'Bookkeeping, Accounting, and Auditing Clerk',
    category: 'Office / Administrative',
    safetySensitive: false,
    physicalDemands: [
      'Prolonged seated work at computer workstation',
      'Repetitive keyboard and mouse use',
      'Occasional lifting of files or equipment up to 20 lbs',
    ],
    essentialFunctions: [
      'Maintain financial records and ledgers',
      'Process accounts payable/receivable',
      'Reconcile accounts and resolve discrepancies',
      'Prepare financial reports and statements',
      'Operate accounting software',
    ],
    cognitiveRequirements: [
      'Sustained attention to numerical detail',
      'Memory for procedural sequences',
      'Accuracy under deadline pressure',
    ],
    environmentalExposures: [
      'Ergonomic risk from prolonged keyboard use (RSI)',
      'Visual fatigue from screen use',
    ],
    relevantStandards: ['OSHA Ergonomics guidance', 'ADA reasonable accommodation guidelines'],
    onetUrl: 'https://www.onetonline.org/link/summary/43-3031.00',
    blsUrl: 'https://www.bls.gov/ooh/office-and-administrative-support/bookkeeping-accounting-and-auditing-clerks.htm',
  },

  // ─── SECURITY CONTRACTOR ────────────────────────────────────────────────────
  {
    socCode: '33-9032.00',
    title: 'Security Guard / Private Security Contractor',
    category: 'Security',
    safetySensitive: true,
    physicalDemands: [
      'Patrol large areas on foot for extended periods',
      'Respond physically to security incidents',
      'Armed carry and safe weapons deployment (if armed)',
      'Work rotating shifts including nights and weekends',
    ],
    essentialFunctions: [
      'Patrol assigned area to prevent and detect unauthorized activity',
      'Monitor surveillance equipment and access control systems',
      'Respond to alarms, emergencies, and incidents',
      'Document incidents and prepare written reports',
      'Coordinate with law enforcement as needed',
    ],
    cognitiveRequirements: [
      'Sustained alertness during monotonous patrol duty',
      'Threat assessment and use-of-force judgment',
      'Communication with authorities',
    ],
    environmentalExposures: [
      'Variable weather (outdoor posts)',
      'Violence and assault risk (armed personnel)',
      'Shift work and circadian disruption',
    ],
    relevantStandards: ['State armed/unarmed guard license requirements', 'MOD deployment medical standards (if overseas)'],
    onetUrl: 'https://www.onetonline.org/link/summary/33-9032.00',
    blsUrl: 'https://www.bls.gov/ooh/protective-service/security-guards.htm',
  },

];

/**
 * Search the offline database by title, category, or SOC code
 */
export function searchONetJobs(query: string): ONetJob[] {
  const q = query.toLowerCase().trim();
  if (!q) return ONET_JOB_DATABASE;
  return ONET_JOB_DATABASE.filter(job =>
    job.title.toLowerCase().includes(q) ||
    job.category.toLowerCase().includes(q) ||
    job.socCode.includes(q) ||
    job.essentialFunctions.some(f => f.toLowerCase().includes(q)) ||
    job.relevantStandards.some(s => s.toLowerCase().includes(q))
  );
}

/**
 * Get a job by exact SOC code
 */
export function getJobByCode(socCode: string): ONetJob | undefined {
  return ONET_JOB_DATABASE.find(j => j.socCode === socCode);
}

/**
 * Get all job categories
 */
export function getJobCategories(): string[] {
  return [...new Set(ONET_JOB_DATABASE.map(j => j.category))].sort();
}
