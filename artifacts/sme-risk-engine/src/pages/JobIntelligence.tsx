import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Trash2, ExternalLink, CheckCircle2, ChevronDown, ChevronRight, Zap, BookOpen, AlertTriangle } from 'lucide-react';
import { searchONetJobs, ONET_JOB_DATABASE, type ONetJob } from '@/lib/onetJobDatabase';

type DutyType = 'Physical' | 'Cognitive' | 'Environmental' | 'Safety-sensitive';

type SavedDuty = {
  id: string;
  duty: string;
  source: string;
  confidence: 'Low' | 'Moderate' | 'High';
  types: DutyType[];
};

const STORAGE_KEY = 'sme_job_intelligence_duties';
const SELECTED_JOB_KEY = 'sme_selected_job';

function loadDuties(): SavedDuty[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
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

function classifyDuty(text: string): DutyType[] {
  const t = text.toLowerCase();
  const types: DutyType[] = [];
  if (/lift|carry|climb|stand|walk|push|pull|bend|stoop|kneel|squat|reach|physical|strength|endur|run|sprint|wear|don|doff/.test(t)) types.push('Physical');
  if (/decision|think|memory|alert|attention|cognitive|read|write|communicate|nav|comput|judg|assess/.test(t)) types.push('Cognitive');
  if (/chemical|heat|cold|noise|dust|fume|radiation|outdoor|weather|toxic|hazard|exposure/.test(t)) types.push('Environmental');
  if (/drive|operat|pilot|firearm|weapon|safety.sensitive|safety sensitive|emergency|critical|public safety/.test(t)) types.push('Safety-sensitive');
  return types.length ? types : ['Physical'];
}

export default function JobIntelligence() {
  const [view, setView] = useState<'lookup' | 'duties' | 'paste'>('lookup');
  const [duties, setDuties] = useState<SavedDuty[]>(loadDuties);
  const [selectedJob, setSelectedJob] = useState<ONetJob | null>(() => {
    try { const raw = localStorage.getItem(SELECTED_JOB_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [jobSearch, setJobSearch] = useState('');
  const [form, setForm] = useState<Omit<SavedDuty, 'id'>>(blankDuty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dutySearch, setDutySearch] = useState('');
  const [notice, setNotice] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => { saveDuties(duties); }, [duties]);
  useEffect(() => {
    if (selectedJob) localStorage.setItem(SELECTED_JOB_KEY, JSON.stringify(selectedJob));
    else localStorage.removeItem(SELECTED_JOB_KEY);
  }, [selectedJob]);

  const jobResults = useMemo(() => searchONetJobs(jobSearch), [jobSearch]);

  const filteredDuties = useMemo(() => {
    const q = dutySearch.trim().toLowerCase();
    if (!q) return duties;
    return duties.filter(d => [d.duty, d.source, d.confidence, ...d.types].join(' ').toLowerCase().includes(q));
  }, [duties, dutySearch]);

  const summary = useMemo(() => ({
    total: duties.length,
    physical: duties.filter(d => d.types.includes('Physical')).length,
    cognitive: duties.filter(d => d.types.includes('Cognitive')).length,
    safety: duties.filter(d => d.types.includes('Safety-sensitive')).length,
    environmental: duties.filter(d => d.types.includes('Environmental')).length,
  }), [duties]);

  const toast = (msg: string) => { setNotice(msg); setTimeout(() => setNotice(''), 3000); };

  const loadJobFromONet = (job: ONetJob) => {
    setSelectedJob(job);
    const newDuties: SavedDuty[] = [];
    job.essentialFunctions.forEach(fn => {
      newDuties.push({ id: `onet-ef-${Date.now()}-${Math.random()}`, duty: fn, source: `O*NET ${job.socCode}`, confidence: 'High', types: classifyDuty(fn) });
    });
    job.physicalDemands.forEach(pd => {
      if (!job.essentialFunctions.some(ef => ef.toLowerCase().includes(pd.toLowerCase().substring(0, 20)))) {
        newDuties.push({ id: `onet-pd-${Date.now()}-${Math.random()}`, duty: pd, source: `O*NET ${job.socCode} (Physical)`, confidence: 'High', types: ['Physical', ...(classifyDuty(pd).filter(t => t !== 'Physical'))] });
      }
    });
    job.cognitiveRequirements.forEach(cr => {
      newDuties.push({ id: `onet-cog-${Date.now()}-${Math.random()}`, duty: cr, source: `O*NET ${job.socCode} (Cognitive)`, confidence: 'High', types: ['Cognitive'] });
    });
    setDuties(prev => {
      const existingNonOnet = prev.filter(d => !d.source.startsWith('O*NET'));
      return [...newDuties, ...existingNonOnet];
    });
    setView('duties');
    toast(`✓ Loaded ${newDuties.length} functions from O*NET for ${job.title}`);
  };

  const handleSaveDuty = () => {
    if (!form.duty.trim()) { toast('Enter a duty first.'); return; }
    if (editingId) {
      setDuties(prev => prev.map(d => d.id === editingId ? { ...form, id: editingId, duty: form.duty.trim() } : d));
      toast('Duty updated.');
      setEditingId(null);
    } else {
      setDuties(prev => [{ ...form, id: `custom-${Date.now()}`, duty: form.duty.trim() }, ...prev]);
      toast('Duty added.');
    }
    setForm(blankDuty);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setDuties(prev => prev.filter(d => d.id !== id));
  };

  const toggleType = (type: DutyType) => {
    setForm(prev => {
      const exists = prev.types.includes(type);
      const next = exists ? prev.types.filter(t => t !== type) : [...prev.types, type];
      return { ...prev, types: next.length ? next : [type] };
    });
  };

  const parsePaste = () => {
    const lines = pasteText.split(/[\n.]/).map(l => l.trim()).filter(l => l.length > 12).slice(0, 12);
    if (!lines.length) { toast('No usable lines found. Paste job description text first.'); return; }
    const extracted: SavedDuty[] = lines.map((line, i) => ({
      id: `paste-${Date.now()}-${i}`, duty: line, source: 'Pasted JD', confidence: 'Moderate', types: classifyDuty(line),
    }));
    setDuties(prev => [...extracted, ...prev]);
    setPasteText('');
    setView('duties');
    toast(`Added ${extracted.length} duties from pasted text.`);
  };

  const TYPE_COLORS: Record<string, string> = {
    'Physical': '#b4d7d0', 'Cognitive': '#d6c8aa', 'Safety-sensitive': '#ef4444', 'Environmental': '#7f9d96'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#f4efdc', letterSpacing: '-0.03em', margin: 0 }}>JOB INTELLIGENCE ENGINE</h1>
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            Auto-populated from O*NET · BLS · DOL
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['lookup', 'duties', 'paste'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={v === view ? 'tab-btn active-tab' : 'tab-btn'} style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
              {v === 'lookup' ? '🔍 O*NET Lookup' : v === 'duties' ? `📋 Functions (${duties.length})` : '📋 Paste JD'}
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {notice && (
        <div className="glass-card" style={{ padding: '0.625rem 1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', background: 'rgba(180,215,208,0.12)', borderColor: 'rgba(180,215,208,0.25)' }}>
          <span style={{ fontSize: '0.8125rem', color: '#b4d7d0', fontWeight: 600 }}>{notice}</span>
          <button onClick={() => setNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Dismiss</button>
        </div>
      )}

      {/* O*NET LOOKUP VIEW */}
      {view === 'lookup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {selectedJob && (
            <div className="glass-card" style={{ borderRadius: '12px', padding: '0.875rem 1.125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(180,215,208,0.30)', background: 'rgba(180,215,208,0.08)' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', color: '#b4d7d0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Currently Loaded</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f4efdc' }}>{selectedJob.title}
                  <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: '0.5rem' }}>{selectedJob.socCode}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{selectedJob.category} · {selectedJob.safetySensitive ? '⚠ Safety-Sensitive' : 'Non-Safety-Sensitive'}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={selectedJob.onetUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: '#b4d7d0', textDecoration: 'none', padding: '0.375rem 0.75rem', background: 'rgba(180,215,208,0.10)', borderRadius: '8px', border: '1px solid rgba(180,215,208,0.20)' }}>
                  O*NET <ExternalLink size={11} />
                </a>
                <a href={selectedJob.blsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: '#d6c8aa', textDecoration: 'none', padding: '0.375rem 0.75rem', background: 'rgba(214,200,170,0.10)', borderRadius: '8px', border: '1px solid rgba(214,200,170,0.20)' }}>
                  BLS <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="glass-card" style={{ padding: '0.625rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Search size={16} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input
              autoFocus
              value={jobSearch}
              onChange={e => setJobSearch(e.target.value)}
              placeholder="Search job title, category, or SOC code..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', color: '#f4efdc', width: '100%' }}
            />
            {jobSearch && <button onClick={() => setJobSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>✕</button>}
          </div>

          {/* Results */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {jobResults.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>No matching jobs found. Try "firefighter", "driver", "nurse"…</div>
            )}
            {jobResults.map(job => (
              <div key={job.socCode} className="glass-card" style={{ borderRadius: '12px', padding: '0.875rem 1.125rem', cursor: 'pointer', transition: 'all 0.15s' }}
                onClick={() => loadJobFromONet(job)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f4efdc' }}>{job.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{job.category} · SOC {job.socCode}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                    {job.safetySensitive && (
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '5px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', textTransform: 'uppercase' }}>Safety-Sensitive</span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); loadJobFromONet(job); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, padding: '0.375rem 0.875rem', background: 'rgba(180,215,208,0.15)', border: '1px solid rgba(180,215,208,0.30)', borderRadius: '8px', cursor: 'pointer', color: '#b4d7d0' }}
                    >
                      <Zap size={12} /> Load Functions
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {job.essentialFunctions.slice(0, 3).map((f, i) => (
                    <span key={i} style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.55)', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>{f.substring(0, 60)}{f.length > 60 ? '…' : ''}</span>
                  ))}
                  {job.essentialFunctions.length > 3 && (
                    <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', padding: '0.2rem 0.5rem' }}>+{job.essentialFunctions.length - 3} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DUTIES VIEW */}
      {view === 'duties' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', flex: 1, minHeight: 0 }}>
          {/* Duties List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="glass-card" style={{ flex: 1, padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px' }}>
                <Search size={14} style={{ color: 'rgba(255,255,255,0.35)' }} />
                <input value={dutySearch} onChange={e => setDutySearch(e.target.value)} placeholder="Filter duties..."
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.8125rem', color: '#f4efdc', width: '100%' }} />
              </div>
              <button onClick={() => { setShowAddForm(true); setEditingId(null); setForm(blankDuty); }}
                className="glow-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                <Plus size={13} /> Add Custom
              </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="glass-card" style={{ borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b4d7d0', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{editingId ? 'Edit Function' : 'Add Custom Function'}</div>
                <textarea value={form.duty} onChange={e => setForm(p => ({ ...p, duty: e.target.value }))} placeholder="Describe the essential job function..."
                  style={{ width: '100%', minHeight: '70px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#f4efdc', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: '0.5rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder="Source"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.8125rem', color: '#f4efdc', outline: 'none' }} />
                  <select value={form.confidence} onChange={e => setForm(p => ({ ...p, confidence: e.target.value as SavedDuty['confidence'] }))}
                    style={{ background: 'rgba(20,28,38,0.95)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.8125rem', color: '#f4efdc', outline: 'none' }}>
                    <option>Low</option><option>Moderate</option><option>High</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem' }}>
                  {(['Physical', 'Cognitive', 'Environmental', 'Safety-sensitive'] as DutyType[]).map(type => (
                    <button key={type} onClick={() => toggleType(type)}
                      style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s', background: form.types.includes(type) ? `${TYPE_COLORS[type]}25` : 'rgba(255,255,255,0.04)', border: `1px solid ${form.types.includes(type) ? TYPE_COLORS[type] + '50' : 'rgba(255,255,255,0.10)'}`, color: form.types.includes(type) ? TYPE_COLORS[type] : 'rgba(255,255,255,0.5)' }}>
                      {type}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => { setShowAddForm(false); setEditingId(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSaveDuty} className="glow-btn" style={{ fontSize: '0.75rem' }}>Save</button>
                </div>
              </div>
            )}

            {/* Duty list */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {filteredDuties.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }}>
                  {duties.length === 0 ? 'No functions loaded yet. Use O*NET Lookup or paste a job description.' : 'No matches for your filter.'}
                </div>
              )}
              {filteredDuties.map(duty => (
                <div key={duty.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '0.75rem 0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: '0.75rem' }}>
                      <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.80)', lineHeight: 1.5, margin: '0 0 0.375rem' }}>{duty.duty}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                        {duty.types.map(type => (
                          <span key={type} style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', background: `${TYPE_COLORS[type]}18`, color: TYPE_COLORS[type], border: `1px solid ${TYPE_COLORS[type]}35` }}>{type}</span>
                        ))}
                        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)' }}>{duty.source}</span>
                        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.25)' }}>· {duty.confidence}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                      <button onClick={() => { setEditingId(duty.id); setForm({ duty: duty.duty, source: duty.source, confidence: duty.confidence, types: duty.types }); setShowAddForm(true); }}
                        style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#b4d7d0', background: 'rgba(180,215,208,0.10)', border: '1px solid rgba(180,215,208,0.20)', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(duty.id)}
                        style={{ fontSize: '0.6875rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: '6px', padding: '0.2rem 0.375rem', cursor: 'pointer' }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Summary + Standards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
            {/* Summary */}
            <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem' }}>
              <div className="section-label" style={{ marginBottom: '0.625rem' }}>Duty Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { label: 'Total', val: summary.total, color: '#f4efdc' },
                  { label: 'Safety-Sensitive', val: summary.safety, color: '#ef4444' },
                  { label: 'Physical', val: summary.physical, color: '#b4d7d0' },
                  { label: 'Cognitive', val: summary.cognitive, color: '#d6c8aa' },
                  { label: 'Environmental', val: summary.environmental, color: '#7f9d96' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.625rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Relevant Standards from loaded job */}
            {selectedJob && selectedJob.relevantStandards.length > 0 && (
              <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem' }}>
                <div className="section-label" style={{ marginBottom: '0.625rem' }}>Relevant Standards</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {selectedJob.relevantStandards.map(std => (
                    <div key={std} style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {std}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected job environmental exposures */}
            {selectedJob && selectedJob.environmentalExposures.length > 0 && (
              <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem' }}>
                <div className="section-label" style={{ marginBottom: '0.625rem' }}>Environmental Exposures</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {selectedJob.environmentalExposures.map(exp => (
                    <div key={exp} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <AlertTriangle size={12} style={{ color: '#f59e0b', marginTop: '1px', flexShrink: 0 }} />
                      {exp}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clear / Reset */}
            {duties.length > 0 && (
              <button onClick={() => { if (confirm('Clear all functions?')) { setDuties([]); setSelectedJob(null); toast('Functions cleared.'); } }}
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: '10px', padding: '0.625rem', fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>
                Clear All Functions
              </button>
            )}
          </div>
        </div>
      )}

      {/* PASTE JD VIEW */}
      {view === 'paste' && (
        <div className="glass-card" style={{ borderRadius: '14px', padding: '1.5rem', flex: 1 }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f4efdc', margin: '0 0 0.5rem' }}>Paste Job Description</h2>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1rem' }}>
            Paste job posting text below. The system will extract sentences as draft duties and classify them automatically.
          </p>
          <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste job description or essential function text here..."
            style={{ width: '100%', minHeight: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.875rem', color: '#f4efdc', resize: 'vertical', outline: 'none', marginBottom: '0.75rem', boxSizing: 'border-box' }} />
          <button onClick={parsePaste} className="glow-btn" style={{ width: '100%' }}>
            Extract & Add Duties
          </button>
        </div>
      )}
    </div>
  );
}
