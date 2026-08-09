import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pill,
  Search,
  ShieldCheck,
  Thermometer,
  X,
  Zap,
} from 'lucide-react';
import { rxNormUrl, searchRxNorm, type RxNormCandidate } from '@/lib/rxNormLookup';
import './drug-checker.css';

type OccupationalProfile = {
  id: string;
  aliases: string[];
  className: string;
  flags: string[];
  reviewerPoints: string[];
};

type SelectedDrug = RxNormCandidate & { key: string };

const PROFILES: OccupationalProfile[] = [
  {
    id: 'gabapentin',
    aliases: ['gabapentin', 'neurontin'],
    className: 'Anticonvulsant / neuropathic pain agent',
    flags: ['Sedation / dizziness', 'Coordination'],
    reviewerPoints: ['Consider reported somnolence, dizziness, or ataxia when duties require sustained alertness, balance, driving, or hazardous equipment.', 'Renal function may affect dosing and tolerability.'],
  },
  {
    id: 'warfarin',
    aliases: ['warfarin', 'coumadin', 'jantoven'],
    className: 'Vitamin K antagonist anticoagulant',
    flags: ['Bleeding', 'Monitoring'],
    reviewerPoints: ['Bleeding consequences may be more important in jobs with trauma exposure or delayed access to care.', 'Confirm that required anticoagulation monitoring can be maintained in the work or deployment setting.'],
  },
  {
    id: 'insulin',
    aliases: ['insulin', 'humalog', 'novolog', 'novolin', 'lantus', 'levemir', 'tresiba', 'basaglar'],
    className: 'Insulin therapy',
    flags: ['Hypoglycemia', 'Medication access / storage'],
    reviewerPoints: ['Review severe hypoglycemia history, recognition, monitoring, and the actual safety sensitivity of the position.', 'Confirm reliable access to medication, supplies, glucose monitoring, and manufacturer-appropriate storage.'],
  },
  {
    id: 'metoprolol',
    aliases: ['metoprolol', 'lopressor', 'toprol'],
    className: 'Beta blocker',
    flags: ['Heart-rate response', 'Dizziness / fatigue'],
    reviewerPoints: ['Beta blockade can alter expected heart-rate response during exertion.', 'Reported fatigue, bradycardia, or dizziness may matter in strenuous or safety-sensitive duties.'],
  },
  {
    id: 'hydrochlorothiazide',
    aliases: ['hydrochlorothiazide', 'hctz', 'microzide'],
    className: 'Thiazide diuretic',
    flags: ['Hydration / electrolytes', 'Heat'],
    reviewerPoints: ['Review dehydration or electrolyte concerns when work involves sustained heat exposure or heavy exertion.', 'Reported orthostasis or weakness may be occupationally relevant.'],
  },
  {
    id: 'doxycycline',
    aliases: ['doxycycline', 'vibramycin'],
    className: 'Tetracycline antibiotic',
    flags: ['Photosensitivity', 'Administration constraints'],
    reviewerPoints: ['Photosensitivity can matter for prolonged outdoor work or deployment.', 'Consider whether reliable hydration and appropriate administration are practical in the work setting.'],
  },
  {
    id: 'mefloquine',
    aliases: ['mefloquine', 'lariam'],
    className: 'Antimalarial',
    flags: ['Neuropsychiatric effects', 'Dizziness'],
    reviewerPoints: ['Current or prior neuropsychiatric symptoms and dizziness can be especially relevant to safety-sensitive work.', 'Review the prescribing guidance and individual history rather than assuming class-wide occupational unfitness.'],
  },
  {
    id: 'prednisone',
    aliases: ['prednisone', 'prednisolone'],
    className: 'Systemic corticosteroid',
    flags: ['Glucose / BP effects', 'Infection risk'],
    reviewerPoints: ['Dose, duration, indication, and current adverse effects matter more than the medication name alone.', 'Longer or higher-dose use may warrant review of metabolic, infection, musculoskeletal, or psychiatric effects relevant to duties.'],
  },
  {
    id: 'sertraline',
    aliases: ['sertraline', 'zoloft'],
    className: 'SSRI antidepressant',
    flags: ['Alertness / sleep', 'Treatment stability'],
    reviewerPoints: ['Review actual side effects and treatment stability; the medication itself does not establish functional impairment.', 'Somnolence, insomnia, dizziness, or recent dose changes may matter in safety-sensitive work.'],
  },
  {
    id: 'amlodipine',
    aliases: ['amlodipine', 'norvasc'],
    className: 'Calcium-channel blocker',
    flags: ['Hypotension / dizziness', 'Edema'],
    reviewerPoints: ['Review symptomatic hypotension, dizziness, or edema if the job includes heights, heavy exertion, or prolonged standing.', 'Medication tolerance and BP control are more useful than the drug name alone.'],
  },
  {
    id: 'metformin',
    aliases: ['metformin', 'glucophage', 'fortamet'],
    className: 'Biguanide antihyperglycemic',
    flags: ['GI tolerance', 'Renal function'],
    reviewerPoints: ['GI effects may matter when field access to hydration or sanitation is limited.', 'Renal status and the underlying diabetes control are generally more relevant than metformin use by itself.'],
  },
  {
    id: 'azithromycin',
    aliases: ['azithromycin', 'zithromax', 'z-pak', 'zpak'],
    className: 'Macrolide antibiotic',
    flags: ['QT / cardiac context', 'Acute illness'],
    reviewerPoints: ['The reason for treatment and current illness may be more occupationally important than a short antibiotic course.', 'Review cardiac/QT context when other risk factors or QT-prolonging therapies are present.'],
  },
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function profileFor(name: string): OccupationalProfile | null {
  const clean = normalize(name);
  return PROFILES.find((profile) => profile.aliases.some((alias) => clean.includes(normalize(alias)))) ?? null;
}

function localFallback(query: string): RxNormCandidate[] {
  const clean = normalize(query);
  if (clean.length < 2) return [];
  return PROFILES
    .filter((profile) => profile.aliases.some((alias) => normalize(alias).includes(clean) || clean.includes(normalize(alias))))
    .slice(0, 8)
    .map((profile) => ({ rxcui: `local-${profile.id}`, name: profile.aliases[0], score: null }));
}

export default function DrugCheckerV2() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RxNormCandidate[]>([]);
  const [selected, setSelected] = useState<SelectedDrug[]>([]);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState('');
  const [sourceMode, setSourceMode] = useState<'live' | 'fallback' | null>(null);

  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 2) {
      setResults([]);
      setSourceMode(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setNotice('');
      try {
        const live = await searchRxNorm(clean, 8);
        if (live.length) {
          setResults(live);
          setSourceMode('live');
        } else {
          setResults(localFallback(clean));
          setSourceMode('fallback');
          setNotice('RxNorm returned no match. Showing reviewed local aliases when available.');
        }
      } catch {
        setResults(localFallback(clean));
        setSourceMode('fallback');
        setNotice('Live RxNorm lookup is unavailable. Reviewed local aliases are still searchable.');
      } finally {
        setSearching(false);
      }
    }, 260);
    return () => window.clearTimeout(timer);
  }, [query]);

  const reviewedCount = useMemo(() => selected.filter((drug) => profileFor(drug.name)).length, [selected]);

  function addDrug(candidate: RxNormCandidate) {
    if (selected.some((drug) => drug.rxcui === candidate.rxcui && drug.name === candidate.name)) return;
    setSelected((current) => [...current, { ...candidate, key: `${candidate.rxcui}-${candidate.name}-${Date.now()}` }]);
    setQuery('');
    setResults([]);
    setSourceMode(null);
  }

  return (
    <div className="drug-workbench" data-testid="drug-checker">
      <header className="drug-header">
        <div>
          <div className="drug-kicker">MEDICATION / OCCUPATIONAL REVIEW</div>
          <h1>Drug Checker</h1>
          <p>Resolve real medication names through RxNorm, then show occupational review flags only when a curated profile exists.</p>
        </div>
        <div className="drug-status"><span className={sourceMode === 'live' ? 'active' : ''} /><div><strong>RxNorm</strong><small>{sourceMode === 'live' ? 'live lookup' : 'ready'}</small></div></div>
      </header>

      <section className="drug-search-panel">
        <label>MEDICATION NAME</label>
        <div className="drug-search-input">
          {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Gabapentin, Eliquis, metoprolol, insulin glargine…" autoFocus />
          {query && <button onClick={() => setQuery('')} aria-label="Clear medication search"><X size={14} /></button>}
        </div>

        {results.length > 0 && (
          <div className="drug-results">
            {results.map((candidate) => {
              const profile = profileFor(candidate.name);
              return <button key={`${candidate.rxcui}-${candidate.name}`} onClick={() => addDrug(candidate)}>
                <div><strong>{candidate.name}</strong><small>{candidate.rxcui.startsWith('local-') ? 'Local reviewed alias' : `RxCUI ${candidate.rxcui}`}</small></div>
                <span className={profile ? 'reviewed' : ''}>{profile ? 'Reviewed profile' : 'Identity only'}</span>
              </button>;
            })}
          </div>
        )}
        {notice && <div className="drug-notice">{notice}</div>}
      </section>

      <div className="drug-layout">
        <main className="drug-selected-panel">
          <div className="drug-panel-head"><div><span>SELECTED MEDICATIONS</span><h2>{selected.length ? `${selected.length} in review` : 'No medications selected'}</h2></div><small>{reviewedCount} with curated occupational profiles</small></div>

          {selected.length === 0 ? (
            <div className="drug-empty"><Pill size={21} /><strong>Search a medication above.</strong><p>RxNorm identifies the medication. The toolkit adds occupational context only where a reviewed local profile exists.</p></div>
          ) : (
            <div className="drug-card-list">
              {selected.map((drug) => {
                const profile = profileFor(drug.name);
                return <article className="drug-card" key={drug.key}>
                  <div className="drug-card-head">
                    <div><span>{profile ? 'REVIEWED OCCUPATIONAL PROFILE' : 'RXNORM IDENTITY'}</span><h3>{drug.name}</h3><p>{profile?.className ?? 'No curated occupational profile is stored for this medication.'}</p></div>
                    <div className="drug-card-actions">
                      {!drug.rxcui.startsWith('local-') && <a href={rxNormUrl(drug.rxcui)} target="_blank" rel="noreferrer">RxNorm <ExternalLink size={10} /></a>}
                      <button onClick={() => setSelected((current) => current.filter((item) => item.key !== drug.key))}><X size={13} /></button>
                    </div>
                  </div>

                  {profile ? (
                    <>
                      <div className="drug-flags">{profile.flags.map((flag) => <span key={flag}>{flag}</span>)}</div>
                      <div className="drug-review-points">{profile.reviewerPoints.map((point) => <div key={point}><CheckCircle2 size={12} /><p>{point}</p></div>)}</div>
                    </>
                  ) : (
                    <div className="drug-identity-only"><ShieldCheck size={14} /><p>The medication was normalized, but this toolkit does not have a reviewed occupational profile for it. No occupational risk is inferred from the name alone.</p></div>
                  )}
                </article>;
              })}
            </div>
          )}
        </main>

        <aside className="drug-side-panel">
          <div className="drug-side-label">WHAT THIS TOOL DOES</div>
          <div className="drug-capability"><Zap size={14} /><div><strong>Normalizes medication names</strong><p>Live NLM RxNorm lookup handles brand, ingredient, and approximate medication-name matching.</p></div></div>
          <div className="drug-capability"><Thermometer size={14} /><div><strong>Surfaces reviewed work-context flags</strong><p>Sedation, heat, storage, monitoring, or other occupational considerations appear only for curated profiles.</p></div></div>
          <div className="drug-capability"><AlertTriangle size={14} /><div><strong>Does not invent interactions</strong><p>Pairwise drug-interaction screening is not presented unless a verified interaction source is connected.</p></div></div>
        </aside>
      </div>
    </div>
  );
}
