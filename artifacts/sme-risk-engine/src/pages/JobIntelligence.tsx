import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, Search, FileText, Shield, Activity, 
  CheckCircle2, AlertCircle, Info, Globe, ChevronRight 
} from 'lucide-react';

export default function JobIntelligence() {
  const [activeView, setActiveView] = useState('reconciliation');
  const [jobPostingText, setJobPostingText] = useState('');
  const [extractedDuties, setExtractedDuties] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractIntelligence = () => {
    if (!jobPostingText.trim()) return;
    setIsExtracting(true);
    // Simulate extraction with simple heuristics
    const duties = jobPostingText
      .split(/[.\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && (s.includes('must') || s.includes('will') || s.includes('should') || s.includes('responsible')));
    setTimeout(() => {
      setExtractedDuties(duties.slice(0, 5));
      setIsExtracting(false);
    }, 500);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">JOB INTELLIGENCE ENGINE</h1>
          <p className="text-white/40 font-medium uppercase tracking-widest text-xs mt-1">Essential Function Reconciliation & O*NET Integration</p>
        </div>
        <div className="flex gap-2">
          {['Reconciliation', 'O*NET Search', 'Job Postings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveView(tab.toLowerCase().replace('*', ''))}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeView === tab.toLowerCase().replace('*', '')
                  ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Main Content Area */}
        <div className="col-span-9 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          {activeView === 'reconciliation' && (
          <div className="glass-card p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Essential Function Reconciliation</h2>
                <p className="text-white/40 text-xs font-bold mt-1">Comparing O*NET, Employer, and SME-defined duties</p>
              </div>
              <div className="flex gap-2">
                <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-full px-3 py-1 text-[9px] font-black text-emerald-400 uppercase">
                  High Confidence
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <ReconciliationRow 
                duty="Operates commercial passenger bus on fixed routes" 
                source="Employer JD" 
                confidence="High"
                category="Physical / Cognitive"
                safetySensitive={true}
              />
              <ReconciliationRow 
                duty="Maintains situational awareness in high-traffic environments" 
                source="O*NET (53-3021.00)" 
                confidence="Moderate"
                category="Cognitive"
                safetySensitive={true}
              />
              <ReconciliationRow 
                duty="Assists passengers with boarding and luggage" 
                source="SME Entered" 
                confidence="High"
                category="Physical"
                safetySensitive={false}
              />
              <ReconciliationRow 
                duty="Performs pre-trip and post-trip vehicle inspections" 
                source="Client Standard" 
                confidence="High"
                category="Physical"
                safetySensitive={true}
              />
            </div>
          </div>
          )}

          {activeView === 'onet' && (
          <div className="glass-card p-8">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">O*NET Occupation Search</h2>
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="Search O*NET occupations..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 outline-none focus:border-blue-500/50"
              />
              <button className="px-6 py-3 bg-blue-500 text-white rounded-xl text-xs font-bold uppercase hover:bg-blue-600 transition-colors">
                Search
              </button>
            </div>
            <div className="space-y-3">
              {['Bus Driver', 'Truck Driver', 'Taxi Driver', 'Delivery Driver'].map(job => (
                <div key={job} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/50 cursor-pointer transition-all">
                  <div className="font-bold text-white">{job}</div>
                  <div className="text-xs text-white/40 mt-1">Click to view O*NET profile</div>
                </div>
              ))}
            </div>
          </div>
          )}

          {activeView === 'jobpostings' && (
          <div className="glass-card p-8">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">Job Postings Intelligence</h2>
            <div className="space-y-4">
              <textarea
                value={jobPostingText}
                onChange={e => setJobPostingText(e.target.value)}
                placeholder="Paste job posting text here for AI extraction..."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 resize-none"
              />
              <button
                onClick={handleExtractIntelligence}
                disabled={isExtracting || !jobPostingText.trim()}
                className="w-full bg-blue-500 text-white py-3 rounded-xl text-xs font-bold uppercase hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isExtracting ? 'Extracting...' : 'Extract Intelligence'}
              </button>
            </div>
            {extractedDuties.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-white mb-3">Extracted Duties:</h3>
                <div className="space-y-2">
                  {extractedDuties.map((duty, idx) => (
                    <div key={idx} className="p-3 bg-emerald-400/10 border border-emerald-400/30 rounded-lg text-xs text-white">
                      {duty}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Physical Demands Extraction</h3>
              <div className="space-y-3">
                {['Prolonged Sitting (8+ hours)', 'Lifting up to 50 lbs', 'Bending/Stooping', 'Operating Foot Controls'].map(demand => (
                  <div key={demand} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-xs text-white/80 font-medium">{demand}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Cognitive & Safety Demands</h3>
              <div className="space-y-3">
                {['Public Safety Responsibility', 'Night Shift Work', 'Emergency Decision Making', 'Radio Communication'].map(demand => (
                  <div key={demand} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <Shield size={14} className="text-blue-400" />
                    <span className="text-xs text-white/80 font-medium">{demand}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Links Sidebar */}
        <div className="col-span-3 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Intelligence Search</h3>
            <div className="space-y-4">
              <SearchLink label="Employer Career Postings" />
              <SearchLink label="Public Job Descriptions" />
              <SearchLink label="O*NET Occupation Profile" />
              <SearchLink label="Similar Occupation Profiles" />
            </div>
          </div>

          <div className="glass-card p-6 border-dashed border-white/20">
            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Paste Job Posting</h3>
            {/* Moved to Job Postings tab */}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReconciliationRow({ duty, source, confidence, category, safetySensitive }: any) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${safetySensitive ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
          <h4 className="text-sm font-bold text-white/90">{duty}</h4>
        </div>
        <div className="flex gap-2">
          <span className="text-[8px] font-black text-white/30 uppercase bg-white/5 px-2 py-0.5 rounded">{source}</span>
          <span className="text-[8px] font-black text-blue-400 uppercase bg-blue-400/10 px-2 py-0.5 rounded">{category}</span>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-[10px] text-white/40">Confidence: <span className="text-white/60">{confidence}</span></div>
        <button className="text-[10px] font-black text-blue-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Confirm Duty</button>
      </div>
    </div>
  );
}

function SearchLink({ label }: { label: string }) {
  const handleClick = () => {
    // Placeholder for search functionality
    console.log(`Searching for: ${label}`);
  };
  return (
    <div onClick={handleClick} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
      <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">{label}</span>
      <ChevronRight size={14} className="text-white/20" />
    </div>
  );
}
