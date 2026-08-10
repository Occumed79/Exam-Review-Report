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
  fetchOccupationInjuryEvidence,
  fetchOshaSevereInjuryContext,
  searchLiveOccupations,
  type IntelligenceStatus,
  type InjuryDataset,
  type InjuryMetric,
  type LiveOccupationMatch,
  type OccupationInjuryEvidence,
  type OshaSevereInjuryContext,
} from '@/lib/liveOccupationalApi';
import InjuryBodyMap from './InjuryBodyMap';
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

function formatMetric(value: number): string {
  return Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

function DatasetCard({ dataset }: { dataset: InjuryDataset }) {
  const available = dataset.status === 'available';
  const max = Math.max(0, ...dataset.top.map((metric) => metric.value));
  return (
    <article className={`injury-measured-card${available ? '' : ' unavailable'}`}>
      <div className="injury-measured-card-head">
        <div>
          <span>{dataset.id}</span>
          <strong>{dataset.label}</strong>
        </div>
        {available && dataset.matchLevel && (
          <small data-match={dataset.matchLevel}>{dataset.matchLevel === 'exact' ? 'exact SOC' : 'major-group fallback'}</small>
        )}
      </div>

      {!available ? (
        <p className="injury-measured-unavailable">{dataset.error || 'This BLS table did not publish a usable value for this occupation.'}</p>
      ) : (
        <>
          <div className="injury-measured-meta">
            <span>{dataset.referencePeriod}</span>
            <span>{dataset.unit}</span>
            {dataset.matchedSocCode && <span>SOC {dataset.matchedSocCode}</span>}
          </div>
          {dataset.total !== undefined && (
            <div className="injury-measured-total">
              <strong>{formatMetric(dataset.total)}</strong>
              <span>{dataset.measure === 'rate' ? dataset.unit : 'published total'}</span>
            </div>
          )}
          <div className="injury-measured-list">
            {dataset.top.slice(0, 6).map((metric) => (
              <div key={`${dataset.id}-${metric.label}`} className="injury-measured-metric">
                <span>{metric.label}</span>
                <i><b style={{ width: `${max ? Math.max(5, Math.round(metric.value / max * 100)) : 0}%` }} /></i>
                <strong>{formatMetric(metric.value)}</strong>
              </div>
            ))}
            {dataset.top.length === 0 && <p>No publishable breakdown values were returned.</p>}
          </div>
        </>
      )}

      <a href={dataset.sourceUrl} target="_blank" rel="noreferrer">BLS table <ExternalLink size={10} /></a>
    </article>
  );
}

function OshaMetricList({ title, metrics }: { title: string; metrics: InjuryMetric[] }) {
  const max = Math.max(0, ...metrics.map((metric) => metric.value));
  return (
    <div className="injury-osha-list">
      <span>{title}</span>
      {metrics.slice(0, 5).map((metric) => (
        <div key={`${title}-${metric.label}`}>
          <small>{metric.label}</small>
          <i><b style={{ width: `${max ? Math.max(5, Math.round(metric.value / max * 100)) : 0}%` }} /></i>
          <strong>{formatMetric(metric.value)}</strong>
        </div>
      ))}
      {metrics.length === 0 && <p>No categorized values returned.</p>}
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
  const [measured, setMeasured] = useState<OccupationInjuryEvidence | null>(null);
  const [measuredLoading, setMeasuredLoading] = useState(false);
  const [measuredError, setMeasuredError] = useState('');
  const [oshaContext, setOshaContext] = useState<OshaSevereInjuryContext | null>(null);
  const [oshaLoading, setOshaLoading] = useState(false);
  const [oshaError, setOshaError] = useState('');

  useEffect(() => {
    fetchIntelligenceStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    const query = jobSearch.trim();
    if (selectedJob && query === selectedJob.title) return;

    if (query.length < 2) {
      setMatches(query ? localMatches(query) : []);
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

  useEffect(() => {
    if (!selectedJob) {
      setMeasured(null);
      setMeasuredError('');
      setMeasuredLoading(false);
      return;
    }
    let cancelled = false;
    setMeasured(null);
    setMeasuredError('');
    setMeasuredLoading(true);
    fetchOccupationInjuryEvidence(selectedJob.socCode)
      .then((evidence) => { if (!cancelled) setMeasured(evidence); })
      .catch((error) => {
        if (!cancelled) setMeasuredError(error instanceof Error ? error.message : 'Measured BLS evidence is unavailable right now.');
      })
      .finally(() => { if (!cancelled) setMeasuredLoading(false); });
    return () => { cancelled = true; };
  }, [selectedJob]);

  useEffect(() => {
    const sectors = measured?.suggestedNaicsSectors ?? [];
    if (!sectors.length) {
      setOshaContext(null);
      setOshaError('');
      setOshaLoading(false);
      return;
    }
    let cancelled = false;
    setOshaContext(null);
    setOshaError('');
    setOshaLoading(true);
    fetchOshaSevereInjuryContext(sectors)
      .then((context) => { if (!cancelled) setOshaContext(context); })
      .catch((error) => {
        if (!cancelled) setOshaError(error instanceof Error ? error.message : 'OSHA severe-injury context is unavailable right now.');
      })
      .finally(() => { if (!cancelled) setOshaLoading(false); });
    return () => { cancelled = true; };
  }, [measured]);

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
          <p>Measured BLS surveillance, OSHA severe-injury context, occupation demands, and reviewer context. Each source keeps its own meaning and denominator.</p>
        </div>
        <div className="injury-source-stack">
          <SourceState active={Boolean(status?.onet?.configured)} label="O*NET" detail={status?.onet?.configured ? 'live' : 'fallback'} />
          <SourceState active={Boolean(status?.bls?.measuredTables || status?.bls?.configured)} label="BLS" detail={status?.bls?.measuredTables ? 'measured tables' : 'public'} />
          <SourceState active={Boolean(status?.osha?.publicSevereInjuryData)} label="OSHA" detail={status?.osha?.publicSevereInjuryData ? 'current SIR' : 'unavailable'} />
        </div>
      </header>

      <section className="injury-search-panel">
        <div className="injury-field primary">
          <label>Occupation</label>
          <div className="injury-input-wrap">
            {searching || loadingProfile ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            <input value={jobSearch} onChange={(event) => resetOccupation(event.target.value)} placeholder="Search job title or occupation…" autoComplete="off" />
          </div>
        </div>
        <div className="injury-field">
          <label>Finding <span>optional</span></label>
          <input className="injury-input" value={finding} disabled={!selectedJob} onChange={(event) => setFinding(event.target.value)} placeholder="Shoulder surgery, seizure, OSA…" />
        </div>

        {!selectedJob && matches.length > 0 && (
          <div className="injury-match-list">
            {matches.map((match) => (
              <button key={`${match.code}-${match.title}`} onClick={() => void chooseOccupation(match)}>
                <span><strong>{match.title}</strong><small>SOC {match.code}</small></span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        )}
        {notice && <div className="injury-notice">{notice}</div>}
      </section>

      {!selectedJob && <InjuryBodyMap measured={null} profile={null} />}

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

          <InjuryBodyMap measured={measured} profile={profile} />

          <section className="injury-measured-section">
            <div className="injury-measured-heading">
              <div><span>MEASURED SURVEILLANCE</span><h3>BLS occupation injury evidence</h3></div>
              <small>SOII 2023–2024 · CFOI 2024</small>
            </div>
            {measuredLoading && <div className="injury-measured-loading"><Loader2 size={16} className="animate-spin" /> Loading published BLS occupation tables…</div>}
            {measuredError && <div className="injury-measured-error"><AlertTriangle size={14} /> {measuredError}</div>}
            {measured && (
              <>
                <div className="injury-measured-grid">
                  {measured.datasets.map((dataset) => <DatasetCard key={dataset.id} dataset={dataset} />)}
                </div>
                <div className="injury-measured-caveat">
                  <Database size={13} />
                  <span>{measured.caveats[0] || 'BLS estimates may be suppressed when publication criteria are not met.'}</span>
                  <a href={measured.source.landingPage} target="_blank" rel="noreferrer">BLS SOII <ExternalLink size={10} /></a>
                  <a href={measured.source.fatalLandingPage} target="_blank" rel="noreferrer">BLS CFOI <ExternalLink size={10} /></a>
                </div>
              </>
            )}
          </section>

          {(oshaLoading || oshaError || oshaContext || (measured && measured.suggestedNaicsSectors.length === 0)) && (
            <section className="injury-osha-section">
              <div className="injury-osha-heading">
                <div><span>SEVERE-INJURY CONTEXT</span><h3>OSHA industry-sector reports</h3></div>
                <small>industry context · not occupation incidence</small>
              </div>
              {oshaLoading && <div className="injury-measured-loading"><Loader2 size={16} className="animate-spin" /> Loading current OSHA Severe Injury Report data…</div>}
              {oshaError && <div className="injury-measured-error"><AlertTriangle size={14} /> {oshaError}</div>}
              {measured && measured.suggestedNaicsSectors.length === 0 && !oshaLoading && !oshaError && (
                <div className="injury-osha-empty">BLS R44 did not provide enough industry context to infer a defensible OSHA sector filter for this occupation.</div>
              )}
              {oshaContext && (
                <>
                  <div className="injury-osha-summary">
                    <div><span>REPORTS</span><strong>{formatMetric(oshaContext.reportCount)}</strong></div>
                    <div><span>HOSPITALIZED</span><strong>{formatMetric(oshaContext.hospitalized)}</strong></div>
                    <div><span>AMPUTATIONS</span><strong>{formatMetric(oshaContext.amputations)}</strong></div>
                    <div><span>EYE LOSS</span><strong>{formatMetric(oshaContext.eyeLoss)}</strong></div>
                  </div>
                  <div className="injury-osha-meta">
                    <span>{oshaContext.coverage}</span>
                    <span>NAICS sectors: {oshaContext.sectors.join(', ')}</span>
                  </div>
                  <div className="injury-osha-grid">
                    <OshaMetricList title="TOP EVENTS / EXPOSURES" metrics={oshaContext.topEvents} />
                    <OshaMetricList title="TOP BODY PARTS" metrics={oshaContext.topBodyParts} />
                    <OshaMetricList title="TOP NATURES" metrics={oshaContext.topNatures} />
                    <OshaMetricList title="TOP SOURCES" metrics={oshaContext.topSources} />
                  </div>
                  <div className="injury-osha-caveat">
                    <AlertTriangle size={12} />
                    <span>{oshaContext.caveat}</span>
                    <a href={oshaContext.source.landingPage} target="_blank" rel="noreferrer">OSHA SIR <ExternalLink size={10} /></a>
                  </div>
                </>
              )}
            </section>
          )}

          <div className="injury-main-grid">
            <section className="injury-panel injury-signal-panel">
              <div className="injury-panel-heading">
                <div><span>DERIVED REVIEW SIGNALS</span><h3>Demand-derived injury and hazard pattern</h3></div>
                <small>context only · not incidence</small>
              </div>
              <div className="injury-signal-table">
                {rankedSignals.map((signal, index) => (
                  <div className="injury-signal-row" key={signal.label}>
                    <div className="injury-signal-rank">{String(index + 1).padStart(2, '0')}</div>
                    <div className="injury-signal-copy">
                      <div className="injury-signal-title"><strong>{signal.label}</strong><span data-prominence={signal.prominence}>{signal.prominence}</span></div>
                      <p>{signal.reviewerWhy}</p>
                      <div className="injury-signal-tags">{signal.bodyRegions.map((region) => <span key={region}>{region}</span>)}</div>
                      <small>{signal.mechanisms.join(' · ')}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="injury-side-column">
              <section className="injury-panel">
                <div className="injury-mini-heading"><Target size={15} /> DERIVED BODY-REGION CONTEXT</div>
                <div className="injury-chip-grid">{profile.dominantBodyRegions.map((region) => <span key={region}>{region}</span>)}</div>
              </section>
              <section className="injury-panel">
                <div className="injury-mini-heading"><ShieldCheck size={15} /> O*NET JOB-DEMAND EVIDENCE</div>
                <div className="injury-demand-list">
                  {selectedJob.physicalDemands.slice(0, 6).map((demand) => <div key={demand}>{demand}</div>)}
                  {selectedJob.physicalDemands.length === 0 && <div>No physical-demand detail returned for this occupation.</div>}
                </div>
              </section>
              <section className="injury-panel injury-source-note">
                <div className="injury-mini-heading"><Database size={15} /> SOURCE BOUNDARY</div>
                <p>BLS is occupation-level measured surveillance. OSHA above is severe-injury context for BLS-linked industry sectors. This lower section is derived from O*NET/job demands. They are intentionally not combined into one score or rate.</p>
              </section>
            </aside>
          </div>

          {findingMatch && (
            <section className="injury-finding-panel">
              <div className="injury-finding-head">
                <div><span>FINDING × OCCUPATION</span><h3>{findingMatch.finding} <ArrowRight size={16} /> {selectedJob.title}</h3></div>
                <strong data-relevance={findingMatch.relevance}>{findingMatch.relevance}</strong>
              </div>
              <p>{findingMatch.explanation}</p>
              <div className="injury-finding-grid">
                <div><span>POTENTIALLY AFFECTED DEMANDS</span>{findingMatch.affectedDemands.map((item) => <div key={item}>{item}</div>)}{findingMatch.affectedDemands.length === 0 && <div>No direct demand match found in the occupation profile.</div>}</div>
                <div><span>QUESTIONS TO RESOLVE</span>{findingMatch.reviewQuestions.map((item) => <div key={item}>{item}</div>)}</div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
