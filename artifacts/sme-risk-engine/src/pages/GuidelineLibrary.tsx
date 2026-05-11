import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, Activity, Pill, Shield, AlertCircle, 
  ChevronRight, Search, BookOpen, FileText, Info 
} from 'lucide-react';

export default function GuidelineLibrary() {
  const [selectedCategory, setSelectedCategory] = useState('neurologic');

  const categories = [
    { id: 'cardiovascular', name: 'Cardiovascular', icon: <Heart size={18} /> },
    { id: 'respiratory', name: 'Respiratory', icon: <Activity size={18} /> },
    { id: 'neurologic', name: 'Neurologic', icon: <Activity size={18} /> },
    { id: 'endocrine', name: 'Endocrine', icon: <Pill size={18} /> },
    { id: 'orthopedic', name: 'Orthopedic', icon: <Activity size={18} /> },
    { id: 'psychiatric', name: 'Psychiatric', icon: <Activity size={18} /> },
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">CONDITION INTELLIGENCE</h1>
          <p className="text-white/40 font-medium uppercase tracking-widest text-xs mt-1">Clinical Intelligence Atlas & Risk Pathways</p>
        </div>
        <div className="glass-card px-4 py-2 flex items-center gap-3 border-white/10">
          <Search size={16} className="text-white/40" />
          <input type="text" placeholder="Search Conditions..." className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20 w-64" />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Category Navigation */}
        <div className="col-span-3 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                selectedCategory === cat.id 
                  ? 'bg-teal-500/10 border-teal-400/40 text-teal-300' 
                  : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedCategory === cat.id ? 'bg-teal-700/80 text-white' : 'bg-white/5'
              }`}>
                {cat.icon}
              </div>
              <span className="font-bold text-sm uppercase tracking-wider">{cat.name}</span>
              <ChevronRight size={16} className="ml-auto opacity-20" />
            </button>
          ))}
        </div>

        {/* Condition Details */}
        <div className="col-span-9 grid grid-cols-2 gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-6">
            <div className="glass-card p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Seizure Disorder</h2>
                  <p className="text-teal-300 text-xs font-black uppercase tracking-widest mt-1">Neurologic Intelligence Path</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                  <Activity size={24} />
                </div>
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Functional Limitations</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Sudden Incapacitation', 'Cognitive Impairment', 'Fatigue', 'Reaction Time'].map(tag => (
                      <span key={tag} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white/70">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Safety-Sensitive Concerns</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Primary concern is sudden loss of consciousness while operating heavy machinery, driving, or working at heights. 
                    Medication side effects (sedation) may further impair situational awareness.
                  </p>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                    <div className="text-[10px] font-black text-red-400 uppercase mb-1">Critical Trigger</div>
                    <div className="text-xs font-bold text-white/80">Breakthrough seizure within 5 years</div>
                  </div>
                  <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-4">
                    <div className="text-[10px] font-black text-teal-300 uppercase mb-1">Evidence Strength</div>
                    <div className="text-xs font-bold text-white/80">High (Regulatory Consensus)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Suggested Provider Questions</h3>
              <ul className="space-y-3">
                {[
                  "What is the exact date of the last seizure event?",
                  "Is the patient compliant with the current medication regimen?",
                  "Are there any reported side effects affecting alertness?",
                  "Has a recent EEG or MRI been performed?"
                ].map((q, i) => (
                  <li key={i} className="flex gap-3 text-xs text-white/70 leading-tight">
                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-white/30 shrink-0">
                      {i + 1}
                    </div>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Report-Ready Language</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                  <div className="text-[9px] font-black text-white/20 uppercase mb-2">Neutral Observation</div>
                  <p className="text-xs text-white/60 italic leading-relaxed">
                    "The examinee has a documented history of seizure disorder, currently managed with anticonvulsant therapy. 
                    The most recent event occurred in [Date], indicating a seizure-free period of [Duration]."
                  </p>
                  <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-teal-300 uppercase">Copy</button>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                  <div className="text-[9px] font-black text-white/20 uppercase mb-2">Risk Synthesis</div>
                  <p className="text-xs text-white/60 italic leading-relaxed">
                    "In the context of safety-sensitive duties, the primary clinical consideration is the risk of sudden incapacitation. 
                    Regulatory standards (e.g., FMCSA) typically require a specific seizure-free interval for such roles."
                  </p>
                  <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-teal-300 uppercase">Copy</button>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Relevant Standards</h3>
              <div className="space-y-2">
                {['DOT/FMCSA §391.41', 'FAA Class 1/2/3', 'NFPA 1582', 'MOD Deployment Standards'].map(std => (
                  <div key={std} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                    <span className="text-xs font-bold text-white/80">{std}</span>
                    <ChevronRight size={14} className="text-white/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
