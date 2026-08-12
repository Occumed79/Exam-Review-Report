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
  headquarters: string;
  geographicScope: string;
  countriesAreas: string[];
  healthCountries: Array<{ name: string; iso3: string }>;
  newsQuery: string;
  policyQuery: string;
  mapPath: string;
  mapLabel: { x: number; y: number };
  source: { label: string; url: string };
};

// Geographic descriptions follow the commands' public AOR pages. The short
// country/area lists are orientation labels, not an attempt to redraw legal AOR
// boundaries. The Unified Command Plan remains the controlling assignment.
export const COMBATANT_COMMANDS: CombatantCommand[] = [
  {
    id: "northcom",
    name: "United States Northern Command",
    abbreviation: "USNORTHCOM",
    headquarters: "Peterson Space Force Base, Colorado",
    geographicScope:
      "The continental United States, Alaska, Canada, Mexico, The Bahamas, and surrounding approaches.",
    countriesAreas: [
      "United States",
      "Canada",
      "Mexico",
      "The Bahamas",
      "Gulf of Mexico",
      "Straits of Florida",
    ],
    healthCountries: [
      { name: "United States", iso3: "USA" },
      { name: "Canada", iso3: "CAN" },
      { name: "Mexico", iso3: "MEX" },
    ],
    newsQuery:
      '(disaster OR earthquake OR wildfire OR hurricane OR outbreak OR "public health" OR infrastructure OR transportation OR security) AND (United States OR Canada OR Mexico OR Bahamas)',
    policyQuery:
      "homeland defense disaster response deployment occupational health NORTHCOM",
    mapPath: "M40 72L254 55 337 109 300 205 202 230 119 190 57 152Z",
    mapLabel: { x: 178, y: 133 },
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
      "Central America, South America, and the Caribbean, excluding U.S. commonwealths, territories, and possessions.",
    countriesAreas: [
      "Central America",
      "South America",
      "Caribbean Sea",
      "Caribbean nations",
      "Adjacent Atlantic and Pacific waters",
    ],
    healthCountries: [
      { name: "Brazil", iso3: "BRA" },
      { name: "Colombia", iso3: "COL" },
      { name: "Panama", iso3: "PAN" },
    ],
    newsQuery:
      '(disaster OR earthquake OR flood OR hurricane OR outbreak OR "public health" OR disruption OR infrastructure OR conflict) AND ("South America" OR "Central America" OR Caribbean)',
    policyQuery:
      "SOUTHCOM Latin America Caribbean disaster response deployment health security",
    mapPath: "M211 234L302 211 356 271 334 438 279 500 238 405 247 320Z",
    mapLabel: { x: 286, y: 330 },
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
      "Europe, portions of Asia and the Middle East, the Arctic and Atlantic oceans, and associated approaches assigned by the Unified Command Plan.",
    countriesAreas: [
      "Europe",
      "Türkiye",
      "Russia",
      "Greenland",
      "Arctic Ocean",
      "North Atlantic",
    ],
    healthCountries: [
      { name: "Germany", iso3: "DEU" },
      { name: "Poland", iso3: "POL" },
      { name: "Türkiye", iso3: "TUR" },
    ],
    newsQuery:
      '(disaster OR flood OR wildfire OR outbreak OR "public health" OR infrastructure OR transportation OR conflict OR security) AND (Europe OR European OR Ukraine)',
    policyQuery: "EUCOM Europe deployment security occupational health defense",
    mapPath: "M443 62L615 51 665 117 628 186 548 191 480 151 417 122Z",
    mapLabel: { x: 535, y: 119 },
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
      "African continent except Egypt",
      "African island nations",
      "Adjacent Atlantic and Indian Ocean waters",
    ],
    healthCountries: [
      { name: "Kenya", iso3: "KEN" },
      { name: "Nigeria", iso3: "NGA" },
      { name: "South Africa", iso3: "ZAF" },
    ],
    newsQuery:
      '(outbreak OR epidemic OR flood OR drought OR cyclone OR disaster OR "public health" OR infrastructure OR conflict OR security) AND (Africa OR African)',
    policyQuery: "AFRICOM Africa deployment health security defense",
    mapPath: "M437 190L585 182 651 250 598 422 515 469 445 373 408 255Z",
    mapLabel: { x: 525, y: 294 },
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
      "The central region connecting Europe, Africa, and Asia, including Egypt, the Levant, Arabian Peninsula, Iraq, Iran, Afghanistan, Pakistan, and Central Asia.",
    countriesAreas: [
      "Egypt",
      "Levant",
      "Arabian Peninsula",
      "Iraq and Iran",
      "Afghanistan and Pakistan",
      "Central Asia",
    ],
    healthCountries: [
      { name: "Egypt", iso3: "EGY" },
      { name: "Jordan", iso3: "JOR" },
      { name: "Pakistan", iso3: "PAK" },
    ],
    newsQuery:
      '(outbreak OR flood OR earthquake OR disaster OR "public health" OR infrastructure OR transportation OR conflict OR security) AND ("Middle East" OR "Central Asia" OR Pakistan OR Afghanistan)',
    policyQuery:
      "CENTCOM Middle East Central Asia deployment health security defense",
    mapPath: "M588 165L733 152 785 232 722 326 633 287 577 224Z",
    mapLabel: { x: 680, y: 224 },
    source: {
      label: "USCENTCOM — Area of Responsibility",
      url: "https://www.centcom.mil/AREA-OF-RESPONSIBILITY/",
    },
  },
  {
    id: "indopacom",
    name: "United States Indo-Pacific Command",
    abbreviation: "USINDOPACOM",
    headquarters: "Camp H. M. Smith, Hawaii",
    geographicScope:
      "The Indo-Pacific from the U.S. West Coast to India, and from the Arctic to Antarctica, as assigned by the Unified Command Plan.",
    countriesAreas: [
      "India",
      "South Asia",
      "Southeast Asia",
      "East Asia",
      "Australia and New Zealand",
      "Pacific island nations",
      "Indian and Pacific oceans",
    ],
    healthCountries: [
      { name: "India", iso3: "IND" },
      { name: "Japan", iso3: "JPN" },
      { name: "Philippines", iso3: "PHL" },
    ],
    newsQuery:
      '(typhoon OR cyclone OR earthquake OR tsunami OR outbreak OR "public health" OR infrastructure OR transportation OR conflict OR security) AND ("Indo-Pacific" OR Asia OR Pacific)',
    policyQuery: "INDOPACOM Indo-Pacific deployment health security defense",
    mapPath: "M704 59L963 72 977 335 894 449 764 388 703 306 776 229 715 159Z",
    mapLabel: { x: 854, y: 172 },
    source: {
      label: "USINDOPACOM — About",
      url: "https://www.pacom.mil/About-USINDOPACOM/",
    },
  },
];

export const COMBATANT_COMMAND_BY_ID = new Map(
  COMBATANT_COMMANDS.map((command) => [command.id, command]),
);
