import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, AlertCircle, Info, FileText, HelpCircle } from 'lucide-react';
import { SMECase } from '../../lib/types';

interface StandardInteractionEngineProps {
  caseData: SMECase;
}

export default function StandardInteractionEngine({ caseData }: StandardInteractionEngineProps) {
  const [selectedStandard, setSelectedStandard] = useState(caseData.agencyStandard || 'DOT/FMCSA');

  const questions = [
    { q: "Which standard family applies?", a: selectedStandard, icon: <Shield size={14} /> },
    { q: "Which condition categories are relevant?", a: "Neurologic, Cardiovascular", icon: <Activity size={14} /> },
    { q: "Which job duties trigger concern?", a: "Commercial Driving, Night Shift", icon: <Briefcase size={14} /> },
    { q: "What documentation is usually needed?", a: "Neurology Clearance, EEG, Drug Levels", icon: <FileText size={14} /> },
    { q: "What factors require SME review?", a: "Seizure-free period < 5 years", icon: <AlertCircle size={14} /> },
    { q: "Is the source official or internal?", a: "Official (FMCSA)", icon: <CheckCircle2 size={14} /> },
    { q: "Is the guideline current?", a: "Yes (2024 Version)", icon: <Info size={14} /> },
    { q: "Is the rule exact or general?", a: "Exact (Regulatory)", icon: <HelpCircle size={14} /> },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Standard Interaction Engine</h2>
          <p className="text-sm text-white/40 font-medium">Dynamic interpretation of regulatory and occupational standards</p>
        </div>
        <div className="bg-blue-400/10 border border-blue-400/30 rounded-xl px-4 py-2 text-[10px] font-black text-teal-300 uppercase">
          Active Standard: {selectedStandard}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-5 flex gap-4 items-start"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 shrink-0">
              {item.icon}
            </div>
            <div>
              <div className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-1">{item.q}</div>
              <div className="text-sm font-bold text-white">{item.a}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-6 border-l-4 border-blue-400">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-teal-300" size={20} />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Guideline Relevance Summary</h3>
        </div>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          The **{selectedStandard}** standard requires a minimum seizure-free period of 5 years for commercial vehicle operation. 
          Current documentation indicates a 3-year seizure-free period, triggering a **Mandatory SME Review** flag.
        </p>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-[10px] font-black text-white/30 uppercase mb-2">Required Action Items</div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-xs text-white/60">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Obtain formal neurology clearance specifically addressing FMCSA §391.41.
            </li>
            <li className="flex items-center gap-2 text-xs text-white/60">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Verify therapeutic levels of Levetiracetam.
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
          Guideline relevance does not equal final determination. This is a review flag only.
        </p>
      </div>
    </div>
  );
}

function Activity({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
}

function Briefcase({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
}
