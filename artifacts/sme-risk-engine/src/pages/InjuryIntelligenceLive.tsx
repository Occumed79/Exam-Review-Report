import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Database, ExternalLink, Loader2, Search, ShieldCheck, Target } from 'lucide-react';
import { getJobByCode, searchONetJobs, type ONetJob } from '@/lib/onetJobDatabase';
import { buildOccupationalInjuryProfile, matchFindingToOccupation, type ReviewProminence } from '@/lib/occupationalInjuryIntelligence';
import {
  fetchIntelligenceStatus,
  fetchLiveOccupation,
  searchLiveOccupations,
  type IntelligenceStatus,
  type LiveOccupationMatch,
} from '@/lib/liveOccupationalApi';

const prominenceStyle: Record<ReviewProminence, { color: string; border: string; background: string }> = {
  'Very prominent': { color: '#f5b7b1', border: 'rgba(239,68,68,.2)', background: 'rgba(239,68,68,.06)' },
  Prominent: { color: '#d6c8aa', border: 'rgba(214,200,170,.2)', background: 'rgba(214,200,170,.05)' },
  Relevant: { color: '#b4d7d0', border: 'rgba(180,215,208,.18)', background: 'rgba(180,215,208,.05)' },
  Contextual: { color: 'rgba(255,255,255,.55)', border: 'rgba(255,255,255,.08)', background: 'rgba(255,255,255,.025)' },
};

function localMatches(query: string): LiveOccupationMatch[] {
  return searchONetJobs(query).slice(0, 10).map((job) => ({ title: job.title, code: job.socCode }));
}

export default function InjuryIntelligenceLive() {
  const [status, setStatus] = useState<IntelligenceStatus | null>(null);
  const [jobSearch, setJobSearch] = useState('');
  const [matches, setMatches] = useState<LiveOccupationMatch[]>([]);
  const [selectedJob, setSelectedJob] = useState<ONetJob | null>(null);
  const [finding, setFinding] = useState('');
  const [searching, setSearching] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [sourceMode, setSourceMode] = useState<'live-onet' | 'local-fallback' | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetchIntelligenceStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    const query = jobSearch.trim();
    if (selectedJob && query === selectedJob.title) return;
    if (query.length < 2) {
      setMatches(query ? localMatches(query) : searchONetJobs('').slice(0, 7).map((job) => ({ title: job.title, code: job.socCode })));
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const live = await searchLiveOccupations(query);
        setMatches(live.length ? live : localMatches(query));
        setNotice(live.length ? '' : 'No live O*NET match returned; showing local fallback matches.');
      } catch {
        setMatches(localMatches(query));
        setNotice('Live O*NET is unavailable right now; the tool is using the local occupation fallback.');
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [jobSearch, selectedJob]);

  const profile = useMemo(() => selectedJob ? buildOccupationalInjuryProfile(selectedJob) : null, [selectedJob]);
  const findingMatch = useMemo(() => selectedJob ? matchFindingToOccupation(selectedJob, finding) : null, [selectedJob, finding]);

  async function chooseOccupation(match: LiveOccupationMatch) {
    setLoadingProfile(true);
    setNotice('');
    try {
      const live = await fetchLiveOccupation(match.code);
      setSelectedJob(live);
      setSourceMode('live-onet');
      setJobSearch(live.title);
      setMatches([]);
    } catch {
      const local = getJobByCode(match.code) ?? searchONetJobs(match.title)[0];
      if (local) {
        setSelectedJob(local);
        setSourceMode('local-fallback');
        setJobSearch(local.title);
        setMatches([]);
        setNotice('Live occupation detail was unavailable; using the local O*NET-oriented fallback profile.');
      } else {
        setNotice('Unable to load that occupation. Try a broader job title.');
      }
    } finally {
      setLoadingProfile(false);
    }
  }

  function resetOccupation(value: string) {
    setJobSearch(value);
    if (selectedJob && value !== selectedJob.title) {
      setSelectedJob(null);
      setSourceMode(null);
      setFinding('');
    }
  }

  return (
    <div style={{ maxWidth: 1260, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <Activity size={22} style={{ color: '#b4d7d0' }} />
          <h1 style={{ margin: 0, color: '#fff', fontSize: '1.65rem', fontWeight: 850 }}>Injury Intelligence</h1>
        </div>
        <p style={{ margin: '.45rem 0 0', color: 'rgba(255,255,255,.48)', maxWidth: 900, lineHeight: 1.6, fontSize: '.86rem' }}>
          Type a job title. The app resolves the occupation, pulls job-demand intelligence, and translates it into injury patterns and reviewer questions. Add one finding only when you want to compare it with the job.
        </p>
      </header>

      <section className="glass-card" style={{ padding: '.85rem 1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem', alignItems: 'center' }}>
          <span style={{ fontSize: '.66rem', fontWeight: 800, color: status?.onet.configured ? '#b4d7d0' : 'rgba(255,255,255,.4)' }}>
            O*NET {status?.onet.configured ? 'LIVE' : 'FALLBACK'}
          </span>
          <span style={{ fontSize: '.66rem', color: 'rgba(255,255,255,.25)' }}>•</span>
          <span style={{ fontSize: '.66rem', fontWeight: 800, color: status?.bls.configured ? '#b4d7d0' : 'rgba(255,255,255,.4)' }}>
            BLS {status?.bls.configured ? 'REGISTERED API' : 'PUBLIC MODE'}
          </span>
          <span style={{ fontSize: '.66rem', color: 'rgba(255,255,255,.25)' }}>•</span>
          <span style={{ fontSize: '.66rem', color: 'rgba(255,255,255,.48)' }}>
            OSHA import {status?.osha.importEnabled ? 'enabled' : 'not yet enabled'}
          </span>
        </div>
      </section>

      <section className="glass-card" style={{ padding: '1rem 1.1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '.8rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '.67rem', fontWeight: 800, color: 'rgba(255,255,255,.38)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>Job title</label>
            <div style={{ position: 'relative' }}>
              {searching || loadingProfile ? <Loader2 size={15} className="animate-spin" style={{ position: 'absolute', left: 12, top: 12, color: '#b4d7d0' }} /> : <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'rgba(255,255,255,.35)' }} />}
              <input value={jobSearch} onChange={(event) => resetOccupation(event.target.value)} placeholder="Firefighter, aircraft mechanic, electrician…" style={{ width: '100%', boxSizing: 'border-box', padding: '.7rem .8rem .7rem 2.2rem', borderRadius: 9, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.035)', color: '#fff', outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.67rem', fontWeight: 800, color: 'rgba(255,255,255,.38)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>Optional finding</label>
            <input value={finding} disabled={!selectedJob} onChange={(event) => setFinding(event.target.value)} placeholder="Shoulder surgery, seizure, OSA, gabapentin…" style={{ width: '100%', boxSizing: 'border-box', padding: '.7rem .8rem', borderRadius: 9, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.035)', color: '#fff', outline: 'none', opacity: selectedJob ? 1 : .48 }} />
          </div>
        </div>

        {!selectedJob && matches.length > 0 && (
          <div style={{ marginTop: '.7rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: '.45rem' }}>
            {matches.map((match) => (
              <button key={match.code} onClick={() => void chooseOccupation(match)} style={{ textAlign: 'left', borderRadius: 9, border: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.025)', padding: '.7rem .8rem', cursor: 'pointer', color: 'inherit' }}>
                <div style={{ color: '#fff', fontSize: '.8rem', fontWeight: 750 }}>{match.title}</div>
                <div style={{ color: 'rgba(255,255,255,.34)', fontSize: '.67rem', marginTop: 3 }}>SOC {match.code}</div>
              </button>
            ))}
          </div>
        )}
        {notice && <div style={{ marginTop: '.7rem', color: '#d6c8aa', fontSize: '.72rem' }}>{notice}</div>}
      </section>

      {selectedJob && profile && (
        <>
          <section className="glass-card" style={{ padding: '1rem 1.1rem', borderColor: 'rgba(180,215,208,.18)', background: 'rgba(180,215,208,.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '.64rem', color: '#b4d7d0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>{sourceMode === 'live-onet' ? 'Live O*NET occupation' : 'Local fallback occupation'}</div>
                <div style={{ color: '#fff', fontSize: '1.18rem', fontWeight: 850, marginTop: 3 }}>{selectedJob.title}</div>
                <div style={{ color: 'rgba(255,255,255,.42)', fontSize: '.72rem', marginTop: 3 }}>{selectedJob.category} · SOC {selectedJob.socCode}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
                {selectedJob.safetySensitive && <span style={{ display: 'inline-flex', gap: '.3rem', alignItems: 'center', fontSize: '.67rem', fontWeight: 800, color: '#f5b7b1' }}><AlertTriangle size={13} /> Safety-sensitive</span>}
                <a href={selectedJob.onetUrl} target="_blank" rel="noreferrer" style={{ color: '#b4d7d0', fontSize: '.68rem', textDecoration: 'none' }}>O*NET <ExternalLink size={10} /></a>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ margin: '0 0 .2rem', color: '#f4efdc', fontSize: '.98rem' }}>What tends to matter in this occupation?</h2>
            <div style={{ color: 'rgba(255,255,255,.34)', fontSize: '.7rem', marginBottom: '.65rem' }}>Reviewer prominence synthesized from job demands — not an invented incidence rate.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(265px,1fr))', gap: '.65rem' }}>
              {profile.injurySignals.map((signal) => {
                const style = prominenceStyle[signal.prominence];
                return <div key={signal.label} className="glass-card" style={{ padding: '.9rem', borderColor: style.border, background: style.background }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}><strong style={{ color: '#fff', fontSize: '.8rem' }}>{signal.label}</strong><span style={{ color: style.color, fontSize: '.61rem', fontWeight: 800 }}>{signal.prominence}</span></div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginTop: '.55rem' }}>{signal.bodyRegions.map((region) => <span key={region} style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.66)', padding: '.18rem .38rem', borderRadius: 5, background: 'rgba(0,0,0,.14)' }}>{region}</span>)}</div>
                  <div style={{ color: 'rgba(255,255,255,.48)', fontSize: '.71rem', lineHeight: 1.5, marginTop: '.55rem' }}>{signal.reviewerWhy}</div>
                  <div style={{ color: 'rgba(255,255,255,.3)', fontSize: '.65rem', marginTop: '.55rem' }}>{signal.mechanisms.join(' · ')}</div>
                </div>;
              })}
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '.7rem' }}>
            <div className="glass-card" style={{ padding: '1rem' }}><div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', color: '#f4efdc', fontWeight: 850, fontSize: '.84rem' }}><Target size={15} style={{ color: '#b4d7d0' }} /> Body regions</div><div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginTop: '.7rem' }}>{profile.dominantBodyRegions.map((x) => <span key={x} style={{ fontSize: '.68rem', color: '#b4d7d0' }}>{x}</span>)}</div></div>
            <div className="glass-card" style={{ padding: '1rem' }}><div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', color: '#f4efdc', fontWeight: 850, fontSize: '.84rem' }}><ShieldCheck size={15} style={{ color: '#b4d7d0' }} /> Job-demand evidence</div><div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.7rem', lineHeight: 1.55, marginTop: '.55rem' }}>{selectedJob.physicalDemands.slice(0, 5).join(' · ') || 'No physical-demand detail returned for this occupation.'}</div></div>
          </section>

          {findingMatch && (
            <section className="glass-card" style={{ padding: '1rem 1.1rem' }}>
              <div style={{ fontSize: '.65rem', color: '#b4d7d0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>Finding × occupation</div>
              <h2 style={{ margin: '.25rem 0 .3rem', color: '#fff', fontSize: '1rem' }}>{findingMatch.finding} → {selectedJob.title}</h2>
              <div style={{ color: findingMatch.relevance === 'High' ? '#f5b7b1' : '#d6c8aa', fontSize: '.72rem', fontWeight: 800 }}>{findingMatch.relevance} review relevance</div>
              <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem', lineHeight: 1.55 }}>{findingMatch.explanation}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '.8rem' }}>
                <div><div style={{ color: 'rgba(255,255,255,.35)', fontSize: '.64rem', fontWeight: 800, textTransform: 'uppercase' }}>Potentially affected demands</div>{findingMatch.affectedDemands.map((x) => <div key={x} style={{ color: 'rgba(255,255,255,.65)', fontSize: '.72rem', marginTop: '.38rem' }}>• {x}</div>)}</div>
                <div><div style={{ color: 'rgba(255,255,255,.35)', fontSize: '.64rem', fontWeight: 800, textTransform: 'uppercase' }}>Questions to resolve</div>{findingMatch.reviewQuestions.map((x) => <div key={x} style={{ color: 'rgba(255,255,255,.65)', fontSize: '.72rem', marginTop: '.38rem' }}>• {x}</div>)}</div>
              </div>
            </section>
          )}

          <section className="glass-card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', color: '#f4efdc', fontWeight: 850, fontSize: '.84rem' }}><Database size={15} style={{ color: '#b4d7d0' }} /> Measured injury history</div>
            <p style={{ color: 'rgba(255,255,255,.48)', fontSize: '.72rem', lineHeight: 1.55, marginBottom: 0 }}>
              {status?.bls.configured ? 'The registered BLS API key is connected. ' : 'BLS is currently in public mode. '}Exact occupation-level counts, rates, body-part rankings, and year-over-year trends will appear here only after the verified BLS injury-table mapping/import layer is added. The app will not manufacture prevalence numbers in the meantime.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
