import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, Thermometer, AlertTriangle, Activity, Pill, Search, MapPin, Clock, ChevronRight, Plus, X } from 'lucide-react';

type RiskLevel = 'High' | 'Moderate' | 'Low';

interface Country {
  id: string;
  name: string;
  flag: string;
  region: string;
  risk: RiskLevel;
  climate: string;
  medical: string;
  security: string;
  disease: string;
  evac: { hub: string; delay: string };
  interactions: Array<{ condition: string; warning: string }>;
  custom?: boolean;
}

const BASE_COUNTRIES: Country[] = [
  { id: 'iraq', name: 'Iraq', flag: '🇮🇶', region: 'Middle East', risk: 'High', climate: 'Extreme Heat / Dust Storms', medical: 'Limited / Evacuation Delays', security: 'High Unrest', disease: 'Leishmaniasis, Sand Fly Fever', evac: { hub: 'Landstuhl RMC (Germany)', delay: '12–24 hrs (weather dependent)' }, interactions: [{ condition: 'Diabetes', warning: 'Unreliable refrigeration & pharmacy access. High risk for insulin continuity.' }, { condition: 'Asthma/COPD', warning: 'Extreme dust & poor air quality. High exacerbation risk.' }, { condition: 'Cardiovascular', warning: 'Heat stress significantly increases cardiac demand.' }] },
  { id: 'afghanistan', name: 'Afghanistan', flag: '🇦🇫', region: 'Central Asia', risk: 'High', climate: 'Extreme Heat & Cold / High Altitude', medical: 'Very Limited', security: 'Very High Unrest', disease: 'Malaria, Typhoid, Hepatitis A', evac: { hub: 'Regional evacuation hub', delay: '24–48 hrs' }, interactions: [{ condition: 'Respiratory', warning: 'High altitude + dust severely limits respiratory reserve.' }, { condition: 'Psychiatric', warning: 'Combat zone — high PTSD/acute stress risk.' }] },
  { id: 'nigeria', name: 'Nigeria', flag: '🇳🇬', region: 'West Africa', risk: 'High', climate: 'Tropical / High Humidity', medical: 'Limited / Infectious Disease Risk', security: 'Moderate', disease: 'Malaria, Lassa Fever, Cholera', evac: { hub: 'Lagos Intl → Frankfurt', delay: '6–12 hrs' }, interactions: [{ condition: 'Immunosuppressed', warning: 'Lassa fever endemic. Extreme exposure risk.' }, { condition: 'Diabetes', warning: 'Infectious disease risk amplified by hyperglycemia.' }] },
  { id: 'djibouti', name: 'Djibouti', flag: '🇩🇯', region: 'East Africa', risk: 'Moderate', climate: 'Extreme Heat / Coastal Humidity', medical: 'Moderate (US Military Presence)', security: 'Low–Moderate', disease: 'Dengue, Malaria', evac: { hub: 'Camp Lemonnier → LRMC', delay: '8–16 hrs' }, interactions: [{ condition: 'Cardiovascular', warning: 'Sustained heat index >110°F elevates cardiac demand.' }, { condition: 'Renal', warning: 'Dehydration risk in extreme heat accelerates renal decline.' }] },
  { id: 'colombia', name: 'Colombia', flag: '🇨🇴', region: 'South America', risk: 'Moderate', climate: 'Tropical / Variable Altitude', medical: 'Moderate (Urban) / Limited (Rural)', security: 'Moderate (Regional)', disease: 'Zika, Dengue, Yellow Fever', evac: { hub: 'Bogotá → Miami', delay: '4–8 hrs' }, interactions: [{ condition: 'Pregnancy', warning: 'Active Zika transmission zone. Contraindicated for pregnant personnel.' }, { condition: 'Cardiovascular', warning: 'Variable altitude zones from sea level to >3,000m.' }] },
  { id: 'philippines', name: 'Philippines', flag: '🇵🇭', region: 'Southeast Asia', risk: 'Moderate', climate: 'Tropical / Typhoon Season', medical: 'Moderate (Manila) / Limited (Remote)', security: 'Low–Moderate', disease: 'Dengue, Leptospirosis, Typhoid', evac: { hub: 'Manila Intl → Japan/US', delay: '4–10 hrs' }, interactions: [{ condition: 'Immunosuppressed', warning: 'Multiple endemic tropical infections. Prophylaxis essential.' }] },
  { id: 'south-korea', name: 'South Korea', flag: '🇰🇷', region: 'East Asia', risk: 'Low', climate: 'Temperate / Cold Winters', medical: 'Excellent', security: 'Low', disease: 'Minimal', evac: { hub: 'Osan AB', delay: '2–4 hrs' }, interactions: [] },
  { id: 'germany', name: 'Germany', flag: '🇩🇪', region: 'Europe', risk: 'Low', climate: 'Temperate', medical: 'Excellent (LRMC on-site)', security: 'Low', disease: 'None significant', evac: { hub: 'Landstuhl RMC (on-site)', delay: 'Immediate' }, interactions: [] },
  { id: 'japan', name: 'Japan', flag: '🇯🇵', region: 'East Asia', risk: 'Low', climate: 'Humid / Variable Seasons', medical: 'Excellent', security: 'Low', disease: 'None significant', evac: { hub: 'Yokota AB', delay: '2–4 hrs' }, interactions: [] },
  { id: 'poland', name: 'Poland', flag: '🇵🇱', region: 'Europe', risk: 'Low', climate: 'Continental / Cold Winters', medical: 'Good', security: 'Low', disease: 'Tick-borne encephalitis (rural)', evac: { hub: 'Rzeszów → LRMC', delay: '4–6 hrs' }, interactions: [] },
  { id: 'bahrain', name: 'Bahrain', flag: '🇧🇭', region: 'Middle East', risk: 'Moderate', climate: 'Extreme Summer Heat / Humid', medical: 'Good (US Naval Presence)', security: 'Low–Moderate', disease: 'MERS-CoV (seasonal)', evac: { hub: 'NSA Bahrain → LRMC', delay: '6–12 hrs' }, interactions: [{ condition: 'Cardiovascular', warning: 'Summer heat index regularly exceeds 120°F equivalent. Significant cardiac strain.' }, { condition: 'Respiratory', warning: 'Dust/sandstorms common. Asthma/COPD exacerbation risk.' }] },
  { id: 'kuwait', name: 'Kuwait', flag: '🇰🇼', region: 'Middle East', risk: 'Moderate', climate: 'Extreme Heat / Dust', medical: 'Good (Base Medical)', security: 'Low–Moderate', disease: 'Sand Fly Fever, GI illness', evac: { hub: 'Ali Al Salem AB', delay: '6–14 hrs' }, interactions: [{ condition: 'Cardiovascular', warning: 'World\'s highest summer temperatures. Direct cardiac risk during outdoor duty.' }, { condition: 'Diabetes', warning: 'Heat stress and dehydration complicate glycemic control.' }] },
];

const RISK_META: Record<RiskLevel, { color: string; bg: string; border: string }> = {
  'High':     { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)' },
  'Moderate': { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' },
  'Low':      { color: '#b4d7d0', bg: 'rgba(180,215,208,0.10)', border: 'rgba(180,215,208,0.25)' },
};

const LAYERS = ['Medical', 'Climate', 'Security', 'Disease'];

const BLANK_COUNTRY: Omit<Country, 'id'> = {
  name: '', flag: '🌍', region: '', risk: 'Moderate',
  climate: '', medical: '', security: '', disease: '',
  evac: { hub: '', delay: '' },
  interactions: [],
  custom: true,
};

export default function AORMonitor() {
  const [countries, setCountries] = useState<Country[]>(BASE_COUNTRIES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState('medical');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<Country, 'id'>>(BLANK_COUNTRY);
  const [newInteraction, setNewInteraction] = useState({ condition: '', warning: '' });

  const selected = countries.find(c => c.id === selectedId);
  const filtered = countries.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.region.toLowerCase().includes(search.toLowerCase())
  );

  const layerValue = (c: Country) => {
    if (activeLayer === 'medical') return c.medical;
    if (activeLayer === 'climate') return c.climate;
    if (activeLayer === 'security') return c.security;
    return c.disease;
  };

  const addCountry = () => {
    if (!form.name.trim()) return;
    const id = `custom-${Date.now()}`;
    setCountries(prev => [...prev, { ...form, id }]);
    setSelectedId(id);
    setShowAdd(false);
    setForm(BLANK_COUNTRY);
  };

  const removeCountry = (id: string) => {
    setCountries(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const addInteraction = () => {
    if (!newInteraction.condition.trim() || !newInteraction.warning.trim()) return;
    setForm(prev => ({ ...prev, interactions: [...prev.interactions, { ...newInteraction }] }));
    setNewInteraction({ condition: '', warning: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#f4efdc', letterSpacing: '-0.03em', margin: 0 }}>GLOBAL AOR MONITOR</h1>
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '0.25rem', marginBottom: 0 }}>Area of Responsibility Deployment Intelligence</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.625rem', borderRadius: '12px' }}>
            <Search size={14} style={{ color: 'rgba(255,255,255,0.35)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search country or region..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.8125rem', color: '#f4efdc', width: '200px' }} />
          </div>
          <button onClick={() => setShowAdd(true)} className="glow-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <Plus size={14} /> Add Country
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', flex: 1, minHeight: 0 }}>
        {/* Country Grid */}
        <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.875rem 0.875rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {LAYERS.map(layer => (
              <button key={layer} onClick={() => setActiveLayer(layer.toLowerCase())}
                className={activeLayer === layer.toLowerCase() ? 'tab-btn active-tab' : 'tab-btn'}
                style={{ fontSize: '0.75rem' }}>{layer}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>{filtered.length} countries</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.625rem' }}>
              {filtered.map(country => {
                const meta = RISK_META[country.risk];
                const isActive = selectedId === country.id;
                return (
                  <motion.div key={country.id} onClick={() => setSelectedId(isActive ? null : country.id)}
                    whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
                    style={{ background: isActive ? 'rgba(180,215,208,0.08)' : 'rgba(255,255,255,0.03)', border: isActive ? '1px solid rgba(180,215,208,0.30)' : '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '0.875rem', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}>
                    {country.custom && (
                      <button onClick={e => { e.stopPropagation(); removeCountry(country.id); }}
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '2px' }}>
                        <X size={12} />
                      </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{country.flag}</span>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f4efdc' }}>{country.name}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)' }}>{country.region}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase', background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{country.risk}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{layerValue(country)}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="glass-card" style={{ borderRadius: '14px', padding: '1.25rem', borderLeft: `3px solid ${RISK_META[selected.risk].color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '2rem' }}>{selected.flag}</span>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f4efdc', margin: 0, letterSpacing: '-0.02em' }}>{selected.name}</h2>
                        <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>{selected.region}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '6px', textTransform: 'uppercase', background: RISK_META[selected.risk].bg, color: RISK_META[selected.risk].color, border: `1px solid ${RISK_META[selected.risk].border}` }}>{selected.risk} Risk</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <RiskRow icon={<Thermometer size={13} />} label="Climate" value={selected.climate} />
                    <RiskRow icon={<Activity size={13} />} label="Medical Access" value={selected.medical} />
                    <RiskRow icon={<Shield size={13} />} label="Security" value={selected.security} />
                    <RiskRow icon={<Pill size={13} />} label="Disease Risk" value={selected.disease} />
                  </div>
                </div>

                <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem' }}>
                  <div className="section-label" style={{ marginBottom: '0.625rem' }}>Evacuation Protocol</div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '0.875rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <MapPin size={12} style={{ color: '#b4d7d0' }} />
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Primary Hub</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f4efdc', marginBottom: '0.5rem' }}>{selected.evac.hub || '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Clock size={12} style={{ color: selected.evac.delay?.includes('Immediate') ? '#b4d7d0' : '#f59e0b' }} />
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Est. Delay</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: selected.evac.delay?.includes('Immediate') ? '#b4d7d0' : '#f59e0b' }}>{selected.evac.delay || '—'}</div>
                  </div>
                </div>

                {selected.interactions.length > 0 && (
                  <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem' }}>
                    <div className="section-label" style={{ marginBottom: '0.625rem' }}>Condition Interactions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selected.interactions.map((inter, idx) => (
                        <div key={idx} style={{ padding: '0.75rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                            <AlertTriangle size={11} style={{ color: '#f59e0b' }} />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>{inter.condition}</span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>{inter.warning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="glass-card" style={{ borderRadius: '14px', padding: '3rem', textAlign: 'center', opacity: 0.4 }}>
                <Globe size={40} style={{ margin: '0 auto 1rem', color: '#b4d7d0' }} />
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Select a country to view intelligence</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Country Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: 'rgba(10,18,25,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#f4efdc' }}>Add Custom Country</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {[
                  { label: 'Country Name', key: 'name', placeholder: 'e.g. United Arab Emirates' },
                  { label: 'Flag Emoji', key: 'flag', placeholder: '🇦🇪' },
                  { label: 'Region', key: 'region', placeholder: 'e.g. Middle East' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>{label}</div>
                    <input value={(form as any)[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#f4efdc', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Risk Level</div>
                  <select value={form.risk} onChange={e => setForm(prev => ({ ...prev, risk: e.target.value as RiskLevel }))}
                    style={{ width: '100%', background: 'rgba(20,28,38,0.95)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#f4efdc', outline: 'none' }}>
                    <option>High</option><option>Moderate</option><option>Low</option>
                  </select>
                </div>
              </div>

              {[
                { label: 'Climate', key: 'climate', placeholder: 'Describe climate conditions' },
                { label: 'Medical Access', key: 'medical', placeholder: 'Describe medical access' },
                { label: 'Security', key: 'security', placeholder: 'Describe security environment' },
                { label: 'Disease Risk', key: 'disease', placeholder: 'List endemic diseases' },
                { label: 'Evacuation Hub', key: 'evacHub', placeholder: 'e.g. Dubai Intl → LRMC' },
                { label: 'Evacuation Delay', key: 'evacDelay', placeholder: 'e.g. 4–8 hrs' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ marginBottom: '0.625rem' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>{label}</div>
                  <input
                    value={key === 'evacHub' ? form.evac.hub : key === 'evacDelay' ? form.evac.delay : (form as any)[key]}
                    onChange={e => {
                      if (key === 'evacHub') setForm(prev => ({ ...prev, evac: { ...prev.evac, hub: e.target.value } }));
                      else if (key === 'evacDelay') setForm(prev => ({ ...prev, evac: { ...prev.evac, delay: e.target.value } }));
                      else setForm(prev => ({ ...prev, [key]: e.target.value }));
                    }}
                    placeholder={placeholder}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#f4efdc', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}

              {/* Condition Interactions */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Condition Interactions (optional)</div>
                {form.interactions.map((inter, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', padding: '0.375rem 0.625rem', background: 'rgba(245,158,11,0.08)', borderRadius: '6px', marginBottom: '0.375rem' }}>
                    <strong style={{ color: '#f59e0b' }}>{inter.condition}:</strong> {inter.warning}
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input value={newInteraction.condition} onChange={e => setNewInteraction(p => ({ ...p, condition: e.target.value }))} placeholder="Condition"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', padding: '0.4rem 0.625rem', fontSize: '0.75rem', color: '#f4efdc', outline: 'none' }} />
                  <input value={newInteraction.warning} onChange={e => setNewInteraction(p => ({ ...p, warning: e.target.value }))} placeholder="Warning text"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', padding: '0.4rem 0.625rem', fontSize: '0.75rem', color: '#f4efdc', outline: 'none' }} />
                  <button onClick={addInteraction} style={{ background: 'rgba(180,215,208,0.15)', border: '1px solid rgba(180,215,208,0.25)', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: '#b4d7d0', cursor: 'pointer' }}>Add</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAdd(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', padding: '0.625rem 1.25rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={addCountry} className="glow-btn" style={{ fontSize: '0.8125rem' }}>Save Country</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RiskRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b4d7d0', flexShrink: 0, marginTop: '1px' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{value}</div>
      </div>
    </div>
  );
}
