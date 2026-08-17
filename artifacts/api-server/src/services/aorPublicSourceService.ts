import { fetchJson, isoNow, record, text } from "../lib/upstream";

export type AorCommandId =
  | "northcom"
  | "southcom"
  | "eucom"
  | "africom"
  | "centcom"
  | "indopacom";

type Scope = {
  label: string;
  terms: string[];
  bbox?: [number, number, number, number];
  exclude?: string[];
};

const SCOPES: Record<AorCommandId, Scope> = {
  northcom: {
    label: "USNORTHCOM",
    terms: ["United States", "U.S.", "USA", "Alaska", "Canada", "Mexico", "Greenland", "Bahamas", "Puerto Rico", "California"],
    bbox: [-170, 23, -50, 85],
  },
  southcom: {
    label: "USSOUTHCOM",
    terms: ["South America", "Central America", "Caribbean", "Argentina", "Belize", "Bolivia", "Brazil", "Chile", "Colombia", "Costa Rica", "Cuba", "Dominican Republic", "Ecuador", "El Salvador", "Guatemala", "Guyana", "Haiti", "Honduras", "Jamaica", "Nicaragua", "Panama", "Paraguay", "Peru", "Suriname", "Trinidad", "Uruguay", "Venezuela"],
    bbox: [-120, -60, -25, 23],
  },
  eucom: {
    label: "USEUCOM",
    terms: ["Europe", "European", "Albania", "Armenia", "Austria", "Azerbaijan", "Belarus", "Belgium", "Bosnia", "Bulgaria", "Croatia", "Cyprus", "Czech", "Denmark", "Estonia", "Finland", "France", "Georgia", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo", "Latvia", "Lithuania", "Moldova", "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Türkiye", "Turkey", "Ukraine", "United Kingdom"],
    bbox: [-30, 34, 60, 82],
  },
  africom: {
    label: "USAFRICOM",
    terms: ["Africa", "African", "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo", "DRC", "Djibouti", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Ivory Coast", "Côte d'Ivoire", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Senegal", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe", "Sahel"],
    bbox: [-30, -40, 60, 38],
    exclude: ["Egypt"],
  },
  centcom: {
    label: "USCENTCOM",
    terms: ["Middle East", "Central Asia", "Afghanistan", "Bahrain", "Egypt", "Iran", "Iraq", "Israel", "Jordan", "Kazakhstan", "Kuwait", "Kyrgyzstan", "Lebanon", "Oman", "Pakistan", "Qatar", "Saudi Arabia", "Syria", "Tajikistan", "Turkmenistan", "United Arab Emirates", "UAE", "Uzbekistan", "Yemen", "Gulf"],
    bbox: [24, 10, 85, 55],
  },
  indopacom: {
    label: "USPACOM",
    terms: ["Indo-Pacific", "Pacific", "Hawaii", "Australia", "Bangladesh", "Bhutan", "Brunei", "Cambodia", "China", "Taiwan", "Fiji", "India", "Indonesia", "Japan", "Kiribati", "Laos", "Malaysia", "Maldives", "Marshall Islands", "Micronesia", "Mongolia", "Myanmar", "Burma", "Nauru", "Nepal", "New Zealand", "North Korea", "Palau", "Papua New Guinea", "Philippines", "Samoa", "Singapore", "Solomon Islands", "South Korea", "Sri Lanka", "Thailand", "Timor-Leste", "Tonga", "Tuvalu", "Vanuatu", "Vietnam"],
  },
};

export type WhoOutbreakItem = {
  id: string;
  title: string;
  publishedAt: string;
  summary: string;
  url: string;
  matchedArea: string;
  provider: "WHO Disease Outbreak News";
};

export type GdacsEventItem = {
  id: string;
  title: string;
  eventType: string;
  alertLevel: string;
  country: string;
  fromDate: string;
  toDate: string;
  url: string;
  latitude: number | null;
  longitude: number | null;
  provider: "GDACS";
};

export type UsgsEarthquakeItem = {
  id: string;
  title: string;
  place: string;
  magnitude: number | null;
  occurredAt: string;
  updatedAt: string;
  url: string;
  tsunami: boolean;
  latitude: number | null;
  longitude: number | null;
  depthKm: number | null;
  provider: "USGS Earthquake Catalog";
};

export type PublicSourceHealth = {
  provider: "WHO Disease Outbreak News" | "GDACS" | "USGS Earthquake Catalog";
  ok: boolean;
  itemCount: number;
  error?: string;
};

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function hasTerm(haystack: string, term: string) {
  const source = ` ${normalize(haystack).replace(/[^a-z0-9]+/g, " ")} `;
  const needle = ` ${normalize(term).replace(/[^a-z0-9]+/g, " ")} `;
  return source.includes(needle);
}

function isExcluded(scope: Scope, haystack: string) {
  return (scope.exclude ?? []).some((term) => hasTerm(haystack, term));
}

function scopeMatch(scope: Scope, haystack: string) {
  if (isExcluded(scope, haystack)) return false;
  return scope.terms.some((term) => hasTerm(haystack, term));
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function dateString(value: unknown) {
  const raw = text(value);
  if (!raw) return "";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.valueOf()) ? raw : parsed.toISOString();
}

function numberValue(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstCoordinate(value: unknown): [number, number] | null {
  if (!Array.isArray(value)) return null;
  if (value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) {
    return [Number(value[0]), Number(value[1])];
  }
  for (const child of value) {
    const point = firstCoordinate(child);
    if (point) return point;
  }
  return null;
}

function pointInScope(scope: Scope, longitude: number | null, latitude: number | null) {
  if (!scope.bbox || longitude === null || latitude === null) return false;
  const [minLon, minLat, maxLon, maxLat] = scope.bbox;
  return longitude >= minLon && longitude <= maxLon && latitude >= minLat && latitude <= maxLat;
}

function whoUrl(item: Record<string, unknown>) {
  const donId = text(item.DonId);
  if (donId) return `https://www.who.int/emergencies/disease-outbreak-news/item/${encodeURIComponent(donId)}`;
  const path = text(item.ItemDefaultUrl);
  return path.startsWith("http")
    ? path
    : `https://www.who.int${path.startsWith("/") ? path : `/${path || "emergencies/disease-outbreak-news"}`}`;
}

function arrayFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = record(payload);
  for (const key of ["features", "events", "items", "data", "value", "results"]) {
    const candidate = root[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export async function getWhoOutbreaks(command: AorCommandId, limit = 12): Promise<WhoOutbreakItem[]> {
  const scope = SCOPES[command];
  const url = new URL("https://www.who.int/api/news/diseaseoutbreaknews");
  url.searchParams.set("$orderby", "PublicationDateAndTime desc");
  url.searchParams.set("$top", "250");
  url.searchParams.set("$select", "Id,PublicationDateAndTime,Title,Summary,Overview,Assessment,ItemDefaultUrl,DonId");
  const payload = record(await fetchJson("WHO Disease Outbreak News", url, {}, 12_000));
  const rows = Array.isArray(payload.value) ? payload.value : [];
  return rows
    .map((raw) => {
      const item = record(raw);
      const title = text(item.Title) || "WHO Disease Outbreak News";
      const summary = stripHtml(text(item.Summary) || text(item.Overview) || text(item.Assessment)).slice(0, 700);
      const searchText = `${title} ${summary}`;
      const matchedArea = scope.terms.find((term) => hasTerm(searchText, term)) ?? "";
      return {
        id: text(item.DonId) || text(item.Id) || title,
        title,
        publishedAt: dateString(item.PublicationDateAndTime),
        summary,
        url: whoUrl(item),
        matchedArea,
        provider: "WHO Disease Outbreak News" as const,
        relevant: Boolean(matchedArea) && !isExcluded(scope, searchText),
      };
    })
    .filter((item) => item.relevant)
    .slice(0, Math.max(1, Math.min(limit, 30)))
    .map(({ relevant: _relevant, ...item }) => item);
}

export async function getGdacsEvents(command: AorCommandId, limit = 12): Promise<GdacsEventItem[]> {
  const scope = SCOPES[command];
  // GDACS publishes this compact generated application feed from the same official
  // data system. It is more reliable for unattended reads than the homepage map
  // action, whose required query contract has changed over time.
  const url = new URL("https://www.gdacs.org/contentdata/xml/gdacs_app_feed.json");
  const payload = await fetchJson("GDACS", url, {}, 12_000);
  const rows = arrayFromPayload(payload);
  const seen = new Set<string>();
  const items: GdacsEventItem[] = [];

  for (const raw of rows) {
    const feature = record(raw);
    const propertiesRecord = record(feature.properties);
    const properties = Object.keys(propertiesRecord).length ? propertiesRecord : feature;
    const geometry = record(feature.geometry);
    const directCoordinate = firstCoordinate(geometry.coordinates);
    const longitude = directCoordinate?.[0] ?? numberValue(properties.longitude ?? properties.lon ?? properties.lng);
    const latitude = directCoordinate?.[1] ?? numberValue(properties.latitude ?? properties.lat);
    const eventType = text(properties.eventtype) || text(properties.eventType) || text(properties.type) || text(properties.event_type) || "Disaster";
    const eventId = text(properties.eventid) || text(properties.eventId) || text(properties.id) || text(feature.id) || text(properties.event_id);
    const title = text(properties.name) || text(properties.title) || text(properties.eventname) || text(properties.description) || `${eventType} event`;
    const country = text(properties.country) || text(properties.countryname) || text(properties.countryName) || text(properties.iso3) || text(properties.country_name);
    const searchable = `${title} ${country} ${text(properties.htmldescription)} ${text(properties.description)} ${text(properties.location)}`;

    if (isExcluded(scope, searchable)) continue;
    if (!scopeMatch(scope, searchable) && !pointInScope(scope, longitude, latitude)) continue;

    const id = `${eventType}-${eventId || title}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const episodeId = text(properties.episodeid) || text(properties.episodeId) || text(properties.episode_id);
    const explicitUrl = text(properties.url) || text(properties.link) || text(properties.weburl) || text(properties.webUrl);
    const fallbackUrl = eventId
      ? `https://www.gdacs.org/resources.aspx?eventid=${encodeURIComponent(eventId)}&eventtype=${encodeURIComponent(eventType)}${episodeId ? `&episodeid=${encodeURIComponent(episodeId)}` : ""}`
      : "https://www.gdacs.org/";

    items.push({
      id,
      title,
      eventType,
      alertLevel: text(properties.alertlevel) || text(properties.alertLevel) || text(properties.alert) || text(properties.alert_level) || "",
      country,
      fromDate: dateString(properties.fromdate ?? properties.fromDate ?? properties.date ?? properties.startdate ?? properties.startDate),
      toDate: dateString(properties.todate ?? properties.toDate ?? properties.enddate ?? properties.endDate),
      url: explicitUrl || fallbackUrl,
      latitude,
      longitude,
      provider: "GDACS",
    });
  }

  return items
    .sort((a, b) => (b.fromDate || b.toDate).localeCompare(a.fromDate || a.toDate))
    .slice(0, Math.max(1, Math.min(limit, 30)));
}

export async function getUsgsEarthquakes(command: AorCommandId, limit = 12): Promise<UsgsEarthquakeItem[]> {
  const scope = SCOPES[command];
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const url = new URL("https://earthquake.usgs.gov/fdsnws/event/1/query");
  url.searchParams.set("format", "geojson");
  url.searchParams.set("starttime", start);
  url.searchParams.set("minmagnitude", "4.0");
  url.searchParams.set("orderby", "time");
  url.searchParams.set("limit", "400");
  const payload = record(await fetchJson("USGS Earthquake Catalog", url, {}, 10_000));
  const features = Array.isArray(payload.features) ? payload.features : [];
  return features
    .map((raw) => {
      const feature = record(raw);
      const properties = record(feature.properties);
      const geometry = record(feature.geometry);
      const coordinate = firstCoordinate(geometry.coordinates);
      const longitude = coordinate?.[0] ?? null;
      const latitude = coordinate?.[1] ?? null;
      const depthKm = Array.isArray(geometry.coordinates) ? numberValue(geometry.coordinates[2]) : null;
      const place = text(properties.place);
      const title = text(properties.title) || (place ? `Earthquake near ${place}` : "USGS earthquake");
      const searchable = `${title} ${place}`;
      return {
        id: text(feature.id) || title,
        title,
        place,
        magnitude: numberValue(properties.mag),
        occurredAt: Number.isFinite(Number(properties.time)) ? new Date(Number(properties.time)).toISOString() : "",
        updatedAt: Number.isFinite(Number(properties.updated)) ? new Date(Number(properties.updated)).toISOString() : "",
        url: text(properties.url) || "https://earthquake.usgs.gov/earthquakes/map/",
        tsunami: Number(properties.tsunami) === 1,
        latitude,
        longitude,
        depthKm,
        provider: "USGS Earthquake Catalog" as const,
        relevant: !isExcluded(scope, searchable) && scopeMatch(scope, searchable),
      };
    })
    .filter((item) => item.relevant)
    .slice(0, Math.max(1, Math.min(limit, 30)))
    .map(({ relevant: _relevant, ...item }) => item);
}

export async function getAorPublicSources(command: AorCommandId, limit = 12) {
  const [whoResult, gdacsResult, usgsResult] = await Promise.allSettled([
    getWhoOutbreaks(command, limit),
    getGdacsEvents(command, limit),
    getUsgsEarthquakes(command, limit),
  ]);

  const health: PublicSourceHealth[] = [
    {
      provider: "WHO Disease Outbreak News",
      ok: whoResult.status === "fulfilled",
      itemCount: whoResult.status === "fulfilled" ? whoResult.value.length : 0,
      ...(whoResult.status === "rejected" ? { error: whoResult.reason instanceof Error ? whoResult.reason.message : "WHO source unavailable." } : {}),
    },
    {
      provider: "GDACS",
      ok: gdacsResult.status === "fulfilled",
      itemCount: gdacsResult.status === "fulfilled" ? gdacsResult.value.length : 0,
      ...(gdacsResult.status === "rejected" ? { error: gdacsResult.reason instanceof Error ? gdacsResult.reason.message : "GDACS source unavailable." } : {}),
    },
    {
      provider: "USGS Earthquake Catalog",
      ok: usgsResult.status === "fulfilled",
      itemCount: usgsResult.status === "fulfilled" ? usgsResult.value.length : 0,
      ...(usgsResult.status === "rejected" ? { error: usgsResult.reason instanceof Error ? usgsResult.reason.message : "USGS source unavailable." } : {}),
    },
  ];

  return {
    source: "WHO Disease Outbreak News + GDACS + USGS Earthquake Catalog",
    retrievedAt: isoNow(),
    command,
    commandLabel: SCOPES[command].label,
    partial: health.some((provider) => !provider.ok),
    sourceHealth: health,
    outbreaks: whoResult.status === "fulfilled" ? whoResult.value : [],
    disasters: gdacsResult.status === "fulfilled" ? gdacsResult.value : [],
    earthquakes: usgsResult.status === "fulfilled" ? usgsResult.value : [],
  };
}

export function isAorCommand(value: string): value is AorCommandId {
  return value in SCOPES;
}
