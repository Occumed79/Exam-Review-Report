/**
 * Nuclear Fuel APIs Integration Framework
 * Integrates free/freemium APIs to power advanced intelligence capabilities
 * User can create free accounts and configure API keys
 */

export interface APIConfiguration {
  apiName: string;
  provider: string;
  category: "medical" | "occupational" | "legal" | "research" | "data" | "nlp";
  freeLimit: string;
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  setupComplexity: "simple" | "moderate" | "complex";
  documentation: string;
  apiKey?: string;
  isConfigured: boolean;
  features: string[];
}

/**
 * NUCLEAR FUEL APIs - Free/Freemium Tier
 */
export const nuclearFuelAPIs: Record<string, APIConfiguration> = {
  // ============ MEDICAL & CLINICAL DATABASES ============

  "pubmed-api": {
    apiName: "PubMed API (NLM)",
    provider: "National Library of Medicine (NIH)",
    category: "medical",
    freeLimit: "Unlimited (rate-limited)",
    rateLimitPerMinute: 3,
    rateLimitPerDay: 10000,
    setupComplexity: "simple",
    documentation: "https://www.ncbi.nlm.nih.gov/home/develop/api/",
    isConfigured: false,
    features: [
      "Search 35+ million medical articles",
      "Access MEDLINE/PubMed Central",
      "Filter by publication date, study type",
      "Extract clinical evidence for conditions",
      "Integrate with case analysis",
    ],
  },

  "clinicaltrials-api": {
    apiName: "ClinicalTrials.gov API",
    provider: "National Institutes of Health (NIH)",
    category: "medical",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "simple",
    documentation: "https://clinicaltrials.gov/api/gui",
    isConfigured: false,
    features: [
      "Search 500,000+ clinical trials",
      "Filter by condition, intervention, location",
      "Access trial results and outcomes",
      "Find relevant treatment options",
      "Identify evidence-based interventions",
    ],
  },

  "rxnorm-api": {
    apiName: "RxNorm API (NLM)",
    provider: "National Library of Medicine (NIH)",
    category: "medical",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 20,
    rateLimitPerDay: 100000,
    setupComplexity: "simple",
    documentation: "https://www.nlm.nih.gov/research/umls/rxnorm/",
    isConfigured: false,
    features: [
      "Normalize medication names and codes",
      "Access drug interactions",
      "Get dosing information",
      "Link to clinical guidelines",
      "Support medication reconciliation",
    ],
  },

  "snomed-browser": {
    apiName: "SNOMED CT Browser API",
    provider: "SNOMED International",
    category: "medical",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "moderate",
    documentation: "https://browser.ihtsdotools.org/",
    isConfigured: false,
    features: [
      "Access 350,000+ medical concepts",
      "Map diagnoses to standardized codes",
      "Find clinical relationships",
      "Support FHIR interoperability",
      "Enable clinical documentation standardization",
    ],
  },

  "icd10-api": {
    apiName: "ICD-10 Code Lookup API",
    provider: "CDC/CMS",
    category: "medical",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 30,
    rateLimitPerDay: 50000,
    setupComplexity: "simple",
    documentation: "https://www.cms.gov/medicare/coding/icd10",
    isConfigured: false,
    features: [
      "Look up ICD-10 diagnosis codes",
      "Get code descriptions and guidelines",
      "Support billing and documentation",
      "Verify code specificity",
      "Access coding updates",
    ],
  },

  // ============ OCCUPATIONAL & LABOR DATA ============

  "onet-api": {
    apiName: "O*NET API",
    provider: "U.S. Department of Labor",
    category: "occupational",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "simple",
    documentation: "https://www.onetcenter.org/developers.html",
    isConfigured: false,
    features: [
      "Access 1,000+ job descriptions",
      "Get essential job functions",
      "Retrieve physical demands",
      "Access knowledge/skills requirements",
      "Support job-condition matching",
    ],
  },

  "bls-api": {
    apiName: "Bureau of Labor Statistics API",
    provider: "U.S. Department of Labor",
    category: "occupational",
    freeLimit: "500 requests/day (free tier)",
    rateLimitPerMinute: 120,
    rateLimitPerDay: 500,
    setupComplexity: "moderate",
    documentation: "https://www.bls.gov/developers/",
    isConfigured: false,
    features: [
      "Access occupational injury/illness data",
      "Get employment statistics by industry",
      "Retrieve wage data",
      "Compare injury rates across occupations",
      "Support epidemiological analysis",
    ],
  },

  "osha-api": {
    apiName: "OSHA Inspection Records API",
    provider: "Occupational Safety & Health Administration",
    category: "occupational",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "simple",
    documentation: "https://www.osha.gov/developers",
    isConfigured: false,
    features: [
      "Search OSHA inspection records",
      "Get violation history by employer",
      "Access safety standards",
      "Retrieve incident data",
      "Support workplace hazard assessment",
    ],
  },

  // ============ LEGAL & REGULATORY ============

  "eeoc-api": {
    apiName: "EEOC Charge Data API",
    provider: "Equal Employment Opportunity Commission",
    category: "legal",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "simple",
    documentation: "https://www.eeoc.gov/developers",
    isConfigured: false,
    features: [
      "Access EEOC charge statistics",
      "Get discrimination case data",
      "Retrieve ADA-related charges",
      "Support legal defensibility analysis",
      "Track employment law trends",
    ],
  },

  "courtlistener-api": {
    apiName: "CourtListener API",
    provider: "Free Law Project",
    category: "legal",
    freeLimit: "Unlimited (rate-limited)",
    rateLimitPerMinute: 6,
    rateLimitPerDay: 10000,
    setupComplexity: "moderate",
    documentation: "https://www.courtlistener.com/api/",
    isConfigured: false,
    features: [
      "Search 6+ million court opinions",
      "Find occupational health case law",
      "Access ADA/employment law precedents",
      "Retrieve case citations",
      "Support legal research and defensibility",
    ],
  },

  "google-scholar-api": {
    apiName: "Google Scholar (via SerpAPI)",
    provider: "SerpAPI",
    category: "research",
    freeLimit: "100 searches/month",
    rateLimitPerMinute: 1,
    rateLimitPerDay: 100,
    setupComplexity: "simple",
    documentation: "https://serpapi.com/docs/google-scholar-api",
    isConfigured: false,
    features: [
      "Search academic literature",
      "Find peer-reviewed studies",
      "Access citation data",
      "Support evidence-based recommendations",
      "Retrieve occupational health research",
    ],
  },

  // ============ NATURAL LANGUAGE PROCESSING ============

  "openai-gpt": {
    apiName: "OpenAI GPT API",
    provider: "OpenAI",
    category: "nlp",
    freeLimit: "$5 free credits (expires 3 months)",
    rateLimitPerMinute: 3,
    rateLimitPerDay: 200,
    setupComplexity: "simple",
    documentation: "https://platform.openai.com/docs/api-reference",
    isConfigured: false,
    features: [
      "Summarize medical records",
      "Generate clinical recommendations",
      "Extract key findings from documents",
      "Support case analysis and deliberation",
      "Enable intelligent report generation",
    ],
  },

  "huggingface-api": {
    apiName: "Hugging Face Inference API",
    provider: "Hugging Face",
    category: "nlp",
    freeLimit: "Unlimited (rate-limited)",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "moderate",
    documentation: "https://huggingface.co/docs/api-inference",
    isConfigured: false,
    features: [
      "Text classification and extraction",
      "Named entity recognition",
      "Sentiment analysis",
      "Support document processing",
      "Enable clinical NLP tasks",
    ],
  },

  "spacy-api": {
    apiName: "spaCy NLP Library",
    provider: "Explosion AI",
    category: "nlp",
    freeLimit: "Open-source (unlimited)",
    rateLimitPerMinute: 1000,
    rateLimitPerDay: 1000000,
    setupComplexity: "moderate",
    documentation: "https://spacy.io/",
    isConfigured: false,
    features: [
      "Medical named entity recognition",
      "Dependency parsing",
      "Text classification",
      "Support local NLP processing",
      "Enable privacy-preserving analysis",
    ],
  },

  // ============ DATA & ANALYTICS ============

  "census-api": {
    apiName: "U.S. Census Bureau API",
    provider: "U.S. Census Bureau",
    category: "data",
    freeLimit: "Unlimited (API key required)",
    rateLimitPerMinute: 120,
    rateLimitPerDay: 10000,
    setupComplexity: "simple",
    documentation: "https://api.census.gov/data.html",
    isConfigured: false,
    features: [
      "Access demographic data",
      "Get socioeconomic indicators",
      "Retrieve health disparities data",
      "Support SDoH analysis",
      "Enable equity-centered assessment",
    ],
  },

  "cdc-api": {
    apiName: "CDC Data API",
    provider: "Centers for Disease Control & Prevention",
    category: "data",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "moderate",
    documentation: "https://data.cdc.gov/",
    isConfigured: false,
    features: [
      "Access occupational health data",
      "Get disease surveillance data",
      "Retrieve injury statistics",
      "Support epidemiological analysis",
      "Enable population health assessment",
    ],
  },

  "worldbank-api": {
    apiName: "World Bank Open Data API",
    provider: "World Bank",
    category: "data",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "simple",
    documentation: "https://data.worldbank.org/developers/",
    isConfigured: false,
    features: [
      "Access global health indicators",
      "Get economic development data",
      "Retrieve social determinants data",
      "Support international comparisons",
      "Enable global health equity analysis",
    ],
  },

  "wikipedia-api": {
    apiName: "Wikipedia API",
    provider: "Wikimedia Foundation",
    category: "data",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 200,
    rateLimitPerDay: 100000,
    setupComplexity: "simple",
    documentation: "https://www.mediawiki.org/wiki/API/",
    isConfigured: false,
    features: [
      "Extract medical information",
      "Get disease descriptions",
      "Retrieve occupational information",
      "Support case context building",
      "Enable quick reference lookups",
    ],
  },

  // ============ SPECIALIZED OCCUPATIONAL HEALTH ============

  "niosh-api": {
    apiName: "NIOSH Pocket Guide API",
    provider: "National Institute for Occupational Safety & Health",
    category: "occupational",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "simple",
    documentation: "https://www.cdc.gov/niosh/npg/",
    isConfigured: false,
    features: [
      "Access chemical hazard data",
      "Get exposure limits (PEL, TLV)",
      "Retrieve health effect information",
      "Support occupational exposure assessment",
      "Enable hazard identification",
    ],
  },

  "chemspider-api": {
    apiName: "ChemSpider API",
    provider: "Royal Society of Chemistry",
    category: "occupational",
    freeLimit: "Unlimited (API key required)",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "moderate",
    documentation: "https://www.chemspider.com/",
    isConfigured: false,
    features: [
      "Search chemical hazard data",
      "Get toxicology information",
      "Retrieve safety data sheets",
      "Support occupational exposure analysis",
      "Enable chemical hazard assessment",
    ],
  },

  "pubchem-api": {
    apiName: "PubChem API",
    provider: "National Center for Biotechnology Information (NCBI)",
    category: "occupational",
    freeLimit: "Unlimited",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "simple",
    documentation: "https://pubchem.ncbi.nlm.nih.gov/docs/",
    isConfigured: false,
    features: [
      "Access chemical and toxicology data",
      "Get hazard classifications",
      "Retrieve safety information",
      "Support occupational chemical assessment",
      "Enable hazard database integration",
    ],
  },

  // ============ GEOLOCATION & ENVIRONMENTAL ============

  "openweather-api": {
    apiName: "OpenWeather API",
    provider: "OpenWeather",
    category: "data",
    freeLimit: "1,000 calls/day (free tier)",
    rateLimitPerMinute: 60,
    rateLimitPerDay: 1000,
    setupComplexity: "simple",
    documentation: "https://openweathermap.org/api",
    isConfigured: false,
    features: [
      "Get current weather conditions",
      "Access air quality data",
      "Retrieve environmental hazards",
      "Support occupational exposure assessment",
      "Enable environmental risk adjustment",
    ],
  },

  "epa-api": {
    apiName: "EPA Air Quality API",
    provider: "U.S. Environmental Protection Agency",
    category: "data",
    freeLimit: "Unlimited (API key required)",
    rateLimitPerMinute: 10,
    rateLimitPerDay: 10000,
    setupComplexity: "simple",
    documentation: "https://www.epa.gov/developers/",
    isConfigured: false,
    features: [
      "Access air quality data",
      "Get environmental hazard information",
      "Retrieve pollution levels",
      "Support environmental SDoH assessment",
      "Enable environmental health analysis",
    ],
  },
};

/**
 * API Configuration Manager
 */
export class APIConfigurationManager {
  private configs: Record<string, APIConfiguration> = { ...nuclearFuelAPIs };

  /**
   * Configure API with key
   */
  configureAPI(apiName: string, apiKey: string): boolean {
    if (this.configs[apiName]) {
      this.configs[apiName].apiKey = apiKey;
      this.configs[apiName].isConfigured = true;
      return true;
    }
    return false;
  }

  /**
   * Get configured APIs
   */
  getConfiguredAPIs(): APIConfiguration[] {
    return Object.values(this.configs).filter(api => api.isConfigured);
  }

  /**
   * Get unconfigured APIs
   */
  getUnconfiguredAPIs(): APIConfiguration[] {
    return Object.values(this.configs).filter(api => !api.isConfigured);
  }

  /**
   * Get APIs by category
   */
  getAPIsByCategory(category: string): APIConfiguration[] {
    return Object.values(this.configs).filter(api => api.category === category);
  }

  /**
   * Get all APIs
   */
  getAllAPIs(): APIConfiguration[] {
    return Object.values(this.configs);
  }
}

/**
 * Generate API Setup Guide
 */
export function generateAPISetupGuide(): string {
  let guide = "# NUCLEAR FUEL API SETUP GUIDE\n\n";
  guide += "## Free/Freemium APIs for SME Risk Intelligence Engine\n\n";

  const categories = ["medical", "occupational", "legal", "research", "data", "nlp"];

  categories.forEach(category => {
    const apis = Object.values(nuclearFuelAPIs).filter(api => api.category === category);
    if (apis.length > 0) {
      guide += `## ${category.toUpperCase()} APIs\n\n`;
      apis.forEach(api => {
        guide += `### ${api.apiName}\n`;
        guide += `- **Provider**: ${api.provider}\n`;
        guide += `- **Free Limit**: ${api.freeLimit}\n`;
        guide += `- **Rate Limits**: ${api.rateLimitPerMinute}/min, ${api.rateLimitPerDay}/day\n`;
        guide += `- **Setup Complexity**: ${api.setupComplexity}\n`;
        guide += `- **Documentation**: ${api.documentation}\n`;
        guide += `- **Features**:\n`;
        api.features.forEach(feature => {
          guide += `  - ${feature}\n`;
        });
        guide += "\n";
      });
    }
  });

  guide += "## Setup Instructions\n\n";
  guide += "1. Create free accounts for each API provider\n";
  guide += "2. Generate API keys from provider dashboards\n";
  guide += "3. Configure keys in the SME Risk Intelligence Engine\n";
  guide += "4. Test API connectivity\n";
  guide += "5. Monitor rate limits and usage\n\n";

  guide += `## Total APIs Available: ${Object.keys(nuclearFuelAPIs).length}\n`;
  guide += `## Total Free Tier Requests/Day: 1,000,000+\n`;

  return guide;
}

/**
 * Generate API Integration Status Report
 */
export function generateAPIStatusReport(manager: APIConfigurationManager): string {
  const configured = manager.getConfiguredAPIs();
  const unconfigured = manager.getUnconfiguredAPIs();

  let report = "# API INTEGRATION STATUS REPORT\n\n";
  report += `## Configured APIs: ${configured.length}/${Object.keys(nuclearFuelAPIs).length}\n\n`;

  if (configured.length > 0) {
    report += "### Configured\n";
    configured.forEach(api => {
      report += `- ✅ ${api.apiName} (${api.provider})\n`;
    });
    report += "\n";
  }

  if (unconfigured.length > 0) {
    report += "### Not Yet Configured\n";
    unconfigured.forEach(api => {
      report += `- ⏳ ${api.apiName} (${api.provider})\n`;
      report += `  Setup: ${api.setupComplexity} | Free Limit: ${api.freeLimit}\n`;
    });
  }

  return report;
}
