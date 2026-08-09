const ONET_BASE_URL = "https://api-v2.onetcenter.org";

export type OnetSearchMatch = {
  title: string;
  code: string;
  href?: string;
};

type OnetRecord = Record<string, unknown>;

function apiKey(): string | undefined {
  return process.env.ONET_API_KEY?.trim() || undefined;
}

export function getOnetStatus() {
  return {
    configured: Boolean(apiKey()),
    source: "O*NET Web Services API v2",
  };
}

async function getJson(path: string): Promise<unknown> {
  const key = apiKey();
  if (!key) throw new Error("ONET_API_KEY is not configured on the server.");

  const response = await fetch(`${ONET_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-API-Key": key,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`O*NET request failed (${response.status})${body ? `: ${body.slice(0, 180)}` : ""}`);
  }

  return response.json();
}

export async function searchOccupations(keyword: string): Promise<OnetSearchMatch[]> {
  const clean = keyword.trim();
  if (!clean) return [];

  const payload = await getJson(`/online/search?keyword=${encodeURIComponent(clean)}&start=1&end=15`) as OnetRecord;
  const occupations = Array.isArray(payload.occupation) ? payload.occupation as OnetRecord[] : [];

  return occupations
    .map((item) => ({
      title: String(item.title ?? ""),
      code: String(item.code ?? ""),
      href: typeof item.href === "string" ? item.href : undefined,
    }))
    .filter((item) => item.title && item.code);
}

function responseText(item: OnetRecord): string {
  const responses = Array.isArray(item.response) ? item.response as OnetRecord[] : [];
  const first = responses[0];
  const description = first && typeof first.description === "string" ? first.description : "";
  const name = first && typeof first.name === "string" ? first.name : "";
  return description || name;
}

function formatContext(item: OnetRecord): string {
  const name = String(item.name ?? item.element_name ?? "Work context");
  const response = responseText(item);
  return response ? `${name}: ${response}` : name;
}

function getOccupationFamily(socCode: string): string {
  const families: Record<string, string> = {
    "11": "Management",
    "13": "Business and Financial Operations",
    "15": "Computer and Mathematical",
    "17": "Architecture and Engineering",
    "19": "Life, Physical, and Social Science",
    "21": "Community and Social Service",
    "23": "Legal",
    "25": "Education, Training, and Library",
    "27": "Arts, Design, Entertainment, Sports, and Media",
    "29": "Healthcare Practitioners",
    "31": "Healthcare Support",
    "33": "Protective Service",
    "35": "Food Preparation and Serving",
    "37": "Building and Grounds Cleaning and Maintenance",
    "39": "Personal Care and Service",
    "41": "Sales and Related",
    "43": "Office and Administrative Support",
    "45": "Farming, Fishing, and Forestry",
    "47": "Construction and Extraction",
    "49": "Installation, Maintenance, and Repair",
    "51": "Production",
    "53": "Transportation and Material Moving",
    "55": "Military Specific",
  };
  return families[socCode.split("-")[0]] || "Other";
}

function classifyWorkContext(context: OnetRecord[]) {
  const physical: string[] = [];
  const environmental: string[] = [];
  const safety: string[] = [];

  for (const item of context) {
    const name = String(item.name ?? item.element_name ?? "").toLowerCase();
    const formatted = formatContext(item);

    if (/standing|walking|bending|kneeling|crouching|crawling|climbing|reaching|repetitive|hands|balance|physical proximity/.test(name)) {
      physical.push(formatted);
    }
    if (/outdoor|weather|noise|vibration|contaminant|hazardous condition|temperature|radiation|cramped|confined|lighting/.test(name)) {
      environmental.push(formatted);
    }
    if (/hazardous equipment|high places|disease|infection|protective equipment|responsible for others|vehicle|driving|consequence of error/.test(name)) {
      safety.push(formatted);
    }
  }

  return { physical, environmental, safety };
}

function inferSafetySensitive(title: string, family: string, safetyContext: string[]): boolean {
  const text = `${title} ${family} ${safetyContext.join(" ")}`.toLowerCase();
  return /firefighter|police|law enforcement|pilot|driver|operator|emergency|military|security|protective service|hazardous equipment|responsible for others|consequence of error/.test(text);
}

export async function getOccupationProfile(code: string) {
  const cleanCode = code.trim();
  if (!/^\d{2}-\d{4}(?:\.\d{2})?$/.test(cleanCode)) throw new Error("Invalid O*NET-SOC code.");

  const encoded = encodeURIComponent(cleanCode);
  const [overviewRaw, tasksRaw, abilitiesRaw, contextRaw] = await Promise.all([
    getJson(`/online/occupations/${encoded}/`),
    getJson(`/online/occupations/${encoded}/summary/tasks?start=1&end=12`),
    getJson(`/online/occupations/${encoded}/summary/abilities?start=1&end=8`),
    getJson(`/online/occupations/${encoded}/details/work_context?start=1&end=50&sort=context`),
  ]);

  const overview = overviewRaw as OnetRecord;
  const tasksPayload = tasksRaw as OnetRecord;
  const abilitiesPayload = abilitiesRaw as OnetRecord;
  const contextPayload = contextRaw as OnetRecord;

  const tasks = Array.isArray(tasksPayload.task) ? tasksPayload.task as OnetRecord[] : [];
  const abilities = Array.isArray(abilitiesPayload.element) ? abilitiesPayload.element as OnetRecord[] : [];
  const context = Array.isArray(contextPayload.element) ? contextPayload.element as OnetRecord[] : [];

  const title = String(overview.title ?? cleanCode);
  const category = getOccupationFamily(cleanCode);
  const classified = classifyWorkContext(context);

  const essentialFunctions = tasks
    .map((task) => String(task.title ?? "").trim())
    .filter(Boolean);

  const cognitiveRequirements = abilities
    .map((ability) => {
      const name = String(ability.name ?? "").trim();
      const description = String(ability.description ?? "").trim();
      return description ? `${name}: ${description}` : name;
    })
    .filter(Boolean);

  return {
    socCode: cleanCode,
    title,
    category,
    safetySensitive: inferSafetySensitive(title, category, classified.safety),
    physicalDemands: classified.physical,
    essentialFunctions,
    cognitiveRequirements,
    environmentalExposures: classified.environmental,
    relevantStandards: [],
    onetUrl: `https://www.onetonline.org/link/summary/${encodeURIComponent(cleanCode)}`,
    blsUrl: "https://www.bls.gov/ooh/",
    source: "live-onet",
    description: typeof overview.description === "string" ? overview.description : "",
    safetyContext: classified.safety,
    updated: overview.updated ?? null,
  };
}
