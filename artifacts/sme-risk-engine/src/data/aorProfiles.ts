import profileIndex1 from './aor-profile-index-1';
import profileIndex2 from './aor-profile-index-2';
import profileIndex3 from './aor-profile-index-3';
import { CLIMATES, EVACUATION, MEDICAL, REGIONS, SECURITY, TIERS, TRAVEL, WATCH } from './aor-profile-text';

export type AorCountryProfile = {
  iso2: string;
  name: string;
  region: string;
  climate: string;
  medical: string;
  security: string;
  disease: string;
  evacuation: string;
  watchItems: string[];
  medicalTier: string;
  mapFill: string;
  mapHover: string;
};

const NAME_OVERRIDES: Record<string, string> = {
  BO: 'Bolivia', BN: 'Brunei', CD: 'Democratic Republic of the Congo', CG: 'Republic of the Congo',
  CI: 'Côte d’Ivoire', CZ: 'Czechia', IR: 'Iran', KP: 'North Korea', KR: 'South Korea',
  LA: 'Laos', MD: 'Moldova', PS: 'Palestine', RU: 'Russia', SY: 'Syria', TZ: 'Tanzania',
  TR: 'Türkiye', TW: 'Taiwan', VA: 'Vatican City', VE: 'Venezuela', VN: 'Vietnam', XK: 'Kosovo',
};

const displayNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

function countryName(iso2: string) {
  return NAME_OVERRIDES[iso2] ?? displayNames?.of(iso2) ?? iso2;
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g] = [c, x];
  else if (h < 120) [r, g] = [x, c];
  else if (h < 180) [g, b] = [c, x];
  else if (h < 240) [g, b] = [x, c];
  else if (h < 300) [r, b] = [x, c];
  else [r, b] = [c, x];
  return `#${[r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function colorFor(index: number, hover = false) {
  const hue = (index * 137.508 + 17) % 360;
  const saturation = 58 + ((index * 7) % 20);
  const lightness = hover ? 68 : 48 + ((index * 11) % 13);
  return hslToHex(hue, saturation, lightness);
}

const packed = [profileIndex1, profileIndex2, profileIndex3].join(';');

export const AOR_PROFILES: AorCountryProfile[] = packed
  .split(';')
  .filter(Boolean)
  .map((entry, index) => {
    const [iso2, region, climate, medical, security, disease, evacuation, watch, tier] = entry.split(',');
    return {
      iso2,
      name: countryName(iso2),
      region: REGIONS[Number(region)] ?? 'Global',
      climate: CLIMATES[Number(climate)] ?? 'Climate and environmental exposure vary by region and season.',
      medical: MEDICAL[Number(medical)] ?? 'Medical access varies by location; confirm local capability before deployment.',
      security: SECURITY[Number(security)] ?? 'Confirm current government, employer, and site-specific guidance.',
      disease: TRAVEL[Number(disease)] ?? 'Use current destination guidance for travel-health considerations.',
      evacuation: EVACUATION[Number(evacuation)] ?? 'Confirm the program-specific escalation and evacuation pathway.',
      watchItems: (WATCH[Number(watch)] ?? 'Current destination guidance').split(';').map((item) => item.trim()),
      medicalTier: TIERS[Number(tier)] ?? 'Variable',
      mapFill: colorFor(index),
      mapHover: colorFor(index, true),
    };
  });

export const AOR_PROFILE_BY_ISO = new Map(AOR_PROFILES.map((profile) => [profile.iso2, profile]));

export const AOR_COLOR_EXPRESSION: unknown[] = [
  'match',
  ['get', 'iso_a2'],
  ...AOR_PROFILES.flatMap((profile) => [profile.iso2, profile.mapFill]),
  '#33434e',
];
