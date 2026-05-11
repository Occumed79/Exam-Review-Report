import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, Thermometer, AlertTriangle, Activity, Pill, Search, Filter, MapPin, Clock, ChevronRight } from 'lucide-react';

const COUNTRIES = [
  {
    id: 'iraq', name: 'Iraq', flag: '🇮🇶', region: 'Middle East', risk: 'High',
    climate: 'Extreme Heat / Dust Storms', medical: 'Limited / Evacuation Delays', security: 'High Unrest',
    disease: 'Leishmaniasis, Sand Fly Fever',
    evac: { hub: 'Landstuhl RMC (Germany)', delay: '12–24 hrs (weather dependent)' },
    interactions: [
      { condition: 'Diabetes', warning: 'Unreliable refrigeration & pharmacy access. High risk for insulin continuity.' },
      { condition: 'Asthma/COPD', warning: 'Extreme dust & poor air quality. High exacerbation risk.' },
      { condition: 'Cardiovascular', warning: 'Heat stress significantly increases cardiac demand.' },
    ],
  },
  {
    id: 'afghanistan', name: 'Afghanistan', flag: '🇦🇫', region: 'Central Asia', risk: 'High',
    climate: 'Extreme Heat & Cold / High Altitude', medical: 'Very Limited', security: 'Very High Unrest',
    disease: 'Malaria, Typhoid, Hepatitis A',
    evac: { hub: 'Bagram / Kabul Air', delay: '24–48 hrs' },
    interactions: [
      { condition: 'Respiratory', warning: 'High altitude + dust severely limits respiratory reserve.' },
      { condition: 'Psychiatric', warning: 'Combat zone — high PTSD/acute stress risk.' },
    ],
  },
  {
    id: 'nigeria', name: 'Nigeria', flag: '🇳🇬', region: 'West Africa', risk: 'High',
    climate: 'Tropical / High Humidity', medical: 'Limited / Infectious Disease Risk', security: 'Moderate',
    disease: 'Malaria, Lassa Fever, Cholera',
    evac: { hub: 'Lagos Intl → Frankfurt', delay: '6–12 hrs' },
    interactions: [
      { condition: 'Immunosuppressed', warning: 'Lassa fever endemic. Extreme exposure risk.' },
      { condition: 'Diabetes', warning: 'Infectious disease risk amplified by hyperglycemia.' },
    ],
  },
  {
    id: 'djibouti', name: 'Djibouti', flag: '🇩🇯', region: 'East Africa', risk: 'Moderate',
    climate: 'Extreme Heat / Coastal Humidity', medical: 'Moderate (US Military Presence)', security: 'Low–Moderate',
    disease: 'Dengue, Malaria',
    evac: { hub: 'Camp Lemonnier → LRMC', delay: '8–16 hrs' },
    interactions: [
      { condition: 'Cardiovascular', warning: 'Sustained heat index >110°F elevates cardiac demand.' },
      { condition: 'Renal', warning: 'Dehydration risk in extreme heat accelerates renal decline.' },
    ],
  },
  {
    id: 'south-korea', name: 'South Korea', flag: '🇰🇷', region: 'East Asia', risk: 'Low',
    climate: 'Temperate / Cold Winters', medical: 'Excellent', security: 'Low',
    disease: 'Minimal',
    evac: { hub: 'Osan AB', delay: '2–4 hrs' },
    interactions: [],
  },
  {
    id: 'germany', name: 'Germany', flag: '🇩🇪', region: 'Europe', risk: 'Low',
    climate: 'Temperate', medical: 'Excellent (LRMC on-site)', security: 'Low',
    disease: 'None significant',
    evac: { hub: 'Landstuhl RMC (on-site)', delay: 'Immediate' },
    interactions: [],
  },
  {
    id: 'japan', name: 'Japan', flag: '🇯🇵', region: 'East Asia', risk: 'Low',
    climate: 'Humid / Variable Seasons', medical: 'Excellent', security: 'Low',
    disease: 'None significant',
    evac: { hub: 'Yokota AB', delay: '2–4 hrs' },
    interactions: [],
  },
  {
    id: 'poland', name: 'Poland', flag: '🇵🇱', region: 'Europe', risk: 'Low',
    climate: 'Continental / Cold Winters', medical: 'Good', security: 'Low',
    disease: 'Tick-borne encephalitis (rural)',
    evac: { hub: 'Rzeszów → LRMC', delay: '4–6 hrs' },
    interactions: [],
  },
];

const RISK_META: Record<string, { color: string; bg: string; border: string }> = {
  'High':     { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)' },
  'Moderate': { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' },
  'Low':      { color: '#b4d7d0', bg: 'rgba(180,215,208,0.10)', border: 'rgba(180,215,208,0.25)' },
};

const LAYERS = ['Medical', 'Climate', 'Security', 'Disease'];

export default function AORMonitor() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState('medical');
  const [search, setSearch] = useState('');

  const selected = COUNTRIES.find(c => c.id === selectedId);
  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.region.toLowerCase().includes(search.toLowerCase())
  );

  const layerValue = (c: typeof COUNTRIES[0]) => {
    switch (activeLayer) {
      case 'medical': return c.medical;
      case 'climate': return c.climate;
      case 'security': return c.security;
      case 'disease': return c.disease;
      default: return '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#f4efdc', letterSpacing: '-0.03em', margin: 0 }}>
            GLOBAL AOR MONITOR
          </h1>
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '0.25rem' }}>
            Area of Responsibility Deployment Intelligence
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.625rem', borderRadius: '12px' }}>
            <Search size={14} style={{ color: 'rgba(255,255,255,0.35)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country or region..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.8125rem', color: '#f4efdc', width: '200px' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', flex: 1, minHeight: 0 }}>
        {/* Country List + Map Area */}
        <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Layer Toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {LAYERS.map(layer => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer.toLowerCase())}
                className={activeLayer === layer.toLowerCase() ? 'tab-btn active-tab' : 'tab-btn'}
                style={{ fontSize: '0.75rem' }}
              >
                {layer}
              </button>
            ))}
          </div>

          {/* Country Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.625rem' }}>
              {filtered.map(country => {
                const meta = RISK_META[country.risk];
                const isActive = selectedId === country.id;
                return (
                  <motion.div
                    key={country.id}
                    onClick={() => setSelectedId(isActive ? null : country.id)}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      background: isActive ? 'rgba(180,215,208,0.08)' : 'rgba(255,255,255,0.03)',
                      border: isActive ? '1px solid rgba(180,215,208,0.30)' : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '12px',
                      padding: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{country.flag}</span>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f4efdc' }}>{country.name}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{country.region}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                          borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
                          background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`
                        }}>
                          {country.risk}
                        </span>
                        <ChevronRight size={12} style={{ color: isActive ? '#b4d7d0' : 'rgba(255,255,255,0.2)' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      {layerValue(country)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Intelligence Detail Panel */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                {/* Country Header Card */}
                <div className="glass-card" style={{
                  borderRadius: '14px', padding: '1.25rem',
                  borderLeft: `3px solid ${RISK_META[selected.risk].color}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '2rem' }}>{selected.flag}</span>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f4efdc', margin: 0, letterSpacing: '-0.02em' }}>
                          {selected.name}
                        </h2>
                        <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{selected.region}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.625rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '6px',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: RISK_META[selected.risk].bg,
                      color: RISK_META[selected.risk].color,
                      border: `1px solid ${RISK_META[selected.risk].border}`,
                    }}>
                      {selected.risk} Risk AOR
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <RiskRow icon={<Thermometer size={13} />} label="Climate" value={selected.climate} />
                    <RiskRow icon={<Activity size={13} />} label="Medical Access" value={selected.medical} />
                    <RiskRow icon={<Shield size={13} />} label="Security" value={selected.security} />
                    <RiskRow icon={<Pill size={13} />} label="Disease Risk" value={selected.disease} />
                  </div>
                </div>

                {/* Evacuation */}
                <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem' }}>
                  <div className="section-label" style={{ marginBottom: '0.625rem' }}>Evacuation Protocol</div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '0.875rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <MapPin size={12} style={{ color: '#b4d7d0' }} />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Primary Hub</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f4efdc', marginBottom: '0.625rem' }}>{selected.evac.hub}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={12} style={{ color: selected.evac.delay.includes('Immediate') ? '#b4d7d0' : '#f59e0b' }} />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Est. Delay</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: selected.evac.delay.includes('Immediate') ? '#b4d7d0' : '#f59e0b', marginTop: '0.25rem' }}>
                      {selected.evac.delay}
                    </div>
                  </div>
                </div>

                {/* Condition Interactions */}
                {selected.interactions.length > 0 && (
                  <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem' }}>
                    <div className="section-label" style={{ marginBottom: '0.625rem' }}>Condition Interactions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selected.interactions.map((i, idx) => (
                        <div key={idx} className="risk-flag-card risk-flag-amber" style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                            <AlertTriangle size={11} style={{ color: '#f59e0b' }} />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {i.condition}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>{i.warning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
                style={{ borderRadius: '14px', padding: '3rem', textAlign: 'center', opacity: 0.4 }}
              >
                <Globe size={40} style={{ margin: '0 auto 1rem', color: '#b4d7d0' }} />
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Select a country to view intelligence
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function RiskRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b4d7d0', flexShrink: 0, marginTop: '1px' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{value}</div>
      </div>
    </div>
  );
}
