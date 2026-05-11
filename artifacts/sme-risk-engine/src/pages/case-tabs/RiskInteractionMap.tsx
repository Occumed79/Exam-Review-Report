import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Pill, Briefcase, Shield, Globe, AlertTriangle } from 'lucide-react';
import { SMECase } from '../../lib/types';

interface RiskInteractionMapProps {
  caseData: SMECase;
}

export default function RiskInteractionMap({ caseData }: RiskInteractionMapProps) {
  return (
    <div className="relative h-[600px] w-full glass-card overflow-hidden flex items-center justify-center">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
        backgroundSize: '30px 30px' 
      }} />

      {/* Central Node - The Case */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="relative z-10 w-32 h-32 rounded-full bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center backdrop-blur-xl shadow-[0_0_50px_rgba(255,255,255,0.1)]"
      >
        <div className="text-[10px] font-black text-white/40 uppercase">Case ID</div>
        <div className="text-sm font-black text-white">{caseData.caseId}</div>
        <div className="absolute -inset-4 rounded-full border border-white/5 animate-ping" />
      </motion.div>

      {/* Satellite Nodes */}
      <Node 
        icon={<Activity className="text-red-400" />} 
        label="Condition" 
        value="Seizure Disorder" 
        x={-200} y={-150} 
        color="rgba(248, 113, 113, 0.5)"
      />
      <Node 
        icon={<Pill className="text-purple-400" />} 
        label="Medication" 
        value="Levetiracetam" 
        x={200} y={-150} 
        color="rgba(192, 132, 252, 0.5)"
      />
      <Node 
        icon={<Briefcase className="text-amber-400" />} 
        label="Job Duty" 
        value="Bus Operator" 
        x={-200} y={150} 
        color="rgba(251, 191, 36, 0.5)"
      />
      <Node 
        icon={<Shield className="text-blue-400" />} 
        label="Standard" 
        value="DOT/FMCSA" 
        x={200} y={150} 
        color="rgba(96, 165, 250, 0.5)"
      />

      {/* Interaction Lines (Visual Only for now) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <line x1="50%" y1="50%" x2="calc(50% - 200px)" y2="calc(50% - 150px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="calc(50% + 200px)" y2="calc(50% - 150px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="calc(50% - 200px)" y2="calc(50% + 150px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="calc(50% + 200px)" y2="calc(50% + 150px)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        
        {/* The "Why" Connection */}
        <motion.path 
          d="M calc(50% - 200px) calc(50% - 150px) Q 50% 0 50% 50%" 
          fill="none" stroke="rgba(248, 113, 113, 0.3)" strokeWidth="2" strokeDasharray="5,5"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
      </svg>

      {/* Legend / Info Overlay */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
        <div className="glass-card p-4 border-l-4 border-red-400 max-w-xs">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <AlertTriangle size={14} />
            <span className="text-[10px] font-black uppercase">Critical Interaction</span>
          </div>
          <p className="text-[11px] text-white/70 leading-tight">
            Seizure Disorder + Commercial Driving triggers a high-risk safety-sensitive flag under DOT/FMCSA standards.
          </p>
        </div>
        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
          Risk Interaction Map v1.0
        </div>
      </div>
    </div>
  );
}

function Node({ icon, label, value, x, y, color }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{ opacity: 1, x, y }}
      className="absolute z-20 flex flex-col items-center gap-2"
    >
      <div 
        className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-xl"
        style={{ boxShadow: `0 0 20px ${color}` }}
      >
        {icon}
      </div>
      <div className="text-center">
        <div className="text-[9px] font-black text-white/30 uppercase tracking-tighter">{label}</div>
        <div className="text-[11px] font-bold text-white">{value}</div>
      </div>
    </motion.div>
  );
}
