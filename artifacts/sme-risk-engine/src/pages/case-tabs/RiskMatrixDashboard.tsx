import React from 'react';
import { motion } from 'framer-motion';
import { calculateWeightedRisk } from '../../lib/riskScoringEngine';
import { SMECase } from '../../lib/types';
import { Shield, FileText, Activity, AlertCircle } from 'lucide-react';

interface RiskMatrixDashboardProps {
  caseData: SMECase;
}

export default function RiskMatrixDashboard({ caseData }: RiskMatrixDashboardProps) {
  const riskAnalysis = calculateWeightedRisk(caseData);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard label="Support Planning" score={riskAnalysis.supportPlanningNeed} color="text-teal-300" />
        <ScoreCard label="Doc Completion" score={riskAnalysis.documentationConcern} color="text-amber-400" />
        <ScoreCard label="Treatment Continuity" score={riskAnalysis.treatmentContinuityConcern} color="text-slate-300" />
        <ScoreCard label="Follow-up Feasibility" score={riskAnalysis.followUpFeasibilityConcern} color="text-teal-300" />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">The Engine Room — Risk Matrix</h3>
          <span className="text-[10px] font-bold text-white/30 uppercase">Weighted Contextual Logic v1.0</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-white/2 border-b border-white/5">
              <th className="px-6 py-4 font-black text-white/40 uppercase">Condition</th>
              <th className="px-6 py-4 font-black text-white/40 uppercase">Job Duty</th>
              <th className="px-6 py-4 font-black text-white/40 uppercase">Standard</th>
              <th className="px-6 py-4 font-black text-white/40 uppercase">SME Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {caseData.medicalConditions.map((mc, idx) => (
              <tr key={mc.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{mc.conditionName}</div>
                  <div className="text-[10px] text-white/40">{mc.status}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-white/70">{caseData.jobTitle}</div>
                  <div className="flex gap-1 mt-1">
                    {Object.entries(caseData.jobDuties.safetySensitiveFlags)
                      .filter(([_, v]) => v)
                      .map(([k]) => (
                        <span key={k} className="text-[8px] bg-red-400/10 text-red-400 px-1.5 py-0.5 rounded uppercase font-black">
                          {k}
                        </span>
                      ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-white/70">{caseData.agencyStandard}</div>
                  <div className="text-[10px] text-teal-300 font-bold">Review Required</div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    idx === 0 ? 'bg-red-400/10 text-red-400' : 'bg-white/5 text-white/40'
                  }`}>
                    <AlertCircle size={10} />
                    {idx === 0 ? 'CRITICAL' : 'ROUTINE'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Active Contextual Modifiers</h3>
        <div className="flex flex-wrap gap-2">
          {riskAnalysis.modifiers.map((mod, i) => (
            <span key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white/60">
              {mod}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, color }: any) {
  return (
    <div className="glass-card p-5 flex flex-col items-center justify-center text-center">
      <div className="text-[10px] font-black text-white/30 uppercase mb-2">{label}</div>
      <div className={`text-3xl font-black ${color}`}>{score}/10</div>
      <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score * 10}%` }}
          className={`h-full ${color.replace('text', 'bg')}`}
        />
      </div>
    </div>
  );
}
