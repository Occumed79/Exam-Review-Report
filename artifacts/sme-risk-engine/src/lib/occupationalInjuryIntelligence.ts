import type { ONetJob } from '@/lib/onetJobDatabase';

export type ReviewProminence = 'Very prominent' | 'Prominent' | 'Relevant' | 'Contextual';

export type InjurySignal = {
  label: string;
  prominence: ReviewProminence;
  bodyRegions: string[];
  mechanisms: string[];
  reviewerWhy: string;
};

export type FindingMatch = {
  finding: string;
  relevance: 'High' | 'Moderate' | 'Context-dependent';
  matchedDomains: string[];
  affectedDemands: string[];
  reviewQuestions: string[];
  explanation: string;
};

export type IntelligenceSource = {
  label: string;
  detail: string;
  url: string;
  role: 'Surveillance' | 'Classification' | 'Job demands' | 'Severe injury history';
};

export type OccupationalInjuryProfile = {
  archetype: string;
  injurySignals: InjurySignal[];
  dominantBodyRegions: string[];
  dominantMechanisms: string[];
  safetyNotes: string[];
  sourceNote: string;
};

const SOURCES: IntelligenceSource[] = [
  {
    label: 'BLS SOII — Occupation injury tables',
    detail: '2023–2024 occupation-level tables include injury nature, body part, source, event/exposure, days, and selected rates.',
    url: 'https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables.htm',
    role: 'Surveillance',
  },
  {
    label: 'BLS CFOI — Fatal occupational injuries',
    detail: 'Current fatal-injury tables provide occupation and event/exposure history for serious hazard context.',
    url: 'https://www.bls.gov/iif/fatal-injuries-tables.htm',
    role: 'Surveillance',
  },
  {
    label: 'OSHA Severe Injury Dashboard',
    detail: 'Federal severe-injury reports include hospitalization, amputation, eye loss, incident descriptions, and OIICS coding.',
    url: 'https://www.osha.gov/severe-injury-reports',
    role: 'Severe injury history',
  },
  {
    label: 'NIOSH Worker Health Charts',
    detail: 'Interactive surveillance can examine injury distributions and trends, including body-part groupings.',
    url: 'https://wwwn.cdc.gov/niosh-whc/',
    role: 'Surveillance',
  },
  {
    label: 'BLS OIICS',
    detail: 'Standard classification framework for nature of injury, body part, event/exposure, source, activity, and location.',
    url: 'https://www.bls.gov/iif/definitions/occupational-injuries-and-illnesses-classification-manual.htm',
    role: 'Classification',
  },
  {
    label: 'O*NET OnLine',
    detail: 'Occupation-specific tasks, work activities, work context, abilities, and job-demand descriptors.',
    url: 'https://www.onetonline.org/',
    role: 'Job demands',
  },
];

export function getInjuryIntelligenceSources(): IntelligenceSource[] {
  return SOURCES;
}

const SIGNAL_LIBRARY: Record<string, InjurySignal[]> = {
  emergency: [
    {
      label: 'Sprains, strains, and overexertion injuries',
      prominence: 'Very prominent',
      bodyRegions: ['Low back', 'Shoulder', 'Knee', 'Lower extremity'],
      mechanisms: ['Heavy lifting/carrying', 'Victim movement', 'Forceful exertion', 'Awkward posture'],
      reviewerWhy: 'High-force emergency work makes residual strength, endurance, range of motion, and recurrence risk especially important.',
    },
    {
      label: 'Lower-extremity trauma and instability',
      prominence: 'Prominent',
      bodyRegions: ['Knee', 'Ankle', 'Foot'],
      mechanisms: ['Running', 'Stairs/ladders', 'Uneven surfaces', 'Rapid direction change'],
      reviewerWhy: 'Emergency mobility can expose deficits that may not appear during routine office activity.',
    },
    {
      label: 'Acute traumatic injury',
      prominence: 'Prominent',
      bodyRegions: ['Multiple body regions', 'Head', 'Upper extremity'],
      mechanisms: ['Falls', 'Vehicle incidents', 'Struck-by events', 'Structural hazards'],
      reviewerWhy: 'Prior trauma may matter when the job requires rapid response, protective equipment, climbing, or high consequence decision-making.',
    },
    {
      label: 'Heat, respiratory, and exposure-related conditions',
      prominence: 'Prominent',
      bodyRegions: ['Cardiopulmonary', 'Whole body'],
      mechanisms: ['Heat stress', 'Smoke/fume exposure', 'PPE/respirator burden', 'Infectious exposure'],
      reviewerWhy: 'Cardiopulmonary reserve and tolerance of PPE can be operationally important even when the condition is otherwise stable.',
    },
  ],
  enforcement: [
    {
      label: 'Musculoskeletal sprain/strain',
      prominence: 'Prominent',
      bodyRegions: ['Low back', 'Shoulder', 'Knee'],
      mechanisms: ['Physical confrontation', 'Running', 'Lifting', 'Defensive tactics'],
      reviewerWhy: 'Forceful, unpredictable movement raises the importance of strength, stability, and unrestricted functional motion.',
    },
    {
      label: 'Lower-extremity injury',
      prominence: 'Prominent',
      bodyRegions: ['Knee', 'Ankle', 'Foot'],
      mechanisms: ['Foot pursuit', 'Stairs', 'Uneven terrain', 'Rapid acceleration/deceleration'],
      reviewerWhy: 'A condition can be compatible with routine walking yet still matter during pursuit or emergency response.',
    },
    {
      label: 'Vehicle and acute trauma exposure',
      prominence: 'Relevant',
      bodyRegions: ['Multiple body regions', 'Head/neck'],
      mechanisms: ['Emergency driving', 'Collision', 'Assault', 'Struck-by events'],
      reviewerWhy: 'Alertness, reaction time, mobility, and medication effects can become safety-critical.',
    },
  ],
  driving: [
    {
      label: 'Low-back and seated-posture disorders',
      prominence: 'Prominent',
      bodyRegions: ['Low back', 'Hip'],
      mechanisms: ['Prolonged sitting', 'Whole-body vibration', 'Cab ingress/egress', 'Cargo handling'],
      reviewerWhy: 'Pain, weakness, limited sitting tolerance, and sedating treatment can affect sustained vehicle operation.',
    },
    {
      label: 'Slips, trips, and lower-extremity injury',
      prominence: 'Relevant',
      bodyRegions: ['Knee', 'Ankle', 'Foot'],
      mechanisms: ['Cab steps', 'Loading areas', 'Weather', 'Uneven surfaces'],
      reviewerWhy: 'Climbing into equipment and performing inspections may require more function than seated driving alone.',
    },
    {
      label: 'Transportation incident consequence',
      prominence: 'Very prominent',
      bodyRegions: ['Whole body'],
      mechanisms: ['Motor vehicle collision', 'Fatigue', 'Impaired alertness', 'Medical event while driving'],
      reviewerWhy: 'Conditions causing sudden impairment, reduced alertness, visual limitation, or delayed reaction carry amplified consequences.',
    },
  ],
  healthcare: [
    {
      label: 'Patient-handling musculoskeletal injury',
      prominence: 'Very prominent',
      bodyRegions: ['Low back', 'Shoulder', 'Upper extremity'],
      mechanisms: ['Patient transfer', 'Repositioning', 'Awkward posture', 'Unexpected load shift'],
      reviewerWhy: 'A prior back or shoulder condition may be challenged by unpredictable loads and repeated handling tasks.',
    },
    {
      label: 'Slips, trips, and lower-extremity injury',
      prominence: 'Relevant',
      bodyRegions: ['Knee', 'Ankle', 'Foot'],
      mechanisms: ['Wet floors', 'Rapid walking', 'Long shifts'],
      reviewerWhy: 'Tolerance for prolonged standing and walking can matter even when heavy lifting is infrequent.',
    },
    {
      label: 'Sharps, infectious, and workplace violence exposure',
      prominence: 'Prominent',
      bodyRegions: ['Hands', 'Whole body'],
      mechanisms: ['Needlestick', 'Patient aggression', 'Blood/body-fluid exposure'],
      reviewerWhy: 'Dexterity, attention, protective response, and immune/infectious considerations may be job-relevant.',
    },
  ],
  construction: [
    {
      label: 'Back/shoulder overexertion',
      prominence: 'Very prominent',
      bodyRegions: ['Low back', 'Shoulder', 'Upper extremity'],
      mechanisms: ['Material handling', 'Overhead work', 'Pushing/pulling', 'Awkward posture'],
      reviewerWhy: 'Strength, range of motion, and sustained positional tolerance directly intersect with common trade demands.',
    },
    {
      label: 'Falls and lower-extremity trauma',
      prominence: 'Very prominent',
      bodyRegions: ['Knee', 'Ankle', 'Foot', 'Multiple body regions'],
      mechanisms: ['Ladders', 'Scaffolds', 'Uneven surfaces', 'Work at height'],
      reviewerWhy: 'Balance, joint stability, vision, medication effects, and sudden impairment may have high-consequence implications.',
    },
    {
      label: 'Hand/upper-extremity injury',
      prominence: 'Prominent',
      bodyRegions: ['Hand', 'Wrist', 'Forearm'],
      mechanisms: ['Power tools', 'Pinch points', 'Repetitive force', 'Contact with equipment'],
      reviewerWhy: 'Grip, sensation, dexterity, and protective response can be essential to safe tool use.',
    },
    {
      label: 'Noise and respiratory exposure',
      prominence: 'Relevant',
      bodyRegions: ['Hearing', 'Respiratory'],
      mechanisms: ['Power tools', 'Dust', 'Fumes', 'Respirator use'],
      reviewerWhy: 'Hearing conservation, pulmonary reserve, and respirator tolerance may be directly relevant.',
    },
  ],
  industrial: [
    {
      label: 'Contact/handling injuries',
      prominence: 'Prominent',
      bodyRegions: ['Hand', 'Upper extremity', 'Multiple body regions'],
      mechanisms: ['Machinery', 'Caught-between', 'Struck-by', 'Material handling'],
      reviewerWhy: 'Dexterity, sensation, alertness, and reaction speed can be critical around machinery.',
    },
    {
      label: 'Back and lower-extremity strain',
      prominence: 'Prominent',
      bodyRegions: ['Low back', 'Knee', 'Shoulder'],
      mechanisms: ['Lifting', 'Standing', 'Climbing', 'Awkward positioning'],
      reviewerWhy: 'Repeated load and long shifts can expose endurance or stability deficits.',
    },
    {
      label: 'Noise/respiratory/environmental exposure',
      prominence: 'Relevant',
      bodyRegions: ['Hearing', 'Respiratory', 'Whole body'],
      mechanisms: ['Noise', 'Dust/fume', 'Heat', 'Chemical exposure'],
      reviewerWhy: 'Baseline hearing, pulmonary function, skin/respiratory sensitivity, and PPE tolerance may be relevant.',
    },
  ],
  office: [
    {
      label: 'Neck/back discomfort and ergonomic strain',
      prominence: 'Relevant',
      bodyRegions: ['Neck', 'Low back', 'Upper back'],
      mechanisms: ['Prolonged sitting', 'Static posture', 'Poor workstation setup'],
      reviewerWhy: 'Functional relevance usually depends on sustained sitting tolerance and whether symptoms disrupt concentration or attendance.',
    },
    {
      label: 'Repetitive upper-extremity symptoms',
      prominence: 'Relevant',
      bodyRegions: ['Wrist', 'Hand', 'Forearm'],
      mechanisms: ['Keyboard/mouse repetition', 'Static hand posture'],
      reviewerWhy: 'Dexterity, endurance, and symptom provocation may be more relevant than maximum strength.',
    },
  ],
  maritime: [
    {
      label: 'Slips, falls, and lower-extremity injury',
      prominence: 'Prominent',
      bodyRegions: ['Knee', 'Ankle', 'Foot', 'Multiple body regions'],
      mechanisms: ['Wet surfaces', 'Ladders', 'Vessel motion', 'Deck obstacles'],
      reviewerWhy: 'Balance, vestibular function, joint stability, and rapid mobility can be important in a moving environment.',
    },
    {
      label: 'Back/shoulder material-handling injury',
      prominence: 'Relevant',
      bodyRegions: ['Low back', 'Shoulder'],
      mechanisms: ['Line handling', 'Equipment movement', 'Awkward posture'],
      reviewerWhy: 'Strength and range of motion may matter during routine operations and emergency response.',
    },
  ],
  aviation: [
    {
      label: 'Sudden-incapacitation consequence',
      prominence: 'Very prominent',
      bodyRegions: ['Neurologic', 'Cardiovascular', 'Whole body'],
      mechanisms: ['Medical event during flight', 'Impaired alertness', 'Medication effect'],
      reviewerWhy: 'The dominant occupational issue is often consequence severity rather than musculoskeletal injury frequency.',
    },
    {
      label: 'Sensory and vestibular performance',
      prominence: 'Prominent',
      bodyRegions: ['Vision', 'Hearing', 'Vestibular'],
      mechanisms: ['Instrument scanning', 'Communication', 'Spatial orientation', 'Pressure change'],
      reviewerWhy: 'Small sensory or vestibular deficits can have outsized operational relevance.',
    },
  ],
  military: [
    {
      label: 'Load-bearing musculoskeletal injury',
      prominence: 'Very prominent',
      bodyRegions: ['Low back', 'Knee', 'Ankle', 'Shoulder'],
      mechanisms: ['Ruck/load carriage', 'Running', 'Uneven terrain', 'Repeated lifting'],
      reviewerWhy: 'Austere movement under load raises the importance of recurrence risk, endurance, and functional reserve.',
    },
    {
      label: 'Acute traumatic injury',
      prominence: 'Prominent',
      bodyRegions: ['Multiple body regions', 'Head'],
      mechanisms: ['Vehicle events', 'Falls', 'Blast/impact', 'Training incidents'],
      reviewerWhy: 'Remote care, evacuation delay, and high-consequence tasks can magnify residual deficits from prior trauma.',
    },
    {
      label: 'Heat, respiratory, and environmental stress',
      prominence: 'Prominent',
      bodyRegions: ['Cardiopulmonary', 'Whole body'],
      mechanisms: ['Extreme climate', 'Dust/smoke', 'PPE', 'Sleep disruption'],
      reviewerWhy: 'A condition that is manageable in routine civilian settings may behave differently during deployment.',
    },
  ],
  generic: [
    {
      label: 'Musculoskeletal strain/overexertion',
      prominence: 'Relevant',
      bodyRegions: ['Low back', 'Shoulder', 'Knee'],
      mechanisms: ['Lifting', 'Repetition', 'Awkward posture', 'Extended activity'],
      reviewerWhy: 'Compare the person’s functional status with the actual physical demands rather than diagnosis alone.',
    },
    {
      label: 'Slips, trips, falls, and contact events',
      prominence: 'Contextual',
      bodyRegions: ['Lower extremity', 'Multiple body regions'],
      mechanisms: ['Walking surfaces', 'Equipment', 'Environmental conditions'],
      reviewerWhy: 'Job context determines whether balance, mobility, medication effects, or prior injury meaningfully change risk.',
    },
  ],
};

function combinedJobText(job: ONetJob): string {
  return [
    job.title,
    job.category,
    ...job.physicalDemands,
    ...job.essentialFunctions,
    ...job.cognitiveRequirements,
    ...job.environmentalExposures,
  ].join(' ').toLowerCase();
}

function chooseArchetype(job: ONetJob): string {
  const text = combinedJobText(job);
  if (/firefighter|emergency medical|emt|paramedic|rescue/.test(text)) return 'emergency';
  if (/police|law enforcement|detective|security guard|firearm|weapon/.test(text)) return 'enforcement';
  if (/truck driver|bus driver|commercial vehicle|driving|driver/.test(text)) return 'driving';
  if (/nurse|patient|healthcare|medical technician|clinical/.test(text)) return 'healthcare';
  if (/electrician|plumber|construction|scaffold|ladder|trade/.test(text)) return 'construction';
  if (/mining|plant operator|machinery|industrial|production|manufactur/.test(text)) return 'industrial';
  if (/maritime|vessel|ship|deck|water transportation/.test(text)) return 'maritime';
  if (/pilot|aircraft|aviation|flight/.test(text)) return 'aviation';
  if (/military|combat|tactical|deployment/.test(text)) return 'military';
  if (/office|accounting|bookkeep|computer workstation|sedentary/.test(text)) return 'office';
  return 'generic';
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildOccupationalInjuryProfile(job: ONetJob): OccupationalInjuryProfile {
  const archetype = chooseArchetype(job);
  const injurySignals = SIGNAL_LIBRARY[archetype] ?? SIGNAL_LIBRARY.generic;
  const dominantBodyRegions = unique(injurySignals.flatMap(signal => signal.bodyRegions)).slice(0, 8);
  const dominantMechanisms = unique(injurySignals.flatMap(signal => signal.mechanisms)).slice(0, 8);
  const safetyNotes = [
    ...(job.safetySensitive ? ['Safety-sensitive occupation: sudden impairment, alertness, reaction time, and medication effects deserve explicit review.'] : []),
    ...job.environmentalExposures.slice(0, 3),
  ];

  return {
    archetype,
    injurySignals,
    dominantBodyRegions,
    dominantMechanisms,
    safetyNotes,
    sourceNote: 'Prominence labels are reviewer-facing synthesis from the occupation’s demands and hazard pattern. They are not invented incidence rates. Use the linked BLS/NIOSH/OSHA surveillance sources for measured counts, rates, and historical trends.',
  };
}

const FINDING_DOMAINS: Array<{
  pattern: RegExp;
  domain: string;
  demandPattern: RegExp;
  questions: string[];
}> = [
  {
    pattern: /shoulder|rotator|labrum|clavicle|upper arm|biceps/,
    domain: 'Shoulder / upper extremity',
    demandPattern: /lift|carry|reach|overhead|push|pull|tool|drag|climb|weapon|patient|equipment/,
    questions: ['Current shoulder range of motion?', 'Strength compared with the opposite side?', 'Pain with overhead work or lifting?', 'Any recurrent instability or restrictions?'],
  },
  {
    pattern: /back|lumbar|spine|disc|sciatica|fusion|laminectomy/,
    domain: 'Spine / low back',
    demandPattern: /lift|carry|bend|stoop|kneel|sit|vibration|patient|load|drag|confined|equipment/,
    questions: ['Current lifting or positional restrictions?', 'Radicular symptoms, weakness, or numbness?', 'Tolerance for prolonged sitting/standing?', 'Recurrence with load or repetitive activity?'],
  },
  {
    pattern: /knee|acl|meniscus|patella|ankle|foot|achilles/,
    domain: 'Lower extremity',
    demandPattern: /walk|run|climb|stairs|ladder|kneel|crouch|squat|uneven|pursuit|stand|carry/,
    questions: ['Instability, locking, or giving way?', 'Running/stair/ladder tolerance?', 'Current swelling or activity-limiting pain?', 'Any brace or work restriction?'],
  },
  {
    pattern: /seizure|syncope|faint|loss of consciousness|blackout/,
    domain: 'Sudden impairment / neurologic',
    demandPattern: /drive|pilot|height|ladder|machinery|weapon|emergency|critical|vessel|operate/,
    questions: ['Date and circumstances of the last event?', 'Recurrence history?', 'Current treatment and medication effects?', 'Any specialist restrictions or unresolved diagnostic workup?'],
  },
  {
    pattern: /sleep apnea|osa|cpap|narcolep|sleepiness|fatigue/,
    domain: 'Alertness / sleep',
    demandPattern: /drive|pilot|monitor|alert|night|shift|operate|emergency|critical|vigilance/,
    questions: ['Objective treatment/compliance data available?', 'Residual daytime sleepiness?', 'Shift-work or overnight duty?', 'Any safety-sensitive driving or machinery operation?'],
  },
  {
    pattern: /vision|visual|blind|glaucoma|retina|diplopia|color vision/,
    domain: 'Vision',
    demandPattern: /drive|pilot|weapon|color|instrument|inspect|read|height|machinery|navigate/,
    questions: ['Corrected acuity and field of vision?', 'Monocular vs binocular limitation?', 'Color discrimination required?', 'Night or low-visibility duty?'],
  },
  {
    pattern: /hearing|audiogram|tinnitus|deaf/,
    domain: 'Hearing / communication',
    demandPattern: /radio|communicat|alarm|noise|hearing|emergency|team|weapon|machinery/,
    questions: ['Current audiometric thresholds?', 'Hearing-aid use and functional benefit?', 'Need to detect alarms/radio/voice in noise?', 'Noise-exposure or hearing-conservation requirements?'],
  },
  {
    pattern: /asthma|copd|pulmonary|spirom|lung|respiratory/,
    domain: 'Pulmonary / respirator tolerance',
    demandPattern: /respirator|scba|smoke|dust|fume|heat|exertion|confined|chemical/,
    questions: ['Current symptoms and exacerbation frequency?', 'Recent spirometry/PFT results?', 'Respirator or SCBA requirement?', 'Exercise or heat-related limitation?'],
  },
  {
    pattern: /cardiac|heart|coronary|arrhythm|hypertension|blood pressure|mi|stent|syncope/,
    domain: 'Cardiovascular',
    demandPattern: /exertion|heat|emergency|carry|climb|run|drive|pilot|stress|scba/,
    questions: ['Current symptoms with exertion?', 'Recent blood pressure/control data?', 'Exercise capacity or ischemia testing when indicated?', 'Any medication-related dizziness or exercise limitation?'],
  },
  {
    pattern: /gabapentin|opioid|benzodiazep|sedat|sleep aid|muscle relax|antihistamine|medication/,
    domain: 'Medication / alertness',
    demandPattern: /drive|pilot|machinery|weapon|height|emergency|alert|critical|operate/,
    questions: ['Any sedation, dizziness, slowed reaction, or cognitive effect?', 'Stable dose and duration?', 'Taken during working hours?', 'Is the job safety-sensitive or high consequence?'],
  },
];

export function matchFindingToOccupation(job: ONetJob, findingInput: string): FindingMatch | null {
  const finding = findingInput.trim();
  if (!finding) return null;

  const normalizedFinding = finding.toLowerCase();
  const jobLines = [
    ...job.physicalDemands,
    ...job.essentialFunctions,
    ...job.cognitiveRequirements,
    ...job.environmentalExposures,
  ];

  const matchingDomains = FINDING_DOMAINS.filter(item => item.pattern.test(normalizedFinding));
  const domains = matchingDomains.length ? matchingDomains : [{
    pattern: /.*/,
    domain: 'General functional relevance',
    demandPattern: /lift|carry|walk|stand|drive|operate|alert|climb|communicat|tool|equipment|emergency/,
    questions: ['What functional limitation is actually present?', 'Which job task could be affected?', 'Is the limitation current, intermittent, or historical?', 'What objective documentation would resolve the uncertainty?'],
  }];

  const affectedDemands = unique(domains.flatMap(domain =>
    jobLines.filter(line => domain.demandPattern.test(line.toLowerCase())),
  )).slice(0, 8);

  const reviewQuestions = unique(domains.flatMap(domain => domain.questions)).slice(0, 8);
  const matchedDomains = unique(domains.map(domain => domain.domain));

  let relevance: FindingMatch['relevance'] = 'Context-dependent';
  if (affectedDemands.length >= 3 || (job.safetySensitive && affectedDemands.length >= 1)) relevance = 'High';
  else if (affectedDemands.length >= 1) relevance = 'Moderate';

  return {
    finding,
    relevance,
    matchedDomains,
    affectedDemands,
    reviewQuestions,
    explanation: affectedDemands.length
      ? `The finding intersects with ${affectedDemands.length} documented demand${affectedDemands.length === 1 ? '' : 's'} for ${job.title}. This is a reviewer prompt, not a clearance determination.`
      : `No direct demand match was found in the local occupation profile. Review the specific job description or applicable standard before treating the finding as occupationally significant.`,
  };
}
