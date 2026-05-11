import type { MedicalCondition, SMECase } from './types';

export interface DirectSourceFinding {
  source: 'PubMed' | 'RxNav' | 'OSHA' | 'CDC' | 'State Department';
  title: string;
  summary: string;
  url: string;
  status: 'live' | 'configured' | 'guidance' | 'error';
}

export interface DirectSourceIntelligence {
  findings: DirectSourceFinding[];
  checkedAt: string;
}

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const RXNAV_BASE = 'https://rxnav.nlm.nih.gov/REST';

function firstCondition(caseData: SMECase): MedicalCondition | null {
  return caseData.medicalConditions.find((condition) => condition.conditionName.trim()) || null;
}

function medications(caseData: SMECase): string[] {
  const values = caseData.medicalConditions.flatMap((condition) =>
    condition.currentMedications
      .split(/[;,\n]/)
      .map((med) => med.trim())
      .filter(Boolean)
  );
  return Array.from(new Set(values)).slice(0, 4);
}


/**
 * Fetch PubMed articles WITH titles for richer display
 */
async function fetchPubMedArticles(query: string, maxResults: number = 4): Promise<Array<{pmid: string; title: string; journal: string; year: string; url: string}>> {
  const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  try {
    const encoded = encodeURIComponent(query);
    const searchRes = await fetch(`${PUBMED_BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}&sort=relevance&term=${encoded}`);
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const ids: string[] = searchData?.esearchresult?.idlist || [];
    if (!ids.length) return [];
    
    const summaryRes = await fetch(`${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`);
    if (!summaryRes.ok) return ids.map(id => ({ pmid: id, title: `PMID ${id}`, journal: '', year: '', url: `https://pubmed.ncbi.nlm.nih.gov/${id}/` }));
    const summaryData = await summaryRes.json();
    
    return ids.map(pmid => {
      const item = summaryData?.result?.[pmid];
      return {
        pmid,
        title: item?.title || `PMID ${pmid}`,
        journal: item?.source || '',
        year: item?.pubdate?.substring(0, 4) || '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      };
    });
  } catch {
    return [];
  }
}

export { fetchPubMedArticles };

async function fetchPubMed(caseData: SMECase): Promise<DirectSourceFinding> {
  const condition = firstCondition(caseData);
  const query = encodeURIComponent(`${condition?.conditionName || 'occupational medicine'} fitness for duty occupational health`);
  const url = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=3&sort=relevance&term=${query}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`PubMed returned ${response.status}`);
    const data = await response.json();
    const ids: string[] = data?.esearchresult?.idlist || [];
    return {
      source: 'PubMed',
      title: ids.length ? `${ids.length} PubMed citation(s) found` : 'No recent PubMed citations found',
      summary: ids.length
        ? `Live PubMed search located source articles for ${condition?.conditionName || 'occupational medicine'} review. PMID(s): ${ids.join(', ')}.`
        : 'Live PubMed search completed but did not return high-relevance citations for this case query.',
      url: ids.length ? `https://pubmed.ncbi.nlm.nih.gov/?term=${query}` : 'https://pubmed.ncbi.nlm.nih.gov/',
      status: 'live',
    };
  } catch (error) {
    return {
      source: 'PubMed',
      title: 'PubMed check unavailable',
      summary: error instanceof Error ? error.message : 'Unable to complete PubMed lookup from this browser session.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/',
      status: 'error',
    };
  }
}

async function fetchRxNav(caseData: SMECase): Promise<DirectSourceFinding> {
  const meds = medications(caseData);
  if (!meds.length) {
    return {
      source: 'RxNav',
      title: 'No medications extracted',
      summary: 'Medication safety check is ready, but no current medications are present in this case.',
      url: 'https://rxnav.nlm.nih.gov/',
      status: 'guidance',
    };
  }

  try {
    const encoded = encodeURIComponent(meds[0]);
    const response = await fetch(`${RXNAV_BASE}/rxcui.json?name=${encoded}&search=2`);
    if (!response.ok) throw new Error(`RxNav returned ${response.status}`);
    const data = await response.json();
    const rxcui = data?.idGroup?.rxnormId?.[0];
    return {
      source: 'RxNav',
      title: rxcui ? `RxNav normalized ${meds[0]}` : `RxNav could not normalize ${meds[0]}`,
      summary: rxcui
        ? `Live RxNav check returned RxCUI ${rxcui}. Use the Drug Checker tab for class and interaction follow-up when multiple medications are present.`
        : `Live RxNav search did not find an exact RxNorm identifier for ${meds[0]}.`,
      url: rxcui ? `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${rxcui}` : 'https://rxnav.nlm.nih.gov/',
      status: 'live',
    };
  } catch (error) {
    return {
      source: 'RxNav',
      title: 'RxNav check unavailable',
      summary: error instanceof Error ? error.message : 'Unable to complete RxNav lookup from this browser session.',
      url: 'https://rxnav.nlm.nih.gov/',
      status: 'error',
    };
  }
}

function oshaFinding(caseData: SMECase): DirectSourceFinding {
  const dutyContext = [caseData.jobTitle, caseData.jobDuties.essentialFunctions, ...caseData.jobDuties.physicalDemands].join(' ').toLowerCase();
  const standard = /respirator|fire|hazard|confined|chemical|silica|noise/.test(dutyContext)
    ? 'OSHA standards should be reviewed for respiratory protection, hazard exposure, PPE, and job-task-specific requirements.'
    : 'OSHA general-duty and industry-specific standards should be reviewed against the official job description.';
  return {
    source: 'OSHA',
    title: 'OSHA regulatory source queued',
    summary: standard,
    url: 'https://www.osha.gov/laws-regs/standardinterpretations/publicationdate/currentyear',
    status: 'guidance',
  };
}

function cdcFinding(caseData: SMECase): DirectSourceFinding | null {
  if (!caseData.deploymentCountry) return null;
  return {
    source: 'CDC',
    title: `CDC traveler health review needed for ${caseData.deploymentCountry}`,
    summary: 'The case has deployment geography. Review CDC destination guidance for infectious disease, vaccine, medication, and access-to-care concerns.',
    url: `https://wwwnc.cdc.gov/travel/destinations/list`,
    status: 'guidance',
  };
}

function stateDepartmentFinding(caseData: SMECase): DirectSourceFinding | null {
  if (!caseData.deploymentCountry) return null;
  return {
    source: 'State Department',
    title: `Travel advisory review needed for ${caseData.deploymentCountry}`,
    summary: 'The case has deployment geography. Review State Department advisories for security, evacuation, and medical infrastructure issues.',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/',
    status: 'guidance',
  };
}

export async function fetchDirectSourceIntelligence(caseData: SMECase): Promise<DirectSourceIntelligence> {
  const settled = await Promise.allSettled([fetchPubMed(caseData), fetchRxNav(caseData)]);
  const findings: DirectSourceFinding[] = settled.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    return {
      source: index === 0 ? 'PubMed' : 'RxNav',
      title: 'Direct-source check failed',
      summary: result.reason instanceof Error ? result.reason.message : 'Unknown lookup error',
      url: index === 0 ? 'https://pubmed.ncbi.nlm.nih.gov/' : 'https://rxnav.nlm.nih.gov/',
      status: 'error',
    };
  });

  findings.push(oshaFinding(caseData));
  const cdc = cdcFinding(caseData);
  const stateDept = stateDepartmentFinding(caseData);
  if (cdc) findings.push(cdc);
  if (stateDept) findings.push(stateDept);

  return { findings, checkedAt: new Date().toISOString() };
}

export const DIRECT_SOURCE_AGENT_NAMES = ['NIH PubMed Direct', 'NIH RxNav Direct', 'OSHA Regulatory Direct', 'CDC Travel Direct', 'State Department Travel Direct'];
