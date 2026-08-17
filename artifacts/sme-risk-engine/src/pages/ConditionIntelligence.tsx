import { useEffect, useMemo, useState } from 'react';
import { Activity, Bone, Brain, ExternalLink, FileText, Heart, Loader2, Pill, Search, Shield, Stethoscope } from 'lucide-react';
import { Link } from 'wouter';
import { useStore } from '@/lib/store';
import { fetchPubMedArticles } from '@/lib/directSourceIntelligence';
import './condition-intelligence.css';

type ConditionProfile = {
  name: string;
  reviewerContext: string;
  redFlags: string[];
  functionalDomains: string[];
  questions: string[];
  documentation: string[];
};

type Category = {
  label: string;
  subtitle: string;
  icon: typeof Heart;
  conditions: ConditionProfile[];
};

const CATEGORIES: Record<string, Category> = {
  cardiovascular: {
    label: 'Cardiovascular', subtitle: 'Cardiac review intelligence', icon: Heart,
    conditions: [
      { name: 'Coronary Artery Disease', reviewerContext: 'Center the review on current symptoms, functional capacity, event/intervention history, medication tolerance, and treating-cardiology restrictions. Diagnosis alone does not describe present work capacity.', functionalDomains: ['Exercise tolerance', 'Chest symptoms', 'Sudden-event history', 'Medication tolerance'], redFlags: ['Recent major cardiac event', 'Unstable exertional symptoms', 'Syncope or near-syncope', 'Outdated functional assessment'], questions: ['What was the most recent cardiac event or intervention?', 'Any current symptoms with exertion?', 'What workload was achieved on the most recent functional test?', 'Any current treating-cardiologist restrictions?'], documentation: ['Cardiology note', 'Recent ECG / cardiac testing when relevant', 'Functional or stress-test report', 'Current medication list'] },
      { name: 'Hypertension', reviewerContext: 'Focus on pattern, treatment stability, symptoms, and end-organ impact rather than a single isolated reading.', functionalDomains: ['Blood-pressure control', 'Orthostatic tolerance', 'Medication effects', 'End-organ status'], redFlags: ['Persistently uncontrolled readings', 'Symptomatic hypotension or dizziness', 'Recent major medication change', 'Possible end-organ complications'], questions: ['What is the recent BP trend?', 'Any dizziness, syncope, chest pain, or severe headache?', 'Any recent antihypertensive medication changes?', 'Any known cardiac, renal, retinal, or neurologic complications?'], documentation: ['Serial BP readings', 'Current medication list', 'Treating-provider note if control is uncertain', 'Relevant renal/cardiac records when indicated'] },
    ],
  },
  respiratory: {
    label: 'Respiratory', subtitle: 'Pulmonary review intelligence', icon: Activity,
    conditions: [
      { name: 'Asthma / Reactive Airway Disease', reviewerContext: 'Review current control, exacerbation history, rescue-medication use, objective pulmonary data when relevant, and tolerance of required respiratory PPE.', functionalDomains: ['Exertional breathing', 'Irritant exposure', 'Bronchospasm risk', 'Respirator / SCBA tolerance'], redFlags: ['Recent ED visit or hospitalization', 'Frequent rescue inhaler use', 'Current systemic steroid use', 'Difficulty tolerating required respiratory PPE'], questions: ['Any exacerbations or urgent care in the past year?', 'How often is rescue medication used?', 'Is recent spirometry available when clinically relevant?', 'Any limitation with respirator or SCBA use?'], documentation: ['Pulmonary or primary-care note', 'Recent spirometry when indicated', 'Medication list / rescue use history', 'Respirator tolerance or occupational testing when applicable'] },
      { name: 'COPD', reviewerContext: 'The useful question is current reserve: symptoms, exacerbations, oxygen requirement, objective pulmonary function, and actual job exertion.', functionalDomains: ['Aerobic reserve', 'Dyspnea', 'Hypoxemia risk', 'Exacerbation risk'], redFlags: ['Recent exacerbation', 'Supplemental oxygen', 'Marked exertional limitation', 'Outdated pulmonary assessment'], questions: ['Most recent spirometry and clinical stage?', 'Any oxygen requirement?', 'Any exacerbations in the past year?', 'What exertion can be performed without limiting symptoms?'], documentation: ['Pulmonary note', 'Recent spirometry', 'Oxygen requirement documentation if applicable', 'Functional restrictions if any'] },
    ],
  },
  neurologic: {
    label: 'Neurologic', subtitle: 'Neurologic review intelligence', icon: Brain,
    conditions: [
      { name: 'Seizure Disorder', reviewerContext: 'Separate diagnosis from current recurrence risk. Event timing, cause, stability, treatment, medication effects, and specialist follow-up are the critical facts.', functionalDomains: ['Loss-of-consciousness risk', 'Recurrence risk', 'Cognition', 'Medication effects'], redFlags: ['Recent event', 'Unexplained loss of consciousness', 'Breakthrough seizure', 'Medication instability'], questions: ['Exact date and circumstances of the last event?', 'Current antiseizure medication and stability?', 'Any breakthrough events or medication side effects?', 'Most recent neurology assessment?'], documentation: ['Neurology note', 'Event timeline', 'Medication history', 'Relevant EEG/imaging or specialist records when clinically indicated'] },
      { name: 'TBI / Concussion History', reviewerContext: 'Distinguish remote resolved injury from persistent symptoms. Current cognition, balance, headache, sensory symptoms, and restrictions matter most.', functionalDomains: ['Processing speed', 'Memory / concentration', 'Balance', 'Headache / sensory symptoms'], redFlags: ['Persistent symptoms', 'Recent moderate/severe injury', 'Recurrent concussion', 'Current work/activity restrictions'], questions: ['Date and severity of the most recent injury?', 'Any current headache, dizziness, memory, concentration, or balance symptoms?', 'Any neurologic or neuropsychological follow-up?', 'Any current work or activity restrictions?'], documentation: ['Neurology/rehabilitation note', 'Current symptom assessment', 'Neuropsychological testing when relevant', 'Return-to-work/activity restrictions'] },
    ],
  },
  endocrine: {
    label: 'Endocrine / Metabolic', subtitle: 'Metabolic review intelligence', icon: Pill,
    conditions: [
      { name: 'Diabetes', reviewerContext: 'Review current control, treatment stability, severe hypoglycemia, monitoring reliability, complications, and medication access/storage requirements.', functionalDomains: ['Glucose stability', 'Hypoglycemia risk', 'Monitoring', 'Medication access / storage'], redFlags: ['Severe hypoglycemia', 'Unstable treatment', 'Poor control', 'Significant complications'], questions: ['Current A1c and trend?', 'Any severe hypoglycemia requiring assistance?', 'Monitoring method and reliability?', 'Any neuropathy, retinopathy, nephropathy, or other complications?'], documentation: ['Recent A1c', 'Medication and monitoring plan', 'Treating-provider note', 'Complication-specific records when applicable'] },
    ],
  },
  orthopedic: {
    label: 'Musculoskeletal', subtitle: 'Functional musculoskeletal intelligence', icon: Bone,
    conditions: [
      { name: 'Lumbar Spine Disorder', reviewerContext: 'Match current function and restrictions to actual work demand. Present strength, neurologic status, pain-limited function, and restrictions are more useful than the diagnosis label.', functionalDomains: ['Lifting', 'Bending / twisting', 'Prolonged posture', 'Radicular symptoms'], redFlags: ['Recent surgery', 'Active radiculopathy', 'Neurologic deficit', 'Unclear or unresolved restrictions'], questions: ['Current lifting or positional restrictions?', 'Any weakness, sensory deficit, or radicular symptoms?', 'Recent surgery/procedure and recovery status?', 'Any current functional-capacity or treating-provider restrictions?'], documentation: ['Orthopedic/primary-care note', 'Current restrictions', 'Relevant imaging only when clinically useful', 'Functional-capacity evidence when needed'] },
      { name: 'Shoulder Disorder / Repair', reviewerContext: 'Current range of motion, strength, instability, pain, and work restrictions are the actionable facts for physically demanding roles.', functionalDomains: ['Overhead work', 'Lifting / carrying', 'Pushing / pulling', 'Range of motion / strength'], redFlags: ['Recent repair', 'Recurrent instability', 'Persistent weakness', 'Restricted range of motion'], questions: ['Current ROM and strength?', 'Any recurrent instability or pain with overhead work?', 'Current lifting/pushing/pulling restrictions?', 'Completed rehabilitation and released from orthopedic care?'], documentation: ['Orthopedic note', 'Physical-therapy discharge/status', 'Current restrictions', 'Functional testing when needed'] },
    ],
  },
  behavioral: {
    label: 'Behavioral Health', subtitle: 'Behavioral-health review intelligence', icon: Shield,
    conditions: [
      { name: 'PTSD / Trauma-Related Disorder', reviewerContext: 'Review current function and stability rather than diagnosis alone: symptom burden, treatment stability, medication effects, crisis history, restrictions, and the stress profile of the job.', functionalDomains: ['Concentration', 'Sleep', 'Stress tolerance', 'Medication effects'], redFlags: ['Recent hospitalization or crisis care', 'Severe active symptoms', 'Major treatment change', 'Current functional restriction'], questions: ['Current symptom severity and functional impact?', 'Any crisis care or hospitalization in the past year?', 'Any medication effects on alertness or cognition?', 'Any treating-provider restrictions relevant to work?'], documentation: ['Treating behavioral-health note', 'Medication list', 'Recent stability/treatment history', 'Current restrictions if any'] },
    ],
  },
};

type Article = { pmid: string; title: string; journal: string; year: string; url: string };

export default function ConditionIntelligence() {
  const { guidelines } = useStore();
  const [categoryId, setCategoryId] = useState('neurologic');
  const [conditionIndex, setConditionIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  const category = CATEGORIES[categoryId];
  const condition = category.conditions[conditionIndex] ?? category.conditions[0];
  const matchingCategories = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return Object.entries(CATEGORIES);
    return Object.entries(CATEGORIES).filter(([, item]) => item.label.toLowerCase().includes(clean) || item.conditions.some((entry) => entry.name.toLowerCase().includes(clean)));
  }, [query]);
  const savedGuidelines = useMemo(() => guidelines.filter((item) => item.conditionCategory === categoryId || item.conditionCategory === 'other'), [guidelines, categoryId]);

  useEffect(() => {
    let cancelled = false;
    setLoadingArticles(true);
    setArticles([]);
    fetchPubMedArticles(`${condition.name} occupational medicine functional capacity`, 5)
      .then((items) => { if (!cancelled) setArticles(items); })
      .finally(() => { if (!cancelled) setLoadingArticles(false); });
    return () => { cancelled = true; };
  }, [condition.name]);

  return (
    <div className="condition-intelligence" data-testid="condition-reference">
      <header className="condition-intel-header">
        <div>
          <span className="condition-intel-kicker"><Stethoscope size={14} /> CLINICAL / CONDITION INTELLIGENCE</span>
          <h1>Condition Intelligence</h1>
          <p>Understand the condition itself: functional effects, facts worth resolving, useful documentation, live literature, and internal clinical guidance. Governing thresholds and waiver logic live in Standards Intelligence.</p>
        </div>
        <div className="condition-intel-actions">
          <div className="condition-intel-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search condition…" /></div>
          <Link href="/matrix" className="condition-standards-link">Evaluate governing standards →</Link>
        </div>
      </header>

      <div className="condition-intel-grid">
        <aside className="condition-intel-nav">
          <div className="condition-intel-label">CLINICAL SYSTEMS</div>
          {matchingCategories.map(([id, item]) => { const Icon = item.icon; return <button key={id} className={id === categoryId ? 'active' : ''} onClick={() => { setCategoryId(id); setConditionIndex(0); }}><Icon size={15} /><span><strong>{item.label}</strong><small>{item.conditions.length} topic{item.conditions.length === 1 ? '' : 's'}</small></span></button>; })}
        </aside>

        <main className="condition-intel-main">
          <div className="condition-intel-toolbar">
            <div><span>ACTIVE CLINICAL PROFILE</span><strong>{category.label}</strong></div>
            {category.conditions.length > 1 && <div className="condition-intel-tabs">{category.conditions.map((entry, index) => <button key={entry.name} className={index === conditionIndex ? 'active' : ''} onClick={() => setConditionIndex(index)}>{entry.name}</button>)}</div>}
          </div>

          <section className="condition-hero-card">
            <div><span>{category.subtitle}</span><h2>{condition.name}</h2><p>{condition.reviewerContext}</p></div>
            <div className="condition-domain-cloud">{condition.functionalDomains.map((domain) => <span key={domain}>{domain}</span>)}</div>
          </section>

          <div className="condition-intel-modules">
            <section className="condition-intel-module redflags"><div className="module-head"><span>01</span><div><strong>Clinical pressure points</strong><small>Reasons to look closer before applying any standard.</small></div></div>{condition.redFlags.map((flag) => <div className="condition-row" key={flag}><i />{flag}</div>)}</section>
            <section className="condition-intel-module questions"><div className="module-head"><span>02</span><div><strong>Questions worth resolving</strong><small>Facts that materially improve reviewer understanding.</small></div></div>{condition.questions.map((question, index) => <div className="condition-row numbered" key={question}><b>{String(index + 1).padStart(2, '0')}</b>{question}</div>)}</section>
            <section className="condition-intel-module documents"><div className="module-head"><span>03</span><div><strong>Useful evidence packet</strong><small>Documentation to request when relevant to the case.</small></div></div>{condition.documentation.map((item) => <div className="condition-row" key={item}><FileText size={12} />{item}</div>)}</section>
          </div>
        </main>

        <aside className="condition-intel-evidence">
          <section>
            <div className="condition-side-head"><span>LIVE PUBMED</span>{loadingArticles && <Loader2 size={12} className="animate-spin" />}</div>
            <p className="condition-side-note">Literature supports clinical context only; standards thresholds are deliberately not duplicated here.</p>
            {articles.length === 0 && !loadingArticles ? <p className="condition-side-empty">No citations returned.</p> : <div className="condition-article-list">{articles.map((article) => <a key={article.pmid} href={article.url} target="_blank" rel="noreferrer"><strong>{article.title}</strong><small>{article.journal}{article.year ? ` · ${article.year}` : ''}</small><ExternalLink size={10} /></a>)}</div>}
          </section>
          <section>
            <div className="condition-side-head"><span>SAVED CLINICAL GUIDANCE</span><small>{savedGuidelines.length}</small></div>
            {savedGuidelines.length === 0 ? <p className="condition-side-empty">No saved internal guidance for this clinical system.</p> : <div className="condition-saved-list">{savedGuidelines.slice(0, 6).map((item) => <div key={item.id}><strong>{item.sourceName || 'Untitled guidance'}</strong><small>{item.agency || 'Internal'}{item.versionDate ? ` · ${item.versionDate}` : ''}</small>{item.summary && <p>{item.summary}</p>}</div>)}</div>}
          </section>
          <section className="condition-boundary-card"><span>TOOL BOUNDARY</span><strong>Clinical condition ≠ governing standard</strong><p>This page explains the condition and what evidence is useful. Use Standards Intelligence to evaluate MOD 18, FMCSA, FAA, NFPA, or other controlling requirements.</p><Link href="/matrix">Open Standards Intelligence</Link></section>
        </aside>
      </div>
    </div>
  );
}
