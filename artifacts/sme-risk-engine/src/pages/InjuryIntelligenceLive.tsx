import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Database,
  ExternalLink,
  Loader2,
  Search,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { getJobByCode, searchONetJobs, type ONetJob } from '@/lib/onetJobDatabase';
import {
  buildOccupationalInjuryProfile,
  matchFindingToOccupation,
  type ReviewProminence,
} from '@/lib/occupationalInjuryIntelligence';
import {
  fetchIntelligenceStatus,
  fetchLiveOccupation,
  searchLiveOccupations,
  type IntelligenceStatus,
  type LiveOccupationMatch,
} from '@/lib/liveOccupationalApi';
import './injury-workbench.css';

const PROMINENCE_RANK: Record<ReviewProminence, number> = {
  'Very prominent': 4,
  Prominent: 3,
  Relevant: 2,
  Contextual: 1,
};

function localMatches(query: string): LiveOccupationMatch[] {
  return searchONetJobs(query)
    .slice(0, 10)
    .map((job) => ({ title: job.title, code: job.socCode }));
}

function SourceState({ active, label, detail }: { active: boolean; label: string; detail: string }) {
  return (
    <div className="injury-source-state">
      <span className={`injury-source-dot${active ? ' active' : ''}`} />
      <span>{label}</span>
      <small>{detail}</small>
    </div>
  );
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
      setMatches(query ? localMatches(query) : searchONetJobs('').slice(0, 6).map((job) => ({ title: job.title, code: job.socCode })));
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const live = await searchLiveOccupations(query);
        setMatches(live.length ? live : localMatches(query));
        setNotice(live.length ? '' : 'No live O*NET match returned. Showing the local occupation fallback.');
      } catch {
        setMatches(localMatches(query));
        setNotice('Live O*NET is unavailable. Local occupation intelligence is still available.');
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [jobSearch, selectedJob]);

  const profile = useMemo(
    () => (selectedJob ? buildOccupationalInjuryProfile(selectedJob) : null),
    [selectedJob],
  );

  const rankedSignals = useMemo(
    () => profile ? [...profile.injurySignals].sort((a, b) => PROMINENCE_RANK[b.prominence] - PROMINENCE_RANK[a.prominence]) : [],
    [profile],
  );

  const findingMatch = useMemo(
    () => (selectedJob ? matchFindingToOccupation(selectedJob, finding) : null),
    [selectedJob, finding],
  );

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
        setNotice('Live occupation detail was unavailable. Using the local O*NET-oriented profile.');
      } else {
        setNotice('Unable to load that occupation. Try a broader title.');
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
    <div className="injury-workbench" data-testid="injury-intelligence">
      <header className="injury-header">
        <div>
          <div className="injury-kicker"><Activity size={14} /> OCCUPATIONAL INJURY INTELLIGENCE</div>
          <h1>Injury Intelligence</h1>
          <p>Search an occupation to surface injury patterns, body regions, mechanisms, and job-demand context without building a case record.</p>
        </div>
        <div className="injury-source-stack">
          <SourceState active={Boolean(status?.onet?.configured)} label="O*NET" detail={status?.onet?.configured ? 'live' : 'fallback'} />
          <SourceState active={Boolean(status?.bls?.configured)} label="BLS" detail={status?.bls?.configured ? 'registered' : 'public'} />
          <SourceState active={Boolean(status?.osha?.importEnabled || status?.osha?.dataDirConfigured)} label="OSHA" detail={status?.osha?.importEnabled ? 'import enabled' : 'source ready'} />
        </div>
      </header>

      <section className="injury-search-panel">
        <div className="injury-field primary">
          <label>Occupation</label>
          <div className="injury-input-wrap">
            {searching || loadingProfile
              ? <Loader2 size={16} className="animate-spin" />
              : <Search size={16} />}
            <input
              value={jobSearch}
              onChange={(event) => resetOccupation(event.target.value)}
              placeholder="Search job title or occupation…"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="injury-field">
          <label>Finding <span>optional</span></label>
          <input
            className="injury-input"
            value={finding}
            disabled={!selectedJob}
            onChange={(event) => setFinding(event.target.value)}
            placeholder="Shoulder surgery, seizure, OSA…"
          />
        </div>

        {!selectedJob && matches.length > 0 && (
          <div className="injury-match-list">
            {matches.map((match) => (
              <button key={`${match.code}-${match.title}`} onClick={() => void chooseOccupation(match)}>
                <span>
                  <strong>{match.title}</strong>
                  <small>SOC {match.code}</small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        )}
        {notice && <div className="injury-notice">{notice}</div>}
      </section>

      {!selectedJob && (
        <section className="injury-empty-state">
          <div className="injury-empty-number">01</div>
          <div>
            <strong>Start with the position.</strong>
            <p>The search resolves the occupation first. Everything else on this page is generated from that occupation context.</p>
          </div>
          <div className="injury-empty-examples">
            <span>Firefighter</span>
            <span>Electrician</span>
            <span>Aircraft mechanic</span>
            <span>Truck driver</span>
          </div>
        </section>
      )}

      {selectedJob && profile && (
        <>
          <section className="injury-occupation-strip">
            <div>
              <span className="injury-strip-label">{sourceMode === 'live-onet' ? 'LIVE O*NET OCCUPATION' : 'LOCAL FALLBACK OCCUPATION'}</span>
              <h2>{selectedJob.title}</h2>
              <p>{selectedJob.category} <span>·</span> SOC {selectedJob.socCode}</p>
            </div>
            <div className="injury-strip-actions">
              {selectedJob.safetySensitive && <span className="injury-safety"><AlertTriangle size={13} /> Safety-sensitive</span>}
              <a href={selectedJob.onetUrl} target="_blank" rel="noreferrer">O*NET profile <ExternalLink size={11} /></a>
            </div>
          </section>

          <div className="injury-main-grid">
            <section className="injury-panel injury-signal-panel">
              <div className="injury-panel-heading">
                <div>
                  <span>RANKED REVIEW SIGNALS</span>
                  <h3>Injury and hazard pattern</h3>
                </div>
                <small>review prominence, not incidence rate</small>
              </div>

              <div className="injury-signal-table">
                {rankedSignals.map((signal, index) => (
                  <div className="injury-signal-row" key={signal.label}>
                    <div className="injury-signal-rank">{String(index + 1).padStart(2, '0')}</div>
                    <div className="injury-signal-copy">
                      <div className="injury-signal-title">
                        <strong>{signal.label}</strong>
                        <span data-prominence={signal.prominence}>{signal.prominence}</span>
                      </div>
                      <p>{signal.reviewerWhy}</p>
                      <div className="injury-signal-tags">
                        {signal.bodyRegions.map((region) => <span key={region}>{region}</span>)}
                      </div>
                      <small>{signal.mechanisms.join(' · ')}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="injury-side-column">
              <section className="injury-panel">
                <div className="injury-mini-heading"><Target size={15} /> BODY REGIONS</div>
                <div className="injury-chip-grid">
                  {profile.dominantBodyRegions.map((region) => <span key={region}>{region}</span>)}
                </div>
              </section>

              <section className="injury-panel">
                <div className="injury-mini-heading"><ShieldCheck size={15} /> JOB-DEMAND EVIDENCE</div>
                <div className="injury-demand-list">
                  {selectedJob.physicalDemands.slice(0, 6).map((demand) => <div key={demand}>{demand}</div>)}
                  {selectedJob.physicalDemands.length === 0 && <div>No physical-demand detail returned for this occupation.</div>}
                </div>
              </section>

              <section className="injury-panel injury-source-note">
                <div className="injury-mini-heading"><Database size={15} /> SOURCE BOUNDARY</div>
                <p>Measured BLS counts/rates will only display when the verified occupation-level surveillance mapping is available. This page does not invent prevalence.</p>
              </section>
            </aside>
          </div>

          {findingMatch && (
            <section className="injury-finding-panel">
              <div className="injury-finding-head">
                <div>
                  <span>FINDING × OCCUPATION</span>
                  <h3>{findingMatch.finding} <ArrowRight size={16} /> {selectedJob.title}</h3>
                </div>
                <strong data-relevance={findingMatch.relevance}>{findingMatch.relevance}</strong>
              </div>
              <p>{findingMatch.explanation}</p>
              <div className="injury-finding-grid">
                <div>
                  <span>POTENTIALLY AFFECTED DEMANDS</span>
                  {findingMatch.affectedDemands.map((item) => <div key={item}>{item}</div>)}
                  {findingMatch.affectedDemands.length === 0 && <div>No direct demand match found in the occupation profile.</div>}
                </div>
                <div>
                  <span>QUESTIONS TO RESOLVE</span>
                  {findingMatch.reviewQuestions.map((item) => <div key={item}>{item}</div>)}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
