import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bone,
  Brain,
  ExternalLink,
  Heart,
  Loader2,
  Pill,
  Search,
  Shield,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { fetchPubMedArticles } from '@/lib/directSourceIntelligence';
import './condition-reference.css';

type Condition = {
  name: string;
  limitations: string[];
  reviewerContext: string;
  trigger: string;
  evidenceLabel: string;
  questions: string[];
};

type Category = {
  label: string;
  subtitle: string;
  icon: typeof Heart;
  standards: string[];
  conditions: Condition[];
};

const CATEGORIES: Record<string, Category> = {
  cardiovascular: {
    label: 'Cardiovascular',
    subtitle: 'Cardiac review reference',
    icon: Heart,
    standards: ['NFPA 1582', 'DOT / FMCSA cardiovascular standard', 'FAA medical guidance', 'Program-specific requirements'],
    conditions: [
      {
        name: 'Coronary Artery Disease',
        limitations: ['Exercise tolerance', 'Angina with exertion', 'Sudden-event history', 'Medication effects'],
        reviewerContext: 'Review current functional capacity, event/intervention history, symptoms, medication profile, and any job-specific cardiovascular standard that applies.',
        trigger: 'Recent major cardiac event, unstable symptoms, or insufficient current functional assessment',
        evidenceLabel: 'High — multiple occupational standards address cardiovascular fitness',
        questions: ['Date and type of most recent cardiac event or intervention?', 'Current symptoms with exertion?', 'Most recent stress/exercise testing and achieved workload?', 'Any restrictions from the treating cardiologist?'],
      },
      {
        name: 'Hypertension',
        limitations: ['Blood-pressure control', 'Orthostatic symptoms', 'Medication tolerance', 'End-organ complications'],
        reviewerContext: 'The useful review question is usually control and stability: confirm the BP pattern, treatment status, symptoms, and whether a role-specific standard sets a threshold.',
        trigger: 'Markedly elevated or persistently uncontrolled readings, symptoms, or unclear treatment response',
        evidenceLabel: 'High — commonly addressed in occupational medical standards',
        questions: ['What is the current BP trend rather than a single reading?', 'Any recent medication change?', 'Any dizziness, syncope, chest pain, or end-organ complications?', 'Does the applicable program specify repeat readings or a control threshold?'],
      },
    ],
  },
  respiratory: {
    label: 'Respiratory',
    subtitle: 'Pulmonary review reference',
    icon: Activity,
    standards: ['NFPA 1582', 'OSHA respiratory protection', 'DOT / FMCSA respiratory standard', 'Program-specific respirator requirements'],
    conditions: [
      {
        name: 'Asthma / Reactive Airway Disease',
        limitations: ['Exertional symptoms', 'Bronchospasm', 'Irritant exposure', 'Respirator / SCBA tolerance'],
        reviewerContext: 'Focus on current control, exacerbation history, rescue-medication use, objective pulmonary testing when relevant, and whether the job requires respirator or SCBA use.',
        trigger: 'Recent exacerbation, frequent rescue use, abnormal objective testing, or unclear respirator tolerance',
        evidenceLabel: 'High when respirator, firefighter, or deployment standards apply',
        questions: ['Recent exacerbations, urgent care, ED visits, or hospitalization?', 'Current rescue-inhaler frequency?', 'Most recent spirometry if required?', 'Any demonstrated difficulty using required respiratory PPE?'],
      },
      {
        name: 'COPD',
        limitations: ['Aerobic reserve', 'Exertional dyspnea', 'Hypoxemia', 'Exacerbation risk'],
        reviewerContext: 'The occupational question is functional reserve and stability. Review symptoms, exacerbations, oxygen use, spirometry, and the actual exertional demands of the position.',
        trigger: 'Recent exacerbation, supplemental oxygen, substantial functional limitation, or outdated pulmonary testing',
        evidenceLabel: 'Moderate to high depending on job and standard',
        questions: ['Most recent spirometry and clinical stage?', 'Any oxygen requirement?', 'Exacerbations in the past year?', 'What level of exertion can be performed without limiting symptoms?'],
      },
    ],
  },
  neurologic: {
    label: 'Neurologic',
    subtitle: 'Neurologic review reference',
    icon: Brain,
    standards: ['DOT / FMCSA neurologic standard', 'FAA neurologic guidance', 'NFPA 1582', 'Program-specific safety-sensitive requirements'],
    conditions: [
      {
        name: 'Seizure Disorder',
        limitations: ['Loss-of-consciousness history', 'Recurrence risk', 'Medication effects', 'Safety-sensitive exposure'],
        reviewerContext: 'The key facts are event history, stability, treatment, medication tolerance, and the exact safety-sensitive standard governing the position.',
        trigger: 'Recent or poorly documented event, medication instability, unexplained loss of consciousness, or missing specialty follow-up',
        evidenceLabel: 'High — multiple transportation and public-safety standards address seizure history',
        questions: ['Exact date and circumstances of the last seizure or loss-of-consciousness event?', 'Current antiseizure medication and stability?', 'Any breakthrough events or medication side effects?', 'Most recent neurology assessment and applicable required event-free interval?'],
      },
      {
        name: 'TBI / Concussion History',
        limitations: ['Processing speed', 'Memory', 'Balance', 'Headache / sensory symptoms'],
        reviewerContext: 'Separate remote resolved history from persistent symptoms. Current cognition, balance, symptoms, recurrence exposure, and role demands determine what additional information is useful.',
        trigger: 'Persistent symptoms, recent moderate/severe injury, recurrent concussion, or uncertain cognitive/neurologic recovery',
        evidenceLabel: 'Context dependent — use current neurologic and occupational guidance',
        questions: ['Date and severity of the most recent injury?', 'Any current headache, dizziness, memory, concentration, or balance symptoms?', 'Any formal neuropsychological or neurologic follow-up?', 'Any current activity or work restrictions?'],
      },
    ],
  },
  endocrine: {
    label: 'Endocrine / Metabolic',
    subtitle: 'Metabolic review reference',
    icon: Pill,
    standards: ['DOT / FMCSA diabetes standard', 'NFPA 1582', 'FAA diabetes guidance', 'Deployment medication-access requirements'],
    conditions: [
      {
        name: 'Diabetes Requiring Insulin',
        limitations: ['Hypoglycemia history', 'Glucose control', 'Monitoring capability', 'Medication access / storage'],
        reviewerContext: 'Review control, severe hypoglycemia, monitoring, complications, treatment stability, and whether the work environment creates medication-access or storage constraints.',
        trigger: 'Severe hypoglycemia, unstable treatment, poor control, significant complications, or uncertain medication continuity',
        evidenceLabel: 'High — commonly addressed in transportation, aviation, fire, and deployment standards',
        questions: ['Current A1c and trend?', 'Any severe hypoglycemia requiring assistance?', 'Monitoring method and reliability?', 'Any neuropathy, retinopathy, nephropathy, or other complications relevant to duties?'],
      },
    ],
  },
  orthopedic: {
    label: 'Orthopedic',
    subtitle: 'Musculoskeletal review reference',
    icon: Bone,
    standards: ['Job-specific essential functions', 'Functional capacity evidence when needed', 'NFPA 1582 where applicable', 'Program-specific physical requirements'],
    conditions: [
      {
        name: 'Lumbar Spine Disorder',
        limitations: ['Lifting', 'Bending / twisting', 'Prolonged posture', 'Radicular symptoms'],
        reviewerContext: 'Match current functional status and restrictions to actual job demands. Diagnosis alone usually answers less than current strength, neurologic findings, restrictions, and demonstrated capacity.',
        trigger: 'Recent surgery, active radiculopathy, neurologic deficit, significant pain-limited function, or unclear restrictions',
        evidenceLabel: 'Job-specific — functional evidence is usually more useful than diagnosis alone',
        questions: ['Current lifting or positional restrictions?', 'Active radicular symptoms, weakness, or sensory deficit?', 'Recent surgery or procedure and recovery status?', 'Any current functional-capacity or treating-provider restrictions?'],
      },
      {
        name: 'Shoulder Disorder / Repair',
        limitations: ['Overhead work', 'Lifting / carrying', 'Pushing / pulling', 'Range of motion / strength'],
        reviewerContext: 'For physically demanding positions, current range of motion, strength, instability, pain, and restrictions are usually more actionable than the historical procedure name.',
        trigger: 'Recent repair, recurrent instability, persistent weakness, restricted ROM, or unresolved work restrictions',
        evidenceLabel: 'Job-specific — compare current function with required upper-extremity demands',
        questions: ['Current ROM and strength?', 'Any recurrent instability or pain with overhead work?', 'Current lifting, pushing, pulling, or overhead restrictions?', 'Completed rehabilitation and released from orthopedic care?'],
      },
    ],
  },
  psychiatric: {
    label: 'Behavioral Health',
    subtitle: 'Behavioral-health review reference',
    icon: Shield,
    standards: ['Role-specific behavioral-health requirements', 'FAA psychiatric guidance', 'DOT / FMCSA mental-health standard', 'Deployment / program requirements'],
    conditions: [
      {
        name: 'PTSD / Trauma-Related Disorder',
        limitations: ['Current symptom burden', 'Concentration / sleep', 'Medication effects', 'Functional stability'],
        reviewerContext: 'Review current function and stability rather than diagnosis alone: symptom control, treatment, medication effects, hospitalizations, restrictions, and the stress profile of the job are more useful.',
        trigger: 'Recent hospitalization, severe active symptoms, impaired function, medication intolerance, or unclear treating-provider assessment',
        evidenceLabel: 'Context dependent — standards vary substantially by occupation and program',
        questions: ['Current symptom severity and functional impact?', 'Any hospitalization, crisis care, or major treatment change in the past year?', 'Medication side effects affecting alertness or cognition?', 'Any treating-provider restrictions relevant to the role?'],
      },
    ],
  },
};

type Article = { pmid: string; title: string; journal: string; year: string; url: string };

export default function ConditionReference() {
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
    return Object.entries(CATEGORIES).filter(([, item]) =>
      item.label.toLowerCase().includes(clean)
      || item.conditions.some((conditionItem) => conditionItem.name.toLowerCase().includes(clean)),
    );
  }, [query]);

  const savedGuidelines = useMemo(() => guidelines.filter((item) => item.conditionCategory === categoryId || item.conditionCategory === 'other'), [guidelines, categoryId]);

  useEffect(() => {
    let cancelled = false;
    setLoadingArticles(true);
    setArticles([]);
    fetchPubMedArticles(`${condition.name} occupational medicine fitness for duty`, 4)
      .then((items) => { if (!cancelled) setArticles(items); })
      .finally(() => { if (!cancelled) setLoadingArticles(false); });
    return () => { cancelled = true; };
  }, [condition.name]);

  return (
    <div className="condition-reference" data-testid="condition-reference">
      <header className="condition-header">
        <div>
          <div className="condition-kicker">CLINICAL / CONDITION REFERENCE</div>
          <h1>Condition Reference</h1>
          <p>Fast reviewer context, questions worth resolving, saved internal guidance, and live literature lookup. No report language and no clearance determination.</p>
        </div>
        <div className="condition-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search condition or category…" /></div>
      </header>

      <div className="condition-layout">
        <aside className="condition-category-list">
          <div className="condition-list-label">CATEGORIES</div>
          {matchingCategories.map(([id, item]) => {
            const Icon = item.icon;
            const active = id === categoryId;
            return <button key={id} className={active ? 'active' : ''} onClick={() => { setCategoryId(id); setConditionIndex(0); }}><Icon size={15} /><span><strong>{item.label}</strong><small>{item.conditions.length} reference {item.conditions.length === 1 ? 'topic' : 'topics'}</small></span></button>;
          })}
        </aside>

        <main className="condition-main">
          {category.conditions.length > 1 && <div className="condition-tabs">{category.conditions.map((item, index) => <button key={item.name} className={index === conditionIndex ? 'active' : ''} onClick={() => setConditionIndex(index)}>{item.name}</button>)}</div>}

          <section className="condition-summary">
            <div className="condition-title-row"><div><span>{category.subtitle}</span><h2>{condition.name}</h2></div><div className="condition-evidence">{condition.evidenceLabel}</div></div>
            <div className="condition-limits">{condition.limitations.map((item) => <span key={item}>{item}</span>)}</div>
            <div className="condition-context"><span>REVIEWER CONTEXT</span><p>{condition.reviewerContext}</p></div>
            <div className="condition-trigger"><span>WHEN TO LOOK CLOSER</span><p>{condition.trigger}</p></div>
          </section>

          <section className="condition-questions">
            <div className="condition-section-head"><span>QUESTIONS WORTH RESOLVING</span><small>Use only the ones relevant to the actual case.</small></div>
            <div>{condition.questions.map((question, index) => <div key={question}><span>{String(index + 1).padStart(2, '0')}</span><p>{question}</p></div>)}</div>
          </section>
        </main>

        <aside className="condition-evidence-column">
          <section>
            <div className="condition-side-label">REFERENCE LENSES</div>
            <div className="condition-standard-list">{category.standards.map((standard) => <div key={standard}>{standard}</div>)}</div>
            <p className="condition-side-note">Reference labels only. Confirm the current controlling standard before applying a threshold.</p>
          </section>

          <section>
            <div className="condition-side-head"><span>LIVE PUBMED</span>{loadingArticles && <Loader2 size={12} className="animate-spin" />}</div>
            {articles.length === 0 && !loadingArticles ? <p className="condition-side-empty">No citations returned for this query.</p> : <div className="condition-article-list">{articles.map((article) => <a key={article.pmid} href={article.url} target="_blank" rel="noreferrer"><strong>{article.title}</strong><small>{article.journal}{article.year ? ` · ${article.year}` : ''}</small><ExternalLink size={10} /></a>)}</div>}
          </section>

          <section>
            <div className="condition-side-head"><span>SAVED INTERNAL GUIDANCE</span><small>{savedGuidelines.length}</small></div>
            {savedGuidelines.length === 0 ? <p className="condition-side-empty">No saved guidance for this category.</p> : <div className="condition-saved-list">{savedGuidelines.slice(0, 6).map((item) => <div key={item.id}><strong>{item.sourceName || 'Untitled guidance'}</strong><small>{item.agency || 'Internal'}{item.versionDate ? ` · ${item.versionDate}` : ''}</small>{item.summary && <p>{item.summary}</p>}</div>)}</div>}
          </section>
        </aside>
      </div>
    </div>
  );
}
