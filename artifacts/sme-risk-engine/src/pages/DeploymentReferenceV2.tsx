import { useMemo, useState } from 'react';
import { ExternalLink, Globe, MapPin, Search, ShieldCheck, Stethoscope, Thermometer } from 'lucide-react';
import './deployment-reference.css';

type CountryProfile = {
  id: string;
  name: string;
  region: string;
  climate: string;
  medical: string;
  security: string;
  disease: string;
  evacuation: string;
  watchItems: string[];
};

const PROFILES: CountryProfile[] = [
  { id: 'iraq', name: 'Iraq', region: 'Middle East', climate: 'Extreme heat and dust exposure', medical: 'Access can vary substantially by location; remote work may depend on evacuation planning.', security: 'Security conditions can materially affect medical access and movement.', disease: 'Vector-borne, food/water, and heat-related risks may require current destination review.', evacuation: 'Confirm program evacuation plan and receiving facility before deployment.', watchItems: ['Heat tolerance', 'Respiratory disease / dust exposure', 'Medication continuity', 'Evacuation-dependent care'] },
  { id: 'kuwait', name: 'Kuwait', region: 'Middle East', climate: 'Extreme summer heat, dust, and high outdoor thermal load', medical: 'Urban medical care is available; program/site access still matters.', security: 'Confirm current advisory and employer/site security plan.', disease: 'Review current destination guidance for travel-related and seasonal risks.', evacuation: 'Confirm client or program evacuation pathway for specialty care.', watchItems: ['Heat-sensitive conditions', 'Hydration / renal issues', 'Cardiovascular exertion', 'Medication storage'] },
  { id: 'bahrain', name: 'Bahrain', region: 'Middle East', climate: 'Hot, humid summers with substantial heat stress', medical: 'Medical access is generally concentrated in developed urban areas.', security: 'Confirm current advisory and site-specific access constraints.', disease: 'Use current travel-health guidance for infectious-disease recommendations.', evacuation: 'Confirm program-specific specialty-care and evacuation pathway.', watchItems: ['Heat tolerance', 'Respiratory symptoms', 'Medication access', 'Cardiovascular conditions'] },
  { id: 'djibouti', name: 'Djibouti', region: 'East Africa', climate: 'Very hot, arid climate with coastal humidity', medical: 'Specialty-care options may be limited outside supported facilities.', security: 'Operational and geographic context can affect movement and care.', disease: 'Current travel-health review is important for vector-borne and food/water risks.', evacuation: 'Confirm receiving hub and transportation plan for higher-acuity care.', watchItems: ['Heat / dehydration', 'Renal disease', 'Cardiovascular reserve', 'Medication continuity'] },
  { id: 'nigeria', name: 'Nigeria', region: 'West Africa', climate: 'Tropical heat and humidity', medical: 'Care quality and access vary significantly by city and region.', security: 'Security and travel constraints vary geographically.', disease: 'Current travel-health review is important for vector-borne and food/water risks.', evacuation: 'Confirm program evacuation route and destination facility.', watchItems: ['Infectious-disease vulnerability', 'Immunosuppression', 'Diabetes control', 'Medication supply'] },
  { id: 'colombia', name: 'Colombia', region: 'South America', climate: 'Tropical climate with substantial altitude variation by location', medical: 'Urban access can be strong; rural/remote access may be more limited.', security: 'Regional variation makes current advisory review important.', disease: 'Destination-specific vector-borne and travel-health guidance should be checked.', evacuation: 'Confirm local-to-urban escalation pathway for remote assignments.', watchItems: ['Altitude-sensitive conditions', 'Pregnancy / travel-health considerations', 'Cardiovascular reserve', 'Remote medical access'] },
  { id: 'philippines', name: 'Philippines', region: 'Southeast Asia', climate: 'Tropical, humid, with seasonal severe-weather exposure', medical: 'Access varies sharply between major cities and remote islands/regions.', security: 'Regional and severe-weather disruption can affect access.', disease: 'Current destination guidance is important for vector-borne and food/water risks.', evacuation: 'Remote-island or provincial work may require staged evacuation.', watchItems: ['Infectious-disease vulnerability', 'Weather disruption', 'Medication continuity', 'Remote care'] },
  { id: 'south-korea', name: 'South Korea', region: 'East Asia', climate: 'Temperate with hot summers and cold winters', medical: 'Strong medical infrastructure in major population centers.', security: 'Confirm current government and program advisories.', disease: 'Use current destination guidance for seasonal/travel-health recommendations.', evacuation: 'Program-specific escalation may still apply despite strong local care.', watchItems: ['Seasonal temperature exposure', 'Program-specific access', 'Medication continuity'] },
  { id: 'japan', name: 'Japan', region: 'East Asia', climate: 'Humid summers and variable seasonal conditions', medical: 'Strong medical infrastructure, with language/access considerations depending on site.', security: 'Confirm current program and disaster-preparedness context.', disease: 'Use current destination guidance for seasonal/travel-health recommendations.', evacuation: 'Local specialty access may reduce evacuation need, but program rules still govern.', watchItems: ['Heat / humidity', 'Language-access planning', 'Medication availability', 'Disaster continuity'] },
  { id: 'germany', name: 'Germany', region: 'Europe', climate: 'Temperate seasonal climate', medical: 'Strong medical infrastructure and specialty access in populated areas.', security: 'Confirm current program/site requirements rather than assuming unrestricted access.', disease: 'Travel-health risks are generally destination and season specific.', evacuation: 'Higher-acuity specialty care is usually locally accessible, subject to program rules.', watchItems: ['Program-specific requirements', 'Medication availability', 'Language / referral coordination'] },
  { id: 'poland', name: 'Poland', region: 'Europe', climate: 'Continental seasonal climate with cold winters', medical: 'Good urban medical access; availability may vary by location and specialty.', security: 'Confirm current program and regional travel context.', disease: 'Use current destination guidance for seasonal and outdoor exposure risks.', evacuation: 'Confirm site-to-specialty referral or escalation route.', watchItems: ['Cold exposure', 'Remote-site access', 'Medication availability', 'Specialty follow-up'] },
];

const CURRENT_SOURCES = [
  { name: 'CDC Travelers’ Health', url: 'https://wwwnc.cdc.gov/travel/destinations/list' },
  { name: 'U.S. State Department Travel Advisories', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/' },
];

export default function DeploymentReferenceV2() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('kuwait');
  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return PROFILES;
    return PROFILES.filter((profile) => `${profile.name} ${profile.region} ${profile.climate} ${profile.watchItems.join(' ')}`.toLowerCase().includes(clean));
  }, [query]);
  const selected = PROFILES.find((profile) => profile.id === selectedId) ?? filtered[0] ?? PROFILES[0];

  return (
    <div className="deployment-workbench" data-testid="deployment-reference">
      <header className="deployment-header">
        <div>
          <div className="deployment-kicker">DEPLOYMENT / LOCATION REFERENCE</div>
          <h1>AOR / Deployment</h1>
          <p>Built-in location profiles for fast orientation, plus direct starting points for current travel-health and security guidance.</p>
        </div>
        <div className="deployment-static"><ShieldCheck size={14} /><div><strong>Built-in profiles</strong><small>not a live advisory feed</small></div></div>
      </header>

      <div className="deployment-toolbar">
        <div className="deployment-search liquid-glass"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Country, region, climate…" /></div>
        <div className="deployment-source-links">{CURRENT_SOURCES.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer">{source.name}<ExternalLink size={9} /></a>)}</div>
      </div>

      <div className="deployment-layout">
        <aside className="deployment-country-list">
          <div className="deployment-list-head"><span>BUILT-IN PROFILES</span><small>{filtered.length}</small></div>
          {filtered.map((profile) => <button key={profile.id} className={profile.id === selected.id ? 'active' : ''} onClick={() => setSelectedId(profile.id)}><MapPin size={13} /><span><strong>{profile.name}</strong><small>{profile.region}</small></span></button>)}
          {filtered.length === 0 && <div className="deployment-empty">No matching built-in profile.</div>}
        </aside>

        <main className="deployment-detail">
          <div className="deployment-title"><div><span>REFERENCE PROFILE</span><h2>{selected.name}</h2><p>{selected.region}</p></div><Globe size={23} /></div>
          <div className="deployment-facts">
            <Fact icon={Thermometer} label="Climate / environment" value={selected.climate} />
            <Fact icon={Stethoscope} label="Medical access" value={selected.medical} />
            <Fact icon={ShieldCheck} label="Security / access" value={selected.security} />
            <Fact icon={Globe} label="Travel-health context" value={selected.disease} />
            <Fact icon={MapPin} label="Escalation / evacuation" value={selected.evacuation} />
          </div>
          <section className="deployment-watch"><span>REVIEW WATCH ITEMS</span><div>{selected.watchItems.map((item) => <span key={item}>{item}</span>)}</div></section>
          <div className="deployment-warning">This profile is a fast reviewer reference, not a current country risk assessment. Check current government, client, and site-specific guidance when the location materially affects the review.</div>
        </main>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Globe; label: string; value: string }) {
  return <div className="deployment-fact"><Icon size={14} /><div><span>{label}</span><p>{value}</p></div></div>;
}
