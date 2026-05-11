import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { SMECase } from '../../lib/types';

interface JobDutyMatchMatrixProps {
  caseData: SMECase;
}

export default function JobDutyMatchMatrix({ caseData }: JobDutyMatchMatrixProps) {
  const interactions = caseData.riskInteractions || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Job-Duty Match Matrix</h2>
          <p className="text-sm text-white/40">Cross-referencing clinical conditions against occupational demands</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-400" /> High Risk
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <div className="w-2 h-2 rounded-full bg-amber-400" /> Moderate Risk
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {interactions.length > 0 ? (
          interactions.map((interaction, idx) => (
            <motion.div
              key={interaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-5 border-l-4"
              style={{ borderLeftColor: interaction.severity === 'high' ? '#ef4444' : '#f59e0b' }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {interaction.severity === 'high' ? (
                    <ShieldAlert className="text-red-400" size={20} />
                  ) : (
                    <AlertTriangle className="text-amber-400" size={20} />
                  )}
                  <h3 className="font-bold text-white">{interaction.description}</h3>
                </div>
                <span className={`text-[10px] uppercase font-black px-2 py-1 rounded ${
                  interaction.severity === 'high' ? 'bg-red-400/10 text-red-400' : 'bg-amber-400/10 text-amber-400'
                }`}>
                  {interaction.severity} Risk Interaction
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] uppercase text-white/30 font-bold mb-1">Rationale</div>
                  <p className="text-sm text-white/70 leading-relaxed">{interaction.rationale}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-[10px] uppercase text-white/30 font-bold mb-2">SME Intelligence Guidance</div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-xs text-white/60">
                      <Info size={12} className="mt-0.5 text-teal-300" />
                      <span>Review longitudinal stability of primary condition.</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-white/60">
                      <Info size={12} className="mt-0.5 text-teal-300" />
                      <span>Verify medication compliance and side effect profile.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass-card p-12 text-center">
            <CheckCircle2 className="mx-auto text-white/20 mb-4" size={48} />
            <h3 className="text-white font-bold">No Critical Interactions Detected</h3>
            <p className="text-sm text-white/40">The engine has not identified any high-risk matches between current conditions and job duties.</p>
          </div>
        )}
      </div>

      {/* Safety Sensitive Flags */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Safety-Sensitive Duty Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(caseData.jobDuties.safetySensitiveFlags || {}).map(([key, value]) => (
            <div 
              key={key} 
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                value 
                  ? 'bg-red-400/10 border-red-400/30 text-red-400' 
                  : 'bg-white/5 border-white/10 text-white/20'
              }`}
            >
              <div className="text-[10px] font-black uppercase text-center">{key.replace(/([A-Z])/g, ' $1')}</div>
              {value ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
