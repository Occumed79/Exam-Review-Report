import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Shield, AlertCircle, FileText, Activity, 
  Thermometer, Pill, Globe, Info, CheckCircle2 
} from 'lucide-react';
import { SMECase } from '../../lib/types';

interface SMEIntelligenceBriefProps {
  caseData: SMECase;
}

export default function SMEIntelligenceBrief({ caseData }: SMEIntelligenceBriefProps) {
  const interactions = caseData.riskInteractions || [];
  
  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <Zap className="text-amber-300 fill-amber-300" size={32} />
            SME INTELLIGENCE BRIEF
          </h1>
          <p className="text-white/40 font-medium mt-1 uppercase tracking-widest text-xs">
            Analyst View — Critical Risk Synthesis
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-right">
          <div className="text-[10px] text-white/30 font-black uppercase">Evidence Strength</div>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-1.5 w-6 rounded-full ${i <= 4 ? 'bg-teal-400' : 'bg-white/10'}`} />
            ))}
          </div>
          <div className="text-[10px] text-teal-300 font-bold mt-1">HIGH (82%)</div>
        </div>
      </div>

      {/* Top Risk Interactions */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400" />
          Top Risk Interactions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interactions.map((interaction) => (
            <div key={interaction.id} className="glass-card p-5 border-l-4 border-red-400/50">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-black text-red-400 uppercase bg-red-400/10 px-2 py-0.5 rounded">
                  {interaction.type.replace('-', ' → ')}
                </span>
                <span className="text-[10px] font-black text-white/30 uppercase">Severity: {interaction.severity}</span>
              </div>
              <h4 className="text-white font-bold mb-2">{interaction.description}</h4>
              <p className="text-xs text-white/60 leading-relaxed">{interaction.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Standards & Guidelines */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
          <Shield size={16} className="text-teal-300" />
          Most Relevant Standards
        </h3>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-4 py-3 font-black text-white/40 uppercase">Standard Family</th>
                <th className="px-4 py-3 font-black text-white/40 uppercase">Trigger Point</th>
                <th className="px-4 py-3 font-black text-white/40 uppercase">Documentation Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-4 font-bold text-white">DOT/FMCSA §391.41</td>
                <td className="px-4 py-4 text-white/70">Seizure-free period requirement</td>
                <td className="px-4 py-4 text-teal-300 font-medium">Neurology clearance, EEG, Drug levels</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-4 font-bold text-white">OSHA 1910.134</td>
                <td className="px-4 py-4 text-white/70">Respirator use with neurologic meds</td>
                <td className="px-4 py-4 text-teal-300 font-medium">Provider statement on sedation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Treatment & Medication Continuity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Pill size={14} className="text-slate-300" />
            Medication Continuity
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Refrigeration Required</span>
              <span className="text-xs font-bold text-teal-300">NO</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Controlled Substance</span>
              <span className="text-xs font-bold text-teal-300">NO</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Sedating Potential</span>
              <span className="text-xs font-bold text-amber-400">YES</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Globe size={14} className="text-teal-300" />
            Deployment Modifiers
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Remote/Austere</span>
              <span className="text-xs font-bold text-white/40">N/A</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Extreme Climate</span>
              <span className="text-xs font-bold text-white/40">N/A</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Evacuation Delay</span>
              <span className="text-xs font-bold text-white/40">N/A</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} className="text-red-400" />
            SME Questions
          </h3>
          <ul className="space-y-2">
            <li className="text-[11px] text-white/70 flex gap-2">
              <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
              Verify exact date of last breakthrough event.
            </li>
            <li className="text-[11px] text-white/70 flex gap-2">
              <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
              Confirm night shift tolerance with current meds.
            </li>
          </ul>
        </div>
      </div>

      {/* Documentation Gaps */}
      <section className="glass-card p-6 border-dashed border-white/20">
        <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Documentation Gaps Blocking Interpretation</h3>
        <div className="flex flex-wrap gap-3">
          <div className="bg-red-400/10 border border-red-400/30 rounded-full px-4 py-1.5 text-[10px] font-bold text-red-400 flex items-center gap-2">
            <FileText size={12} /> MISSING: NEUROLOGY CLEARANCE LETTER
          </div>
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-full px-4 py-1.5 text-[10px] font-bold text-amber-400 flex items-center gap-2">
            <FileText size={12} /> OUTDATED: EEG RESULTS (&gt;6 MONTHS)
          </div>
        </div>
      </section>
    </div>
  );
}
