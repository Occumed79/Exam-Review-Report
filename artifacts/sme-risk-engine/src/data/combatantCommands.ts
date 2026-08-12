export type CombatantCommandId =
  | "northcom"
  | "southcom"
  | "eucom"
  | "africom"
  | "centcom"
  | "indopacom";

export type CombatantCommand = {
  id: CombatantCommandId;
  name: string;
  abbreviation: string;
  aliases?: string[];
  headquarters: string;
  geographicScope: string;
  countriesAreas: string[];
  countryIso2: string[];
  healthCountries: Array<{ name: string; iso3: string }>;
  newsQuery: string;
  policyQuery: string;
  mapView: { center: [number, number]; zoom: number };
  source: { label: string; url: string };
};

// Public country coverage is used only to orient the interactive map. Maritime
// boundaries and the controlling assignment remain defined by the Unified
// Command Plan and the commands' official public AOR descriptions.
export const COMBATANT_COMMANDS: CombatantCommand[] = [
  {
    id: "northcom",
    name: "United States Northern Command",
    abbreviation: "USNORTHCOM",
    headquarters: "Peterson Space Force Base, Colorado",
    geographicScope:
      "The continental United States, Alaska, Canada, Mexico, Greenland, The Bahamas, and surrounding approaches assigned by the Unified Command Plan.",
    countriesAreas: [
      "United States",
      "Canada",
      "Mexico",
      "Greenland",
      "The Bahamas",
      "Gulf of Mexico",
      "Straits of Florida",
    ],
    countryIso2: ["US", "CA", "MX", "GL", "BS", "PR", "VI"],
    healthCountries: [
      { name: "United States", iso3: "USA" },
      { name: "Canada", iso3: "CAN" },
      { name: "Mexico", iso3: "MEX" },
    ],
    newsQuery:
      '(disaster OR earthquake OR wildfire OR hurricane OR outbreak OR "public health" OR infrastructure OR transportation OR security) AND ("United States" OR Canada OR Mexico OR Bahamas OR Greenland)',
    policyQuery:
      "homeland defense disaster response deployment occupational health NORTHCOM",
    mapView: { center: [-101, 46], zoom: 1.55 },
    source: {
      label: "USNORTHCOM — About the Command",
      url: "https://www.northcom.mil/About-USNORTHCOM/",
    },
  },
  {
    id: "southcom",
    name: "United States Southern Command",
    abbreviation: "USSOUTHCOM",
    headquarters: "Doral, Florida",
    geographicScope:
      "Central America, South America, and the Caribbean, excluding U.S. commonwealths, territories, and possessions assigned elsewhere.",
    countriesAreas: [
      "Central America",
      "South America",
      "Caribbean nations",
      "Adjacent Atlantic and Pacific waters",
    ],
    countryIso2: [
      "AG", "AR", "BB", "BZ", "BO", "BR", "CL", "CO", "CR", "CU", "DM",
      "DO", "EC", "SV", "GD", "GT", "GY", "HT", "HN", "JM", "NI", "PA",
      "PY", "PE", "KN", "LC", "VC", "SR", "TT", "UY", "VE",
    ],
    healthCountries: [
      { name: "Brazil", iso3: "BRA" },
      { name: "Colombia", iso3: "COL" },
      { name: "Panama", iso3: "PAN" },
    ],
    newsQuery:
      '(disaster OR earthquake OR flood OR hurricane OR outbreak OR "public health" OR disruption OR infrastructure OR conflict) AND ("South America" OR "Central America" OR Caribbean OR Brazil OR Colombia)',
    policyQuery:
      "SOUTHCOM Latin America Caribbean disaster response deployment health security",
    mapView: { center: [-67, -9], zoom: 1.7 },
    source: {
      label: "USSOUTHCOM — Area of Responsibility",
      url: "https://www.southcom.mil/About/Area-of-Responsibility/",
    },
  },
  {
    id: "eucom",
    name: "United States European Command",
    abbreviation: "USEUCOM",
    headquarters: "Patch Barracks, Stuttgart, Germany",
    geographicScope:
      "Europe and assigned portions of Eurasia, the Arctic, Atlantic, and adjoining approaches under the Unified Command Plan.",
    countriesAreas: [
      "Europe",
      "Türkiye",
      "Russia",
      "Caucasus",
      "Arctic Ocean",
      "North Atlantic",
    ],
    countryIso2: [
      "AL", "AD", "AM", "AT", "AZ", "BY", "BE", "BA", "BG", "HR", "CY",
      "CZ", "DK", "EE", "FI", "FR", "GE", "DE", "GR", "HU", "IS", "IE",
      "IT", "XK", "LV", "LI", "LT", "LU", "MT", "MD", "MC", "ME", "NL",
      "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES",
      "SE", "CH", "TR", "UA", "GB", "VA",
    ],
    healthCountries: [
      { name: "Germany", iso3: "DEU" },
      { name: "Poland", iso3: "POL" },
      { name: "Türkiye", iso3: "TUR" },
    ],
    newsQuery:
      '(disaster OR flood OR wildfire OR outbreak OR "public health" OR infrastructure OR transportation OR conflict OR security) AND (Europe OR European OR Ukraine OR Russia OR Türkiye)',
    policyQuery: "EUCOM Europe deployment security occupational health defense",
    mapView: { center: [21, 52], zoom: 2.15 },
    source: {
      label: "USEUCOM — Area of Focus",
      url: "https://www.eucom.mil/about-the-command/area-of-focus",
    },
  },
  {
    id: "africom",
    name: "United States Africa Command",
    abbreviation: "USAFRICOM",
    headquarters: "Kelley Barracks, Stuttgart, Germany",
    geographicScope:
      "The African continent, its island nations, and surrounding waters, except Egypt.",
    countriesAreas: [
      "53 African states",
      "African island nations",
      "Adjacent Atlantic and Indian Ocean waters",
      "Egypt assigned to USCENTCOM",
    ],
    countryIso2: [
      "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM",
      "CG", "CD", "CI", "DJ", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH",
      "GN", "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU",
      "MA", "MZ", "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO",
      "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "ZM", "ZW",
    ],
    healthCountries: [
      { name: "Kenya", iso3: "KEN" },
      { name: "Nigeria", iso3: "NGA" },
      { name: "South Africa", iso3: "ZAF" },
    ],
    newsQuery:
      '(outbreak OR epidemic OR flood OR drought OR cyclone OR disaster OR "public health" OR infrastructure OR conflict OR security) AND (Africa OR African OR Sahel)',
    policyQuery: "AFRICOM Africa deployment health security defense",
    mapView: { center: [19, 3], zoom: 1.8 },
    source: {
      label: "USAFRICOM — About the Command",
      url: "https://www.africom.mil/about-the-command",
    },
  },
  {
    id: "centcom",
    name: "United States Central Command",
    abbreviation: "USCENTCOM",
    headquarters: "MacDill Air Force Base, Tampa, Florida",
    geographicScope:
      "Twenty-one nations spanning the Middle East and Central and South Asia, from Egypt through the Arabian Peninsula to Pakistan and Central Asia.",
    countriesAreas: [
      "Egypt",
      "Levant",
      "Arabian Peninsula",
      "Iraq and Iran",
      "Afghanistan and Pakistan",
      "Central Asia",
    ],
    countryIso2: [
      "AF", "BH", "EG", "IR", "IQ", "IL", "JO", "KZ", "KW", "KG", "LB",
      "OM", "PK", "QA", "SA", "SY", "TJ", "TM", "AE", "UZ", "YE",
    ],
    healthCountries: [
      { name: "Egypt", iso3: "EGY" },
      { name: "Jordan", iso3: "JOR" },
      { name: "Pakistan", iso3: "PAK" },
    ],
    newsQuery:
      '(outbreak OR flood OR earthquake OR disaster OR "public health" OR healthcare OR infrastructure OR transportation OR conflict OR attack OR security) AND ("Middle East" OR "Central Asia" OR Pakistan OR Afghanistan OR Iran OR Iraq OR Israel OR Jordan OR Gulf)',
    policyQuery:
      "CENTCOM Middle East Central Asia deployment health security defense",
    mapView: { center: [53, 30], zoom: 2.25 },
    source: {
      label: "USCENTCOM — Area of Responsibility",
      url: "https://www.centcom.mil/AREA-OF-RESPONSIBILITY/",
    },
  },
  {
    id: "indopacom",
    name: "United States Pacific Command",
    abbreviation: "USPACOM",
    aliases: ["USINDOPACOM", "INDOPACOM"],
    headquarters: "Camp H. M. Smith, Hawaii",
    geographicScope:
      "The Indo-Pacific from the waters off the U.S. West Coast to India's western border, and from the Arctic to Antarctica, as assigned by the Unified Command Plan.",
    countriesAreas: [
      "India and South Asia",
      "Southeast Asia",
      "East Asia",
      "Australia and New Zealand",
      "Pacific island nations",
      "Indian and Pacific oceans",
    ],
    countryIso2: [
      "AU", "BD", "BT", "BN", "KH", "CN", "TW", "FJ", "IN", "ID", "JP",
      "KI", "LA", "MY", "MV", "MH", "FM", "MN", "MM", "NR", "NP", "NZ",
      "KP", "PW", "PG", "PH", "WS", "SG", "SB", "KR", "LK", "TH", "TL",
      "TO", "TV", "VU", "VN",
    ],
    healthCountries: [
      { name: "India", iso3: "IND" },
      { name: "Japan", iso3: "JPN" },
      { name: "Philippines", iso3: "PHL" },
    ],
    newsQuery:
      '(typhoon OR cyclone OR earthquake OR tsunami OR outbreak OR "public health" OR infrastructure OR transportation OR conflict OR attack OR security) AND ("Indo-Pacific" OR Pacific OR India OR Japan OR Philippines OR China OR Korea)',
    policyQuery: "Pacific Command Indo-Pacific deployment health security defense",
    mapView: { center: [142, 13], zoom: 1.45 },
    source: {
      label: "USPACOM — About",
      url: "https://www.pacom.mil/About-USP​ACOM/".replace("​", ""),
    },
  },
];

export const COMBATANT_COMMAND_BY_ID = new Map(
  COMBATANT_COMMANDS.map((command) => [command.id, command]),
);

export const COMBATANT_COMMAND_BY_COUNTRY = new Map(
  COMBATANT_COMMANDS.flatMap((command) =>
    command.countryIso2.map((iso2) => [iso2, command] as const),
  ),
);
