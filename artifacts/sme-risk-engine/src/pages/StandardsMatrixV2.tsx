import { useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, ExternalLink, Flame, Network, Plane, Radar, Shield, Truck } from 'lucide-react';
import StandardsRelationshipMap from './StandardsRelationshipMap';
import {
  STANDARD_SOURCES,
  defaultFrameworksForOccupation,
  evaluateStandards,
  type FindingLevel,
  type ReviewContext,
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

function numberValue(value: string): number | undefined {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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
  const activeFinding = findings.find((item) => item.id === activeFindingId) ?? findings[0] ?? null;
  const strictCount = findings.filter((item) => item.level === 'strict').length;
  const waiverCount = findings.filter((item) => item.level === 'waiver').length;
  const reviewCount = findings.filter((item) => item.level === 'review').length;

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

  return (
    <div className="standards-workbench standards-intelligence" data-testid="standards-matrix">
      <header className="standards-header standards-engine-header">
        <div>
          <div className="standards-kicker"><Network size={13} /> STANDARDS / INTERACTION ENGINE</div>
          <h1>Standards Intelligence</h1>
          <p>Stack the actual controlling frameworks around a reviewer scenario, surface the rules that interact, and separate binding requirements, waiver pathways, guidance, and copyrighted consensus standards.</p>
        </div>
        <div className="standards-engine-status">
          <span><i /> SOURCE ENGINE LIVE</span>
          <strong>{effectiveFrameworks.length} frameworks · {findings.length} matched rules</strong>
        </div>
      </header>

      <section className="standards-source-rack" aria-label="Controlling standards">
        {(Object.keys(STANDARD_SOURCES) as StandardId[]).map((id) => {
          const source = STANDARD_SOURCES[id];
          const Icon = FRAMEWORK_ICON[id];
          const active = effectiveFrameworks.includes(id);
          const requiredByOccupation = occupationDefaults.includes(id);
          return (
            <button key={id} type="button" className={`standard-source-chip${active ? ' active' : ''}`} onClick={() => toggleFramework(id)}>
              <span className="source-chip-icon"><Icon size={17} /></span>
              <span><small>{source.shortLabel}</small><strong>{source.edition}</strong></span>
              <em>{active ? (requiredByOccupation ? 'CORE' : 'IN STACK') : 'ADD'}</em>
            </button>
          );
        })}
      </section>

      <div className="standards-engine-grid">
        <aside className="standards-context-panel">
          <div className="panel-title"><span>01</span><div><strong>Review context</strong><small>Build the scenario that standards will evaluate.</small></div></div>

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
            <p>This engine surfaces source-backed reviewer issues. It does not independently issue a medical clearance or replace the designated physician, AME, ME, agency, or waiver authority.</p>
          </div>
        </aside>

        <main className="standards-analysis-panel">
          <div className="standards-analysis-head">
            <div><span>02</span><strong>Interaction map</strong><small>Scenario → controlling sources → matched requirements</small></div>
            <div className="standards-severity-strip">
              <b className="strict">{strictCount} strict</b>
              <b className="waiver">{waiverCount} waiver</b>
              <b className="review">{reviewCount} review</b>
            </div>
          </div>
          <div className="standards-network-shell">
            <StandardsRelationshipMap frameworks={effectiveFrameworks} findings={findings} activeFindingId={activeFinding?.id} onFindingSelect={setActiveFindingId} />
            <div className="standards-network-legend"><span><i className="strict" /> strict</span><span><i className="waiver" /> waiver</span><span><i className="review" /> review</span><span><i className="source" /> source</span></div>
          </div>
        </main>

        <aside className="standards-finding-inspector">
          <div className="panel-title"><span>03</span><div><strong>Reviewer intelligence</strong><small>Selected source-backed finding</small></div></div>
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
      </div>

      <section className="standards-findings-section">
        <div className="standards-findings-head"><div><span>04</span><strong>Matched requirements</strong><small>Click a finding to inspect its source and reviewer action.</small></div><strong>{findings.length} findings</strong></div>
        <div className="standards-findings-grid">
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

      <section className="standards-source-register">
        <div className="standards-findings-head"><div><span>05</span><strong>Source register</strong><small>Authority, edition, and live source access.</small></div></div>
        <div className="standards-source-register-grid">
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
