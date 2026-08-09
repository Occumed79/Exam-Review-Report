import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Database,
  ExternalLink,
  Search,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { searchONetJobs, type ONetJob } from '@/lib/onetJobDatabase';
import {
  buildOccupationalInjuryProfile,
  getInjuryIntelligenceSources,
  matchFindingToOccupation,
  type ReviewProminence,
} from '@/lib/occupationalInjuryIntelligence';

const PROMINENCE_STYLE: Record<ReviewProminence, { color: string; background: string; border: string }> = {
  'Very prominent': { color: '#f5b7b1', background: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.18)' },
  Prominent: { color: '#d6c8aa', background: 'rgba(214,200,170,0.08)', border: 'rgba(214,200,170,0.18)' },
  Relevant: { color: '#b4d7d0', background: 'rgba(180,215,208,0.07)', border: 'rgba(180,215,208,0.17)' },
  Contextual: { color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
};

function SourceBadge({ role }: { role: string }) {
  return (
    <span style={{
      fontSize: '0.61rem',
      fontWeight: 800,
      letterSpacing: '.05em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.42)',
      padding: '0.18rem 0.42rem',
      borderRadius: 5,
      border: '1px solid rgba(255,255,255,0.08)',
      whiteSpace: 'nowrap',
    }}>
      {role}
    </span>
  );
}

export default function InjuryIntelligence() {
  const [jobSearch, setJobSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<ONetJob | null>(null);
  const [finding, setFinding] = useState('');

  const results = useMemo(() => {
    const matches = searchONetJobs(jobSearch);
    return matches.slice(0, jobSearch.trim() ? 10 : 7);
  }, [jobSearch]);

  const profile = useMemo(
    () => (selectedJob ? buildOccupationalInjuryProfile(selectedJob) : null),
    [selectedJob],
  );

  const findingMatch = useMemo(
    () => (selectedJob ? matchFindingToOccupation(selectedJob, finding) : null),
    [selectedJob, finding],
  );

  const sources = useMemo(() => getInjuryIntelligenceSources(), []);

  function chooseJob(job: ONetJob) {
    setSelectedJob(job);
    setJobSearch(job.title);
  }

  return (
    <div style={{ maxWidth: 1260, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} data-testid="injury-intelligence">
      <header style={{ marginBottom: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <Activity size={22} style={{ color: '#b4d7d0' }} />
          <h1 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: 850, letterSpacing: '-0.025em' }}>
            Injury Intelligence
          </h1>
        </div>
        <p style={{ margin: 0, maxWidth: 900, color: 'rgba(255,255,255,0.48)', lineHeight: 1.6, fontSize: '0.86rem' }}>
          Type a job title. The tool resolves the occupation and surfaces injury patterns, body regions, mechanisms, job demands, and reviewer questions. Add a finding only when you want to compare it with the job.
        </p>
      </header>

      <section className="glass-card" style={{ padding: '1rem 1.1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.8rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 800, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '0.4rem' }}>
              Job title
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'rgba(255,255,255,0.35)' }} />
              <input
                value={jobSearch}
                onChange={event => {
                  setJobSearch(event.target.value);
                  if (selectedJob && event.target.value !== selectedJob.title) setSelectedJob(null);
                }}
                placeholder="Firefighter, electrician, truck driver…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 0.8rem 0.7rem 2.2rem', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.035)', color: '#fff', outline: 'none', fontSize: '0.84rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 800, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '0.4rem' }}>
              Optional finding
            </label>
            <input
              value={finding}
              onChange={event => setFinding(event.target.value)}
              placeholder="Shoulder surgery, seizure, OSA, gabapentin…"
              disabled={!selectedJob}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 0.8rem', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.035)', color: '#fff', outline: 'none', fontSize: '0.84rem', opacity: selectedJob ? 1 : 0.5 }}
            />
          </div>
        </div>

        {!selectedJob && (
          <div style={{ marginTop: '0.7rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))', gap: '0.45rem' }}>
            {results.map(job => (
              <button
                key={job.socCode}
                onClick={() => chooseJob(job)}
                style={{ textAlign: 'left', borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)', padding: '0.7rem 0.8rem', cursor: 'pointer', color: 'inherit' }}
              >
                <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 750 }}>{job.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.34)', fontSize: '0.67rem', marginTop: 3 }}>{job.category} · SOC {job.socCode}</div>
              </button>
            ))}
            {results.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', padding: '0.7rem' }}>
                No local occupation match yet. Try a broader title or use Job Intelligence to see the currently supported occupation library.
              </div>
            )}
          </div>
        )}
      </section>

      {selectedJob && profile && (
        <>
          <section className="glass-card" style={{ padding: '1rem 1.1rem', borderColor: 'rgba(180,215,208,0.18)', background: 'rgba(180,215,208,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#b4d7d0', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>Resolved occupation</div>
                <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 850, marginTop: 3 }}>{selectedJob.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.72rem', marginTop: 3 }}>{selectedJob.category} · SOC {selectedJob.socCode}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {selectedJob.safetySensitive && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32rem', color: '#f5b7b1', border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.07)', borderRadius: 7, padding: '0.35rem 0.55rem', fontSize: '0.68rem', fontWeight: 750 }}>
                    <AlertTriangle size={13} /> Safety-sensitive
                  </span>
                )}
                <a href={selectedJob.onetUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#b4d7d0', textDecoration: 'none', fontSize: '0.69rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  O*NET profile <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </section>

          <section>
            <div style={{ marginBottom: '0.55rem' }}>
              <h2 style={{ margin: 0, color: '#f4efdc', fontSize: '0.98rem', fontWeight: 850 }}>What tends to matter in this occupation?</h2>
              <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.35)', fontSize: '0.71rem' }}>Review prominence — not a fabricated incidence rate.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.65rem' }}>
              {profile.injurySignals.map(signal => {
                const style = PROMINENCE_STYLE[signal.prominence];
                return (
                  <div key={signal.label} className="glass-card" style={{ padding: '0.9rem', borderColor: style.border, background: style.background }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'flex-start' }}>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.82rem', lineHeight: 1.35 }}>{signal.label}</div>
                      <span style={{ color: style.color, fontSize: '0.61rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{signal.prominence}</span>
                    </div>
                    <div style={{ marginTop: '0.65rem' }}>
                      <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em' }}>Body regions</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>
                        {signal.bodyRegions.map(region => <span key={region} style={{ color: 'rgba(255,255,255,0.68)', fontSize: '0.66rem', padding: '0.2rem 0.4rem', borderRadius: 5, background: 'rgba(0,0,0,0.15)' }}>{region}</span>)}
                      </div>
                    </div>
                    <div style={{ marginTop: '0.65rem', color: 'rgba(255,255,255,0.48)', fontSize: '0.72rem', lineHeight: 1.5 }}>{signal.reviewerWhy}</div>
                    <div style={{ marginTop: '0.65rem', color: 'rgba(255,255,255,0.32)', fontSize: '0.66rem', lineHeight: 1.45 }}>
                      {signal.mechanisms.join(' · ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.75rem' }}>
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.42rem', color: '#f4efdc', fontWeight: 850, fontSize: '0.86rem' }}>
                <Target size={16} style={{ color: '#b4d7d0' }} /> Body-part prominence
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                {profile.dominantBodyRegions.map((region, index) => (
                  <span key={region} style={{ padding: '0.33rem 0.5rem', borderRadius: 7, fontSize: '0.7rem', color: index < 4 ? '#b4d7d0' : 'rgba(255,255,255,0.55)', background: index < 4 ? 'rgba(180,215,208,0.07)' : 'rgba(255,255,255,0.025)', border: index < 4 ? '1px solid rgba(180,215,208,0.16)' : '1px solid rgba(255,255,255,0.07)' }}>{region}</span>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.42rem', color: '#f4efdc', fontWeight: 850, fontSize: '0.86rem' }}>
                <Briefcase size={16} style={{ color: '#b4d7d0' }} /> Common mechanisms to consider
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                {profile.dominantMechanisms.map(mechanism => (
                  <span key={mechanism} style={{ padding: '0.33rem 0.5rem', borderRadius: 7, fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>{mechanism}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="glass-card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.6rem' }}>
              <ShieldCheck size={16} style={{ color: '#b4d7d0' }} />
              <div style={{ color: '#f4efdc', fontSize: '0.86rem', fontWeight: 850 }}>Job-demand context</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.65rem' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.34)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800, marginBottom: '0.35rem' }}>Physical</div>
                {selectedJob.physicalDemands.slice(0, 5).map(item => <div key={item} style={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.7rem', lineHeight: 1.45, marginBottom: '0.32rem' }}>• {item}</div>)}
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.34)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800, marginBottom: '0.35rem' }}>Cognitive / safety</div>
                {selectedJob.cognitiveRequirements.slice(0, 5).map(item => <div key={item} style={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.7rem', lineHeight: 1.45, marginBottom: '0.32rem' }}>• {item}</div>)}
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.34)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800, marginBottom: '0.35rem' }}>Environment</div>
                {selectedJob.environmentalExposures.slice(0, 5).map(item => <div key={item} style={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.7rem', lineHeight: 1.45, marginBottom: '0.32rem' }}>• {item}</div>)}
              </div>
            </div>
          </section>

          {findingMatch && (
            <section className="glass-card" style={{ padding: '1rem 1.1rem', borderColor: findingMatch.relevance === 'High' ? 'rgba(239,68,68,0.18)' : 'rgba(180,215,208,0.16)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#b4d7d0', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 800 }}>Finding × occupation</div>
                  <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 850, marginTop: 3 }}>{findingMatch.finding} <ArrowRight size={14} style={{ verticalAlign: -2, margin: '0 0.2rem', color: 'rgba(255,255,255,0.3)' }} /> {selectedJob.title}</div>
                </div>
                <span style={{ color: findingMatch.relevance === 'High' ? '#f5b7b1' : '#b4d7d0', fontSize: '0.68rem', fontWeight: 850 }}>{findingMatch.relevance} relevance</span>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.76rem', lineHeight: 1.55, margin: '0.75rem 0' }}>{findingMatch.explanation}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.8rem' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.34)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800, marginBottom: '0.4rem' }}>Potentially affected demands</div>
                  {findingMatch.affectedDemands.length ? findingMatch.affectedDemands.map(item => <div key={item} style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.71rem', lineHeight: 1.45, marginBottom: '0.35rem' }}>• {item}</div>) : <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.71rem' }}>No direct demand match in the local profile.</div>}
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.34)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800, marginBottom: '0.4rem' }}>Questions that may resolve the review</div>
                  {findingMatch.reviewQuestions.map(question => <div key={question} style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.71rem', lineHeight: 1.45, marginBottom: '0.35rem' }}>• {question}</div>)}
                </div>
              </div>
            </section>
          )}

          <section className="glass-card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
              <Database size={16} style={{ color: '#b4d7d0' }} />
              <div>
                <div style={{ color: '#f4efdc', fontSize: '0.86rem', fontWeight: 850 }}>Historical and surveillance sources</div>
                <div style={{ color: 'rgba(255,255,255,0.34)', fontSize: '0.66rem', marginTop: 2 }}>Official sources behind the next data-ingestion layer.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.55rem' }}>
              {sources.map(source => (
                <a key={source.label} href={source.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '0.75rem', background: 'rgba(255,255,255,0.02)', display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'flex-start' }}>
                    <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>{source.label}</div>
                    <SourceBadge role={source.role} />
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', lineHeight: 1.45, marginTop: '0.4rem' }}>{source.detail}</div>
                  <div style={{ color: '#b4d7d0', fontSize: '0.65rem', marginTop: '0.45rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Open source <ExternalLink size={10} /></div>
                </a>
              ))}
            </div>
          </section>

          <div style={{ padding: '0.75rem 0.85rem', borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.37)', fontSize: '0.68rem', lineHeight: 1.5 }}>
            <strong style={{ color: 'rgba(255,255,255,0.55)' }}>Data boundary:</strong> {profile.sourceNote} The tool supports review; it does not make a medical-clearance determination.
          </div>
        </>
      )}
    </div>
  );
}
