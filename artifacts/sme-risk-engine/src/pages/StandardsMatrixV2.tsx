import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  Flame,
  Layers3,
  ListChecks,
  Network,
  Plane,
  Radar,
  Shield,
  Truck,
} from 'lucide-react';
import StandardsRelationshipMap from './StandardsRelationshipMap';
import {
  STANDARD_SOURCES,
  defaultFrameworksForOccupation,
  evaluateStandards,
  type FindingLevel,
  type ReviewContext,
  type StandardFinding,
  type StandardId,
} from './standardsIntelligenceData';
import './standards-matrix.css';

const FRAMEWORK_ICON: Record<StandardId, typeof Shield> = {
  'centcom-mod18': Radar,
  fmcsa: Truck,
  faa: Plane,
  nfpa1580: Flame,
};

const LEVEL_LABEL: Record<FindingLevel, string> = {
  info: 'Source / baseline',
  review: 'Review required',
  waiver: 'Waiver / special pathway',
  strict: 'Strict / high-priority',
};

const LEVEL_SCORE: Record<FindingLevel, number> = {
  info: 1,
  review: 2,
  waiver: 3,
  strict: 4,
};

const DEFAULT_OCCUPATION = 'DoD contractor — CENTCOM deployment';

const OCCUPATIONS = [
  DEFAULT_OCCUPATION,
  'Firefighter / emergency responder',
  'Commercial driver',
  'Pilot / aviation crew',
  'Deployed firefighter',
  'Deployed commercial driver',
  'Deployed aviation crew',
];

const MATRIX_DOMAINS = [
  { id: 'functional', label: 'Functional / duty', keys: ['functional', 'deployment', 'duty', 'ppe', 'job task', 'environment'] },
  { id: 'cardio', label: 'Cardiovascular', keys: ['cardiovascular', 'hypertension', 'blood pressure', 'ascvd', 'cardiac', 'heart'] },
  { id: 'neuro', label: 'Neurologic', keys: ['neurologic', 'seizure', 'epilep', 'loss of consciousness'] },
  { id: 'sleep', label: 'Sleep / alertness', keys: ['osa', 'sleep', 'pap', 'epworth', 'alertness'] },
  { id: 'metabolic', label: 'Metabolic', keys: ['diabetes', 'a1c', 'insulin', 'glycemic', 'weight'] },
  { id: 'medication', label: 'Medication', keys: ['medication', 'anticoagulant', 'injectable', 'psychotropic', 'controlled substance'] },
  { id: 'sensory', label: 'Vision / hearing', keys: ['vision', 'hearing', 'dental', 'sensory'] },
  { id: 'behavioral', label: 'Behavioral health', keys: ['behavioral', 'psychiatric', 'psych', 'mental health', 'substance'] },
] as const;

function numberValue(value: string): number | undefined {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function findingText(finding: StandardFinding) {
  return `${finding.title} ${finding.summary} ${finding.action} ${finding.topics.join(' ')}`.toLowerCase();
}

function matrixLevel(findings: StandardFinding[], standardId: StandardId, keys: readonly string[]): FindingLevel | null {
  const matches = findings.filter((finding) => {
    if (finding.standardId !== standardId) return false;
    const text = findingText(finding);
    return keys.some((key) => text.includes(key));
  });
  if (!matches.length) return null;
  return matches.sort((a, b) => LEVEL_SCORE[b.level] - LEVEL_SCORE[a.level])[0].level;
}

function sortFindings(findings: StandardFinding[]) {
  return [...findings].sort((a, b) => LEVEL_SCORE[b.level] - LEVEL_SCORE[a.level]);
}

export default function StandardsMatrixV2() {
  const [occupation, setOccupation] = useState(DEFAULT_OCCUPATION);
  const [condition, setCondition] = useState('');
  const [medication, setMedication] = useState('');
  const [frameworks, setFrameworks] = useState<StandardId[]>(() => defaultFrameworksForOccupation(DEFAULT_OCCUPATION));
  const [age, setAge] = useState('');
  const [a1c, setA1c] = useState('');
  const [ahi, setAhi] = useState('');
  const [papCompliance, setPapCompliance] = useState('');
  const [epworth, setEpworth] = useState('');
  const [sbp, setSbp] = useState('');
  const [dbp, setDbp] = useState('');
  const [ascvd, setAscvd] = useState('');
  const [weightLb, setWeightLb] = useState('');
  const [activeFindingId, setActiveFindingId] = useState('');

  const occupationDefaults = useMemo(() => defaultFrameworksForOccupation(occupation), [occupation]);
  const effectiveFrameworks = useMemo<StandardId[]>(
    () => frameworks.length ? frameworks : occupationDefaults,
    [frameworks, occupationDefaults],
  );

  const context = useMemo<ReviewContext>(() => ({
    frameworks: effectiveFrameworks,
    occupation,
    condition,
    medication,
    age: numberValue(age),
    a1c: numberValue(a1c),
    ahi: numberValue(ahi),
    papCompliance: numberValue(papCompliance),
    epworth: numberValue(epworth),
    sbp: numberValue(sbp),
    dbp: numberValue(dbp),
    ascvd: numberValue(ascvd),
    weightLb: numberValue(weightLb),
  }), [effectiveFrameworks, occupation, condition, medication, age, a1c, ahi, papCompliance, epworth, sbp, dbp, ascvd, weightLb]);

  const findings = useMemo(() => evaluateStandards(context), [context]);
  const orderedFindings = useMemo(() => sortFindings(findings), [findings]);
  const activeFinding = findings.find((item) => item.id === activeFindingId) ?? orderedFindings[0] ?? null;
  const strictCount = findings.filter((item) => item.level === 'strict').length;
  const waiverCount = findings.filter((item) => item.level === 'waiver').length;
  const reviewCount = findings.filter((item) => item.level === 'review').length;
  const actionCount = strictCount + waiverCount + reviewCount;
  const escalationCount = strictCount + waiverCount;

  const frameworkStats = useMemo(() => effectiveFrameworks.map((id) => {
    const matched = findings.filter((finding) => finding.standardId === id);
    return {
      id,
      total: matched.length,
      strict: matched.filter((finding) => finding.level === 'strict').length,
      waiver: matched.filter((finding) => finding.level === 'waiver').length,
      review: matched.filter((finding) => finding.level === 'review').length,
      info: matched.filter((finding) => finding.level === 'info').length,
    };
  }), [effectiveFrameworks, findings]);

  const toggleFramework = (id: StandardId) => {
    setFrameworks((current) => {
      const stack = current.length ? current : occupationDefaults;
      if (stack.includes(id)) {
        if (stack.length === 1) return stack;
        return stack.filter((item) => item !== id);
      }
      return [...stack, id];
    });
    setActiveFindingId('');
  };

  const applyOccupation = (value: string) => {
    setOccupation(value);
    setFrameworks(defaultFrameworksForOccupation(value));
    setActiveFindingId('');
  };

  const resetScenario = () => {
    setOccupation(DEFAULT_OCCUPATION);
    setFrameworks(defaultFrameworksForOccupation(DEFAULT_OCCUPATION));
    setCondition('');
    setMedication('');
    setAge('');
    setA1c('');
    setAhi('');
    setPapCompliance('');
    setEpworth('');
    setSbp('');
    setDbp('');
    setAscvd('');
    setWeightLb('');
    setActiveFindingId('');
  };

  return (
    <div className="standards-workbench standards-intelligence standards-command-dashboard" data-testid="standards-matrix">
      <header className="standards-header standards-engine-header standards-command-header">
        <div>
          <div className="standards-kicker"><Network size={13} /> STANDARDS / INTERACTION ENGINE</div>
          <h1>Standards Intelligence</h1>
          <p>Stack the controlling occupational frameworks around one reviewer scenario and see the requirements, escalation pathways, source authority, and reviewer actions as one connected system.</p>
        </div>
        <div className="standards-engine-status">
          <span><i /> SOURCE ENGINE LIVE</span>
          <strong>{effectiveFrameworks.length} frameworks · {findings.length} matched rules</strong>
          <small>{occupation}</small>
        </div>
      </header>

      <section className="standards-kpi-strip" aria-label="Standards intelligence summary">
        <article className="standards-kpi-card accent-cyan">
          <div><span>Active frameworks</span><Layers3 size={16} /></div>
          <strong>{effectiveFrameworks.length}</strong>
          <small>{effectiveFrameworks.map((id) => STANDARD_SOURCES[id].shortLabel).join(' · ')}</small>
          <i className="kpi-scan" />
        </article>
        <article className="standards-kpi-card accent-blue">
          <div><span>Matched rules</span><FileText size={16} /></div>
          <strong>{findings.length}</strong>
          <small>{findings.length ? 'Source-backed findings in the current scenario' : 'Add a condition, medication, or metric'}</small>
          <i className="kpi-scan" />
        </article>
        <article className="standards-kpi-card accent-amber">
          <div><span>Escalations</span><AlertTriangle size={16} /></div>
          <strong>{escalationCount}</strong>
          <small>{strictCount} strict · {waiverCount} waiver / special pathway</small>
          <i className="kpi-scan" />
        </article>
        <article className="standards-kpi-card accent-green">
          <div><span>Reviewer actions</span><ListChecks size={16} /></div>
          <strong>{actionCount}</strong>
          <small>{reviewCount} standard review · {escalationCount} escalated</small>
          <i className="kpi-scan" />
        </article>
      </section>

      <section className="standards-source-rack standards-source-rack-command" aria-label="Controlling standards">
        {(Object.keys(STANDARD_SOURCES) as StandardId[]).map((id) => {
          const source = STANDARD_SOURCES[id];
          const Icon = FRAMEWORK_ICON[id];
          const active = effectiveFrameworks.includes(id);
          const requiredByOccupation = occupationDefaults.includes(id);
          const count = findings.filter((finding) => finding.standardId === id).length;
          return (
            <button key={id} type="button" className={`standard-source-chip${active ? ' active' : ''}`} onClick={() => toggleFramework(id)}>
              <span className="source-chip-icon"><Icon size={17} /></span>
              <span><small>{source.shortLabel}</small><strong>{source.edition}</strong><b>{count} matched</b></span>
              <em>{active ? (requiredByOccupation ? 'CORE' : 'IN STACK') : 'ADD'}</em>
              <i className="source-chip-sweep" />
            </button>
          );
        })}
      </section>

      <div className="standards-command-grid">
        <aside className="standards-context-panel standards-command-module scenario-module">
          <div className="panel-title panel-title-command">
            <span>01</span>
            <div><strong>Scenario builder</strong><small>Reviewer inputs drive every other module.</small></div>
            <button type="button" className="standards-reset" onClick={resetScenario}>Reset</button>
          </div>

          <label className="standards-field">
            <span>Occupation / program</span>
            <select value={occupation} onChange={(event) => applyOccupation(event.target.value)}>
              {OCCUPATIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="standards-field"><span>Condition / concern</span><input value={condition} onChange={(event) => setCondition(event.target.value)} placeholder="OSA, hypertension, seizure, diabetes…" /></label>
          <label className="standards-field"><span>Medication</span><input value={medication} onChange={(event) => setMedication(event.target.value)} placeholder="Eliquis, insulin, metoprolol…" /></label>

          <div className="standards-metrics-grid">
            <label><span>Age</span><input inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} placeholder="40" /></label>
            <label><span>Weight lb</span><input inputMode="decimal" value={weightLb} onChange={(e) => setWeightLb(e.target.value)} placeholder="300" /></label>
            <label><span>A1C %</span><input inputMode="decimal" value={a1c} onChange={(e) => setA1c(e.target.value)} placeholder="7.0" /></label>
            <label><span>ASCVD %</span><input inputMode="decimal" value={ascvd} onChange={(e) => setAscvd(e.target.value)} placeholder="15" /></label>
            <label><span>SBP</span><input inputMode="decimal" value={sbp} onChange={(e) => setSbp(e.target.value)} placeholder="140" /></label>
            <label><span>DBP</span><input inputMode="decimal" value={dbp} onChange={(e) => setDbp(e.target.value)} placeholder="90" /></label>
            <label><span>AHI</span><input inputMode="decimal" value={ahi} onChange={(e) => setAhi(e.target.value)} placeholder="30" /></label>
            <label><span>PAP %</span><input inputMode="decimal" value={papCompliance} onChange={(e) => setPapCompliance(e.target.value)} placeholder="70" /></label>
            <label><span>Epworth</span><input inputMode="decimal" value={epworth} onChange={(e) => setEpworth(e.target.value)} placeholder="10" /></label>
          </div>

          <div className="standards-context-note">
            <Shield size={15} />
            <p>Source-backed reviewer intelligence only. Final disposition remains with the designated physician, AME, ME, agency, or waiver authority.</p>
          </div>
        </aside>

        <main className="standards-analysis-panel standards-command-module network-module">
          <div className="standards-analysis-head standards-module-head">
            <div><span>02</span><strong>Standards interaction map</strong><small>Scenario → controlling sources → matched requirements</small></div>
            <div className="standards-severity-strip">
              <b className="strict">{strictCount} strict</b>
              <b className="waiver">{waiverCount} waiver</b>
              <b className="review">{reviewCount} review</b>
            </div>
          </div>
          <div className="standards-network-shell standards-network-shell-command">
            <div className="standards-radar-ring ring-one" />
            <div className="standards-radar-ring ring-two" />
            <div className="standards-radar-sweep" />
            <StandardsRelationshipMap frameworks={effectiveFrameworks} findings={findings} activeFindingId={activeFinding?.id} onFindingSelect={setActiveFindingId} />
            <div className="standards-network-legend"><span><i className="strict" /> strict</span><span><i className="waiver" /> waiver</span><span><i className="review" /> review</span><span><i className="source" /> source</span></div>
          </div>
        </main>

        <aside className="standards-finding-inspector standards-command-module intelligence-module">
          <div className="panel-title panel-title-command"><span>03</span><div><strong>Reviewer intelligence</strong><small>Selected source-backed finding</small></div></div>
          {activeFinding ? (
            <>
              <div className={`finding-level level-${activeFinding.level}`}>{LEVEL_LABEL[activeFinding.level]}</div>
              <h2>{activeFinding.title}</h2>
              <p className="finding-summary">{activeFinding.summary}</p>
              <div className="finding-action"><strong>Reviewer action</strong><p>{activeFinding.action}</p></div>
              <div className="finding-source-block">
                <span>{STANDARD_SOURCES[activeFinding.standardId].shortLabel}</span>
                <strong>{activeFinding.citation}</strong>
                <a href={activeFinding.sourceUrl} target="_blank" rel="noreferrer"><BookOpen size={13} /> Open controlling source <ExternalLink size={11} /></a>
              </div>
              <div className="finding-topics">{activeFinding.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
            </>
          ) : (
            <div className="standards-no-finding"><CheckCircle2 size={28} /><strong>No matched condition rule yet</strong><p>Add a condition, medication, metric, or another framework to build the cross-standard review.</p></div>
          )}
        </aside>

        <section className="standards-command-module load-module">
          <div className="standards-module-head compact"><div><span>04</span><strong>Standards load</strong><small>Matched findings by active source.</small></div><BarChart3 size={16} /></div>
          <div className="standards-load-chart">
            {frameworkStats.map((stat) => {
              const source = STANDARD_SOURCES[stat.id];
              const max = Math.max(1, ...frameworkStats.map((item) => item.total));
              return (
                <div className="standards-load-row" key={stat.id}>
                  <div className="load-label"><span>{source.shortLabel}</span><strong>{stat.total}</strong></div>
                  <div className="load-track">
                    <i className="load-fill" style={{ width: `${(stat.total / max) * 100}%` }} />
                    <span className="load-segment strict" style={{ flex: stat.strict }} />
                    <span className="load-segment waiver" style={{ flex: stat.waiver }} />
                    <span className="load-segment review" style={{ flex: stat.review }} />
                    <span className="load-segment info" style={{ flex: stat.info }} />
                  </div>
                  <small>{stat.strict} S · {stat.waiver} W · {stat.review} R</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="standards-command-module matrix-module">
          <div className="standards-module-head compact"><div><span>05</span><strong>Cross-standard matrix</strong><small>Where the active standards touch the same reviewer domains.</small></div><Activity size={16} /></div>
          <div className="standards-comparison-matrix">
            <div className="matrix-head"><span>Domain</span>{effectiveFrameworks.map((id) => <span key={id}>{STANDARD_SOURCES[id].shortLabel}</span>)}</div>
            {MATRIX_DOMAINS.map((domain) => (
              <div className="matrix-row" key={domain.id}>
                <strong>{domain.label}</strong>
                {effectiveFrameworks.map((id) => {
                  const level = matrixLevel(findings, id, domain.keys);
                  return <span key={id} className={`matrix-cell${level ? ` level-${level}` : ''}`} title={level ? LEVEL_LABEL[level] : 'No matched rule'}>{level ? LEVEL_SCORE[level] : '—'}</span>;
                })}
              </div>
            ))}
          </div>
          <div className="matrix-key"><span><i className="info" /> baseline</span><span><i className="review" /> review</span><span><i className="waiver" /> waiver</span><span><i className="strict" /> strict</span></div>
        </section>

        <section className="standards-command-module queue-module">
          <div className="standards-module-head compact"><div><span>06</span><strong>Reviewer action queue</strong><small>Highest-priority matched requirements first.</small></div><ClipboardList size={16} /></div>
          <div className="standards-action-queue">
            {orderedFindings.slice(0, 6).map((item, index) => (
              <button type="button" key={item.id} className={`action-queue-item level-${item.level}${activeFinding?.id === item.id ? ' active' : ''}`} onClick={() => setActiveFindingId(item.id)}>
                <span className="queue-rank">{String(index + 1).padStart(2, '0')}</span>
                <div><small>{STANDARD_SOURCES[item.standardId].shortLabel} · {LEVEL_LABEL[item.level]}</small><strong>{item.title}</strong><p>{item.action}</p></div>
                <ChevronRight size={14} />
              </button>
            ))}
            {!orderedFindings.length && <div className="queue-empty">No actions yet. Add a condition, medication, or reviewer metric.</div>}
          </div>
        </section>
      </div>

      <section className="standards-command-module findings-module">
        <div className="standards-findings-head standards-module-head"><div><span>07</span><strong>Matched requirements</strong><small>Click a finding to inspect its source and reviewer action.</small></div><strong>{findings.length} findings</strong></div>
        <div className="standards-findings-grid standards-findings-grid-command">
          {findings.map((item) => {
            const source = STANDARD_SOURCES[item.standardId];
            return (
              <button key={item.id} type="button" onClick={() => setActiveFindingId(item.id)} className={`standard-finding-card level-${item.level}${activeFinding?.id === item.id ? ' active' : ''}`}>
                <div className="finding-card-top"><span>{source.shortLabel}</span><em>{LEVEL_LABEL[item.level]}</em></div>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
                <small>{item.citation}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="standards-command-module source-register-module">
        <div className="standards-findings-head standards-module-head"><div><span>08</span><strong>Authority & source register</strong><small>Controlling source, authority class, edition, and live access.</small></div><BookOpen size={16} /></div>
        <div className="standards-source-register-grid standards-source-register-command">
          {effectiveFrameworks.map((id) => {
            const source = STANDARD_SOURCES[id];
            return <article key={id}><span>{source.authority.replace('-', ' ')}</span><h3>{source.title}</h3><p>{source.description}</p><div><b>{source.currentAsOf}</b><a href={source.sourceUrl} target="_blank" rel="noreferrer">Open source <ExternalLink size={11} /></a></div></article>;
          })}
        </div>
      </section>

      <div className="standards-footnote"><AlertTriangle size={14} /> Verify current controlling versions and client-, agency-, employer-, contract-, theater-, or jurisdiction-specific requirements before applying criteria. NFPA copyrighted criteria are referenced to the authorized NFPA source rather than reproduced wholesale.</div>
    </div>
  );
}
