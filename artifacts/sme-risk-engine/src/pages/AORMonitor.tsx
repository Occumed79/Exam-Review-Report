import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, Thermometer, AlertTriangle, Activity, Pill, Info, Search, Filter } from 'lucide-react';

export default function AORMonitor() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState('medical');

  const countries = [
    { id: 'iraq', name: 'Iraq', risk: 'High', climate: 'Extreme Heat / Dust', medical: 'Limited / Evacuation Delays', security: 'High Unrest' },
    { id: 'germany', name: 'Germany', risk: 'Low', climate: 'Temperate', medical: 'Excellent', security: 'Low' },
    { id: 'japan', name: 'Japan', risk: 'Low', climate: 'Humid / Variable', medical: 'Excellent', security: 'Low' },
    { id: 'nigeria', name: 'Nigeria', risk: 'High', climate: 'Tropical / Humidity', medical: 'Limited / Infectious Disease', security: 'Moderate' },
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">GLOBAL AOR MONITOR</h1>
          <p className="text-white/40 font-medium uppercase tracking-widest text-xs mt-1">Area of Responsibility Deployment Intelligence</p>
        </div>
        <div className="flex gap-3">
          <div className="glass-card px-4 py-2 flex items-center gap-3 border-white/10">
            <Search size={16} className="text-white/40" />
            <input type="text" placeholder="Search Country..." className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20 w-48" />
          </div>
          <div className="glass-card px-4 py-2 flex items-center gap-3 border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
            <Filter size={16} className="text-white/40" />
            <span className="text-xs font-bold text-white/60 uppercase">Filters</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Interactive Map Area */}
        <div className="col-span-8 glass-card relative overflow-hidden flex items-center justify-center bg-slate-950/50">
          <div className="absolute inset-0 opacity-20" style={{ 
            backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
          }} />
          
          {/* Luminous Map Placeholder */}
          <div className="relative w-full h-full flex items-center justify-center">
            <Globe size={400} className="text-blue-500/10 animate-pulse" />
            
            {/* Glowing Country Markers */}
            {countries.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.2 }}
                onClick={() => setSelectedCountry(c.id)}
                className={`absolute w-4 h-4 rounded-full cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.5)] border-2 border-white/50 ${
                  c.risk === 'High' ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ 
                  top: `${30 + i * 15}%`, 
                  left: `${20 + i * 20}%` 
                }}
              >
                <div className="absolute -inset-2 rounded-full border border-white/10 animate-ping" />
              </motion.div>
            ))}
          </div>

          {/* Map Layers Toggle */}
          <div className="absolute bottom-6 left-6 flex gap-2">
            {['Medical', 'Climate', 'Security', 'Disease'].map(layer => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer.toLowerCase())}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeLayer === layer.toLowerCase() 
                    ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="col-span-4 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {selectedCountry ? (
              <motion.div
                key={selectedCountry}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="glass-card p-6 border-l-4 border-red-500">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                      {countries.find(c => c.id === selectedCountry)?.name}
                    </h2>
                    <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-1 rounded uppercase">
                      High Risk AOR
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <RiskItem icon={<Thermometer size={14} />} label="Climate" value={countries.find(c => c.id === selectedCountry)?.climate} />
                    <RiskItem icon={<Activity size={14} />} label="Medical" value={countries.find(c => c.id === selectedCountry)?.medical} />
                    <RiskItem icon={<Shield size={14} />} label="Security" value={countries.find(c => c.id === selectedCountry)?.security} />
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Condition Interactions</h3>
                  <div className="space-y-3">
                    <InteractionWarning 
                      condition="Diabetes" 
                      warning="Unreliable refrigeration & pharmacy access. High risk for insulin continuity." 
                    />
                    <InteractionWarning 
                      condition="Asthma" 
                      warning="Extreme dust & poor air quality. High risk for respiratory exacerbation." 
                    />
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Evacuation Protocol</h3>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-[10px] font-bold text-white/60 mb-1">Primary Hub</div>
                    <div className="text-sm font-bold text-white mb-3">Landstuhl Regional Medical Center (Germany)</div>
                    <div className="text-[10px] font-bold text-white/60 mb-1">Estimated Delay</div>
                    <div className="text-sm font-bold text-red-400">12-24 Hours (Weather Dependent)</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-12 text-center flex flex-col items-center justify-center h-full opacity-40">
                <Globe size={48} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Select a country to view intelligence</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function RiskItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-black text-white/30 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-bold text-white/80">{value}</div>
      </div>
    </div>
  );
}

function InteractionWarning({ condition, warning }: any) {
  return (
    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
      <div className="flex items-center gap-2 text-red-400 mb-1">
        <AlertTriangle size={12} />
        <span className="text-[10px] font-black uppercase">{condition} Interaction</span>
      </div>
      <p className="text-[11px] text-white/60 leading-tight">{warning}</p>
    </div>
  );
}
