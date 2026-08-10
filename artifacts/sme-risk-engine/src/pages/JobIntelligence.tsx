import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ClipboardCopy,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { getJobByCode, searchONetJobs, type ONetJob } from '@/lib/onetJobDatabase';
import {
  fetchIntelligenceStatus,
  fetchLiveOccupation,
  searchLiveOccupations,
  type IntelligenceStatus,
  type LiveOccupationMatch,
} from '@/lib/liveOccupationalApi';
import './job-workbench.css';

type DutyType = 'Physical' | 'Cognitive' | 'Environmental' | 'Safety-sensitive';
type View = 'lookup' | 'workspace' | 'paste';

type SavedDuty = {
  id: string;
  duty: string;
  source: string;
  confidence: 'Low' | 'Moderate' | 'High';
  types: DutyType[];
};

const STORAGE_KEY = 'sme_job_intelligence_duties';
const SELECTED_JOB_KEY = 'sme_selected_job';

const blankDuty: Omit<SavedDuty, 'id'> = {
  duty: '',
  source: 'Reviewer entered',
  confidence: 'Moderate',
  types: ['Physical'],
};

function loadDuties(): SavedDuty[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSavedJob(): ONetJob | null {
  try {
    const raw = localStorage.getItem(SELECTED_JOB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ONetJob;
    return parsed && typeof parsed.title === 'string' && typeof parsed.socCode === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function localMatches(query: string): LiveOccupationMatch[] {
  return searchONetJobs(query)
    .slice(0, 12)
    .map((job) => ({ title: job.title, code: job.socCode }));
}

function classifyDuty(text: string): DutyType[] {
  const value = text.toLowerCase();
  const types: DutyType[] = [];
  if (/lift|carry|climb|stand|walk|push|pull|bend|stoop|kneel|squat|reach|strength|endur|run|sprint|wear|don|doff/.test(value)) types.push('Physical');
  if (/decision|memory|alert|attention|read|write|communicat|navig|comput|judg|assess|reason/.test(value)) types.push('Cognitive');
  if (/chemical|heat|cold|noise|dust|fume|radiation|outdoor|weather|toxic|hazard|exposure|confined/.test(value)) types.push('Environmental');
  if (/drive|operat|pilot|firearm|weapon|emergency|critical|public safety|high place|hazardous equipment/.test(value)) types.push('Safety-sensitive');
  return types.length ? types : ['Physical'];
}

function occupationDuties(job: ONetJob): SavedDuty[] {
  const seen = new Set<string>();
  const result: SavedDuty[] = [];
  const add = (duty: string, source: string, types?: DutyType[]) => {
    const clean = duty.trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) return;
    seen.add(key);
    result.push({
      id: `occupation-${job.socCode}-${result.length}`,
      duty: clean,
      source,
      confidence: 'High',
      types: types?.length ? types : classifyDuty(clean),
    });
  };

  job.essentialFunctions.forEach((value) => add(value, `O*NET ${job.socCode}`));
  job.physicalDemands.forEach((value) => add(value, `O*NET ${job.socCode} · physical`, ['Physical', ...classifyDuty(value).filter((type) => type !== 'Physical')]));
  job.cognitiveRequirements.forEach((value) => add(value, `O*NET ${job.socCode} · cognitive`, ['Cognitive']));
  job.environmentalExposures.forEach((value) => add(value, `O*NET ${job.socCode} · environment`, ['Environmental', ...classifyDuty(value).filter((type) => type !== 'Environmental')]));
  return result;
}

export default function JobIntelligence() {
  const [view, setView] = useState<View>('lookup');
  const [status, setStatus] = useState<IntelligenceStatus | null>(null);
  const [selectedJob, setSelectedJob] = useState<ONetJob | null>(loadSavedJob);
  const [sourceMode, setSourceMode] = useState<'live-onet' | 'local-fallback' | null>(null);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<LiveOccupationMatch[]>(() => localMatches(''));
  const [searching, setSearching] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [notice, setNotice] = useState('');
  const [duties, setDuties] = useState<SavedDuty[]>(loadDuties);
  const [dutySearch, setDutySearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SavedDuty, 'id'>>(blankDuty);
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    fetchIntelligenceStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(duties));
  }, [duties]);

  useEffect(() => {
    if (selectedJob) localStorage.setItem(SELECTED_JOB_KEY, JSON.stringify(selectedJob));
    else localStorage.removeItem(SELECTED_JOB_KEY);
  }, [selectedJob]);

  useEffect(() => {
    const clean = query.trim();
    if (selectedJob && clean === selectedJob.title) return;
    if (clean.length < 2) {
      setMatches(localMatches(clean));
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const live = await searchLiveOccupations(clean);
        setMatches(live.length ? live : localMatches(clean));
        if (!live.length) setNotice('No live O*NET matches returned. Showing local fallback matches.');
      } catch {
        setMatches(localMatches(clean));
        setNotice('Live O*NET search is unavailable. Local occupation fallback is active.');
      } finally {
        setSearching(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [query, selectedJob]);

  const filteredDuties = useMemo(() => {
    const clean = dutySearch.trim().toLowerCase();
    if (!clean) return duties;
    return duties.filter((item) => `${item.duty} ${item.source} ${item.types.join(' ')}`.toLowerCase().includes(clean));
  }, [duties, dutySearch]);

  const summary = useMemo(() => ({
    total: duties.length,
    physical: duties.filter((item) => item.types.includes('Physical')).length,
    cognitive: duties.filter((item) => item.types.includes('Cognitive')).length,
    environmental: duties.filter((item) => item.types.includes('Environmental')).length,
    safety: duties.filter((item) => item.types.includes('Safety-sensitive')).length,
  }), [duties]);

  async function chooseOccupation(match: LiveOccupationMatch) {
    setLoadingProfile(true);
    setNotice('');
    try {
      const live = await fetchLiveOccupation(match.code);
      setSelectedJob(live);
      setSourceMode('live-onet');
      setQuery(live.title);
      setMatches([]);
    } catch {
      const fallback = getJobByCode(match.code) ?? searchONetJobs(match.title)[0];
      if (fallback) {
        setSelectedJob(fallback);
        setSourceMode('local-fallback');
        setQuery(fallback.title);
        setMatches([]);
        setNotice('Live occupation detail was unavailable. Using the local fallback profile.');
      } else {
        setNotice('Unable to load that occupation. Try a broader title.');
      }
    } finally {
      setLoadingProfile(false);
    }
  }

  function resetQuery(value: string) {
    setQuery(value);
    if (selectedJob && value !== selectedJob.title) {
      setSelectedJob(null);
      setSourceMode(null);
    }
  }

  function loadFunctions() {
    if (!selectedJob) return;
    const generated = occupationDuties(selectedJob);
    setDuties((current) => {
      const custom = current.filter((item) => !item.id.startsWith('occupation-'));
      return [...generated, ...custom];
    });
    setView('workspace');
    setNotice(`${generated.length} occupation functions loaded.`);
  }

  function saveDuty() {
    const duty = form.duty.trim();
    if (!duty) return;
    if (editingId) {
      setDuties((current) => current.map((item) => item.id === editingId ? { ...item, ...form, duty } : item));
    } else {
      setDuties((current) => [{ ...form, duty, id: `custom-${Date.now()}` }, ...current]);
    }
    setForm(blankDuty);
    setEditingId(null);
    setShowAdd(false);
  }

  function editDuty(item: SavedDuty) {
    setForm({ duty: item.duty, source: item.source, confidence: item.confidence, types: item.types });
    setEditingId(item.id);
    setShowAdd(true);
  }

  function toggleType(type: DutyType) {
    setForm((current) => {
      const exists = current.types.includes(type);
      const next = exists ? current.types.filter((item) => item !== type) : [...current.types, type];
      return { ...current, types: next.length ? next : [type] };
    });
  }

  function parsePaste() {
    const lines = pasteText
      .split(/\n|(?<=[.!?])\s+/)
      .map((line) => line.replace(/^[-•\d.)\s]+/, '').trim())
      .filter((line) => line.length >= 12)
      .slice(0, 30);
    if (!lines.length) {
      setNotice('No usable duty lines detected.');
      return;
    }
    const extracted = lines.map((duty, index): SavedDuty => ({
      id: `paste-${Date.now()}-${index}`,
      duty,
      source: 'Pasted job description',
      confidence: 'Moderate',
      types: classifyDuty(duty),
    }));
    setDuties((current) => [...extracted, ...current]);
    setPasteText('');
    setView('workspace');
    setNotice(`${extracted.length} draft functions extracted.`);
  }

  async function copyFunctions() {
    const text = filteredDuties.map((item) => `• ${item.duty}`).join('\n');
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Visible functions copied.');
    } catch {
      setNotice('Clipboard access was blocked by the browser.');
    }
  }

  const sourceLabel = sourceMode === 'live-onet' ? 'LIVE O*NET' : sourceMode === 'local-fallback' ? 'LOCAL FALLBACK' : 'NOT SELECTED';

  return (
    <div className="job-workbench" data-testid="job-intelligence">
      <header className="job-header">
        <div>
          <div className="job-kicker">OCCUPATION / JOB INTELLIGENCE</div>
          <h1>Job Intelligence</h1>
          <p>Resolve a job title to occupational functions and demands, then keep only the functions useful to the review.</p>
        </div>
        <div className="job-source-status liquid-glass">
          <span className={status?.onet.configured ? 'active' : ''} />
          <div><strong>O*NET</strong><small>{status?.onet.configured ? 'live API configured' : 'local fallback available'}</small></div>
        </div>
      </header>

      <div className="job-tabs liquid-glass" role="tablist" aria-label="Job Intelligence views">
        <button className={view === 'lookup' ? 'active' : ''} onClick={() => setView('lookup')}><Search size={14} /> Lookup</button>
        <button className={view === 'workspace' ? 'active' : ''} onClick={() => setView('workspace')}><BookOpen size={14} /> Function Workspace <span>{duties.length}</span></button>
        <button className={view === 'paste' ? 'active' : ''} onClick={() => setView('paste')}><FileText size={14} /> Paste JD</button>
      </div>

      {notice && (
        <div className="job-notice"><span>{notice}</span><button onClick={() => setNotice('')}><X size={13} /></button></div>
      )}

      {view === 'lookup' && (
        <>
          <section className="job-search-panel liquid-glass">
            <label>JOB TITLE / SOC</label>
            <div className="job-search-input">
              {searching || loadingProfile ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <input value={query} onChange={(event) => resetQuery(event.target.value)} placeholder="Firefighter, aircraft mechanic, electrician, nurse…" autoFocus />
              {query && <button onClick={() => resetQuery('')} aria-label="Clear job search"><X size={14} /></button>}
            </div>

            {!selectedJob && matches.length > 0 && (
              <div className="job-match-list">
                {matches.map((match) => (
                  <button key={match.code} onClick={() => void chooseOccupation(match)}>
                    <div><strong>{match.title}</strong><small>SOC {match.code}</small></div>
                    <span>Open</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {!selectedJob ? (
            <section className="job-empty-state">
              <div className="job-empty-index">01</div>
              <div><strong>Search an occupation.</strong><p>The reviewer enters only the title. Live O*NET is used when available; the curated local library is the fallback.</p></div>
              <div className="job-example-list"><span>Firefighter</span><span>Truck Driver</span><span>Electrician</span><span>Aircraft Mechanic</span></div>
            </section>
          ) : (
            <section className="job-profile">
              <div className="job-profile-strip">
                <div>
                  <span>{sourceLabel}</span>
                  <h2>{selectedJob.title}</h2>
                  <p>{selectedJob.category} · SOC {selectedJob.socCode}</p>
                </div>
                <div className="job-profile-actions">
                  {selectedJob.safetySensitive && <span className="job-safety"><AlertTriangle size={13} /> Safety-sensitive</span>}
                  <a href={selectedJob.onetUrl} target="_blank" rel="noreferrer">Official O*NET <ExternalLink size={11} /></a>
                  <button onClick={loadFunctions}><Check size={14} /> Load functions</button>
                </div>
              </div>

              <div className="job-profile-grid">
                <ProfileColumn title="Essential functions" values={selectedJob.essentialFunctions} empty="No task detail returned." />
                <ProfileColumn title="Physical demands" values={selectedJob.physicalDemands} empty="No physical-demand detail returned." />
                <ProfileColumn title="Cognitive requirements" values={selectedJob.cognitiveRequirements} empty="No cognitive detail returned." />
                <ProfileColumn title="Environmental exposure" values={selectedJob.environmentalExposures} empty="No exposure detail returned." />
              </div>

              {selectedJob.relevantStandards.length > 0 && (
                <div className="job-standards">
                  <span>REFERENCE LENSES</span>
                  <div>{selectedJob.relevantStandards.map((item) => <span key={item}>{item}</span>)}</div>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {view === 'workspace' && (
        <div className="job-workspace-grid">
          <section className="job-duty-panel">
            <div className="job-duty-toolbar">
              <div className="job-filter"><Search size={14} /><input value={dutySearch} onChange={(event) => setDutySearch(event.target.value)} placeholder="Filter loaded functions…" /></div>
              <button onClick={() => void copyFunctions()}><ClipboardCopy size={14} /> Copy visible</button>
              <button onClick={() => { setShowAdd(true); setEditingId(null); setForm(blankDuty); }}><Plus size={14} /> Add custom</button>
            </div>

            {showAdd && (
              <div className="job-duty-editor">
                <textarea value={form.duty} onChange={(event) => setForm((current) => ({ ...current, duty: event.target.value }))} placeholder="Describe the job function…" />
                <div className="job-editor-row">
                  <input value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} placeholder="Source" />
                  <select value={form.confidence} onChange={(event) => setForm((current) => ({ ...current, confidence: event.target.value as SavedDuty['confidence'] }))}><option>Low</option><option>Moderate</option><option>High</option></select>
                </div>
                <div className="job-type-row">
                  {(['Physical', 'Cognitive', 'Environmental', 'Safety-sensitive'] as DutyType[]).map((type) => <button key={type} className={form.types.includes(type) ? 'active' : ''} onClick={() => toggleType(type)}>{type}</button>)}
                </div>
                <div className="job-editor-actions"><button onClick={() => { setShowAdd(false); setEditingId(null); }}>Cancel</button><button className="primary" onClick={saveDuty}>Save function</button></div>
              </div>
            )}

            <div className="job-duty-list">
              {filteredDuties.length === 0 && <div className="job-duty-empty">{duties.length ? 'No functions match this filter.' : 'No functions loaded. Choose an occupation or paste a job description.'}</div>}
              {filteredDuties.map((item) => (
                <div className="job-duty-row" key={item.id}>
                  <div>
                    <p>{item.duty}</p>
                    <div className="job-duty-meta">{item.types.map((type) => <span key={type}>{type}</span>)}<small>{item.source} · {item.confidence}</small></div>
                  </div>
                  <div className="job-duty-actions"><button onClick={() => editDuty(item)}>Edit</button><button className="danger" onClick={() => setDuties((current) => current.filter((duty) => duty.id !== item.id))}><Trash2 size={12} /></button></div>
                </div>
              ))}
            </div>
          </section>

          <aside className="job-summary-panel">
            <div className="job-summary-title">FUNCTION MIX</div>
            <div className="job-summary-grid">
              <Metric label="Total" value={summary.total} />
              <Metric label="Physical" value={summary.physical} />
              <Metric label="Cognitive" value={summary.cognitive} />
              <Metric label="Environmental" value={summary.environmental} />
              <Metric label="Safety-sensitive" value={summary.safety} />
            </div>
            {selectedJob && <div className="job-summary-job"><span>LOADED OCCUPATION</span><strong>{selectedJob.title}</strong><small>SOC {selectedJob.socCode}</small></div>}
            {duties.length > 0 && <button className="job-clear" onClick={() => { setDuties([]); setNotice('Function workspace cleared.'); }}>Clear function workspace</button>}
          </aside>
        </div>
      )}

      {view === 'paste' && (
        <section className="job-paste-panel">
          <div><span>PASTE JOB DESCRIPTION</span><h2>Turn existing job text into a draft function list.</h2><p>This is optional. Nothing is uploaded; the text is parsed in the browser and added to the local function workspace.</p></div>
          <textarea value={pasteText} onChange={(event) => setPasteText(event.target.value)} placeholder="Paste duties, essential functions, or a job posting here…" />
          <button onClick={parsePaste}>Extract draft functions</button>
        </section>
      )}
    </div>
  );
}

function ProfileColumn({ title, values, empty }: { title: string; values: string[]; empty: string }) {
  return <div className="job-profile-column"><span>{title}</span>{values.length ? values.slice(0, 8).map((value) => <p key={value}>{value}</p>) : <p className="muted">{empty}</p>}</div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="job-metric"><strong>{value}</strong><span>{label}</span></div>;
}
