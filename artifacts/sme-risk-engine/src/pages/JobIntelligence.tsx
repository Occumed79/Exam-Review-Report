import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plus, Save, Shield, Trash2 } from 'lucide-react';

type DutyType = 'Physical' | 'Cognitive' | 'Environmental' | 'Safety-sensitive';

type SavedDuty = {
  id: string;
  duty: string;
  source: string;
  confidence: 'Low' | 'Moderate' | 'High';
  types: DutyType[];
};

const STORAGE_KEY = 'sme_job_intelligence_duties';

const seedDuties: SavedDuty[] = [
  {
    id: 'duty-bus-operations',
    duty: 'Operates commercial passenger bus on fixed routes',
    source: 'Employer JD',
    confidence: 'High',
    types: ['Physical', 'Cognitive', 'Safety-sensitive'],
  },
  {
    id: 'duty-awareness',
    duty: 'Maintains situational awareness in high-traffic environments',
    source: 'SME Entered',
    confidence: 'Moderate',
    types: ['Cognitive', 'Safety-sensitive'],
  },
  {
    id: 'duty-inspections',
    duty: 'Performs pre-trip and post-trip vehicle inspections',
    source: 'Client Standard',
    confidence: 'High',
    types: ['Physical', 'Safety-sensitive'],
  },
];

function loadDuties(): SavedDuty[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDuties;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedDuties;
  } catch {
    return seedDuties;
  }
}

function saveDuties(duties: SavedDuty[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(duties));
}

const blankDuty: Omit<SavedDuty, 'id'> = {
  duty: '',
  source: 'SME Entered',
  confidence: 'Moderate',
  types: ['Physical'],
};

export default function JobIntelligence() {
  const [activeView, setActiveView] = useState<'reconciliation' | 'jobpostings'>('reconciliation');
  const [jobPostingText, setJobPostingText] = useState('');
  const [duties, setDuties] = useState<SavedDuty[]>(loadDuties);
  const [form, setForm] = useState<Omit<SavedDuty, 'id'>>(blankDuty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    saveDuties(duties);
  }, [duties]);

  const filteredDuties = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return duties;
    return duties.filter(d => [d.duty, d.source, d.confidence, ...d.types].join(' ').toLowerCase().includes(q));
  }, [duties, query]);

  const resetForm = () => {
    setForm(blankDuty);
    setEditingId(null);
  };

  const handleSaveDuty = () => {
    if (!form.duty.trim()) {
      setNotice('Enter a duty before saving.');
      return;
    }

    if (editingId) {
      setDuties(prev => prev.map(d => d.id === editingId ? { ...form, id: editingId, duty: form.duty.trim() } : d));
      setNotice('Duty updated.');
    } else {
      setDuties(prev => [{ ...form, id: `duty-${Date.now()}`, duty: form.duty.trim() }, ...prev]);
      setNotice('Duty saved.');
    }
    resetForm();
  };

  const handleEdit = (duty: SavedDuty) => {
    setEditingId(duty.id);
    setForm({ duty: duty.duty, source: duty.source, confidence: duty.confidence, types: duty.types });
    setActiveView('reconciliation');
    setNotice('Editing selected duty.');
  };

  const handleDelete = (id: string) => {
    const target = duties.find(d => d.id === id);
    if (!target) return;
    if (!window.confirm(`Delete this duty?\n\n${target.duty}`)) return;
    setDuties(prev => prev.filter(d => d.id !== id));
    setNotice('Duty deleted.');
  };

  const toggleType = (type: DutyType) => {
    setForm(prev => {
      const exists = prev.types.includes(type);
      const nextTypes = exists ? prev.types.filter(t => t !== type) : [...prev.types, type];
      return { ...prev, types: nextTypes.length ? nextTypes : [type] };
    });
  };

  const extractFromPosting = () => {
    const lines = jobPostingText
      .split(/[\n.]/)
      .map(line => line.trim())
      .filter(line => line.length > 12);

    const extracted = lines.slice(0, 8).map((line, index): SavedDuty => ({
      id: `duty-extracted-${Date.now()}-${index}`,
      duty: line,
      source: 'Pasted Job Posting',
      confidence: 'Moderate',
      types: classifyDuty(line),
    }));

    if (!extracted.length) {
      setNotice('Paste job duty text first.');
      return;
    }

    setDuties(prev => [...extracted, ...prev]);
    setJobPostingText('');
    setNotice(`${extracted.length} duties added from pasted text.`);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">JOB INTELLIGENCE ENGINE</h1>
          <p className="text-white/40 font-medium uppercase tracking-widest text-xs mt-1">Manual essential function reconciliation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveView('reconciliation')} className={tabClass(activeView === 'reconciliation')}>Duties</button>
          <button onClick={() => setActiveView('jobpostings')} className={tabClass(activeView === 'jobpostings')}>Paste JD</button>
        </div>
      </div>

      {notice && (
        <div className="glass-card p-3 text-xs font-bold text-teal-100 border-teal-400/20 flex justify-between items-center">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-white/40 hover:text-white">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 min-h-0 flex-1">
        <div className="col-span-8 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          {activeView === 'reconciliation' ? (
            <div className="glass-card p-8">
              <div className="flex justify-between items-start mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Essential Functions</h2>
                  <p className="text-white/40 text-xs font-bold mt-1">Add, edit, classify, and save duties locally.</p>
                </div>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search saved duties..."
                  className="w-72 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-teal-400/40"
                />
              </div>

              <div className="space-y-4">
                {filteredDuties.map(duty => (
                  <ReconciliationRow key={duty.id} duty={duty} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
                {!filteredDuties.length && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/50">No duties match your search.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">Paste Job Description</h2>
              <p className="text-white/40 text-xs font-bold mb-4">Paste text here. The app will split it into draft duties and save them locally. No AI or live web search is running.</p>
              <textarea
                value={jobPostingText}
                onChange={e => setJobPostingText(e.target.value)}
                placeholder="Paste job description or essential function text here..."
                className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 outline-none focus:border-teal-400/40 resize-none"
              />
              <button onClick={extractFromPosting} className="mt-4 w-full bg-teal-700/80 text-white py-3 rounded-xl text-xs font-bold uppercase hover:bg-teal-600/80 transition-colors">
                Add Parsed Duties
              </button>
            </div>
          )}
        </div>

        <div className="col-span-4 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">{editingId ? 'Edit Duty' : 'Add Duty'}</h3>
            <div className="space-y-3">
              <textarea
                value={form.duty}
                onChange={e => setForm(prev => ({ ...prev, duty: e.target.value }))}
                placeholder="Type one essential job function..."
                className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-teal-400/40 resize-none"
              />
              <input
                value={form.source}
                onChange={e => setForm(prev => ({ ...prev, source: e.target.value }))}
                placeholder="Source, example: SME Entered"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-teal-400/40"
              />
              <select
                value={form.confidence}
                onChange={e => setForm(prev => ({ ...prev, confidence: e.target.value as SavedDuty['confidence'] }))}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-teal-400/40"
              >
                <option>Low</option>
                <option>Moderate</option>
                <option>High</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                {(['Physical', 'Cognitive', 'Environmental', 'Safety-sensitive'] as DutyType[]).map(type => (
                  <button key={type} onClick={() => toggleType(type)} className={`p-2 rounded-xl text-[10px] font-black uppercase transition-all ${form.types.includes(type) ? 'bg-teal-400/15 text-teal-200 border border-teal-400/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveDuty} className="flex-1 flex items-center justify-center gap-2 bg-teal-700/80 text-white py-3 rounded-xl text-xs font-bold uppercase hover:bg-teal-600/80 transition-colors">
                  <Save size={14} /> Save
                </button>
                {editingId && <button onClick={resetForm} className="px-4 bg-white/10 text-white/70 rounded-xl text-xs font-bold uppercase hover:bg-white/15">Cancel</button>}
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Duty Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <Summary label="Total" value={duties.length} />
              <Summary label="Safety" value={duties.filter(d => d.types.includes('Safety-sensitive')).length} />
              <Summary label="Physical" value={duties.filter(d => d.types.includes('Physical')).length} />
              <Summary label="Cognitive" value={duties.filter(d => d.types.includes('Cognitive')).length} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function classifyDuty(text: string): DutyType[] {
  const lower = text.toLowerCase();
  const types = new Set<DutyType>();
  if (/lift|carry|stand|walk|climb|bend|kneel|drive|operate|wear|push|pull/.test(lower)) types.add('Physical');
  if (/decid|judgment|attention|aware|communicat|document|inspect|monitor|coordinate/.test(lower)) types.add('Cognitive');
  if (/heat|cold|dust|fumes|outdoor|remote|austere|altitude|weather|noise/.test(lower)) types.add('Environmental');
  if (/drive|weapon|emergency|security|patient|public safety|hazard|machinery|aviation/.test(lower)) types.add('Safety-sensitive');
  return types.size ? Array.from(types) : ['Physical'];
}

function tabClass(active: boolean) {
  return `px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-teal-700/80 text-white shadow-[0_0_16px_rgba(127,157,150,0.35)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`;
}

function ReconciliationRow({ duty, onEdit, onDelete }: { duty: SavedDuty; onEdit: (d: SavedDuty) => void; onDelete: (id: string) => void }) {
  const safetySensitive = duty.types.includes('Safety-sensitive');
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
      <div className="flex justify-between items-start mb-3 gap-4">
        <div className="flex items-start gap-3">
          <div className={`mt-1.5 w-2 h-2 rounded-full ${safetySensitive ? 'bg-red-400 animate-pulse' : 'bg-teal-400'}`} />
          <h4 className="text-sm font-bold text-white/90 leading-relaxed">{duty.duty}</h4>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onEdit(duty)} className="text-[10px] font-black text-teal-200 uppercase bg-teal-400/10 hover:bg-teal-400/20 px-3 py-1 rounded-lg">Edit</button>
          <button onClick={() => onDelete(duty.id)} className="text-[10px] font-black text-red-300 uppercase bg-red-400/10 hover:bg-red-400/20 px-3 py-1 rounded-lg flex items-center gap-1"><Trash2 size={11} /> Delete</button>
        </div>
      </div>
      <div className="flex justify-between items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="text-[8px] font-black text-white/40 uppercase bg-white/5 px-2 py-0.5 rounded">{duty.source}</span>
          {duty.types.map(type => <span key={type} className="text-[8px] font-black text-teal-200 uppercase bg-teal-400/10 px-2 py-0.5 rounded">{type}</span>)}
        </div>
        <div className="text-[10px] text-white/40">Confidence: <span className="text-white/70">{duty.confidence}</span></div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">{label}</div>
    </div>
  );
}
