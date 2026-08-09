import { useMemo, useState } from 'react';
import { BookOpen, Briefcase, ExternalLink, Flame, Plane, Search, Shield, Truck } from 'lucide-react';
import './standards-matrix.css';

const FRAMEWORKS = [
  {
    id: 'firefighter',
    label: 'Firefighter',
    standard: 'NFPA 1582',
    icon: Flame,
    source: 'NFPA',
    sourceUrl: 'https://www.nfpa.org/codes-and-standards/nfpa-1582-standard-development/1582',
    useFor: 'Fire-service medical review and duty-specific occupational demands.',
    topics: ['Sudden incapacitation', 'Extreme exertion', 'SCBA / respirator', 'Heat stress', 'Emergency response'],
  },
  {
    id: 'dot',
    label: 'Commercial Driver',
    standard: 'DOT / FMCSA',
    icon: Truck,
    source: 'FMCSA medical requirements',
    sourceUrl: 'https://www.fmcsa.dot.gov/medical/driver-medical-requirements/driver-medical-fitness-duty',
    useFor: 'Commercial motor-vehicle medical qualification and safety-sensitive driving.',
    topics: ['Loss of consciousness', 'Vision / hearing', 'Medication effects', 'Sleep / alertness', 'Cardiovascular'],
  },
  {
    id: 'aviation',
    label: 'Aviation',
    standard: 'FAA AME Guide',
    icon: Plane,
    source: 'FAA Guide for Aviation Medical Examiners',
    sourceUrl: 'https://www.faa.gov/ame_guide',
    useFor: 'Aviation medical review and condition-specific certification guidance.',
    topics: ['Incapacitation', 'Cognition', 'Medication acceptability', 'Neurologic stability', 'Vision / hearing'],
  },
  {
    id: 'law-enforcement',
    label: 'Law Enforcement',
    standard: 'Agency / POST',
    icon: Shield,
    source: 'Jurisdiction / agency specific',
    sourceUrl: '',
    useFor: 'Law-enforcement duties where medical criteria vary by jurisdiction and agency.',
    topics: ['Emergency driving', 'Use of force', 'Weapon handling', 'Stress tolerance', 'Physical confrontation'],
  },
  {
    id: 'deployment',
    label: 'Deployment',
    standard: 'Client / Contract / Theater',
    icon: Briefcase,
    source: 'Program specific',
    sourceUrl: '',
    useFor: 'Remote, international, austere, or contract-specific medical requirements.',
    topics: ['Medical access', 'Medication continuity', 'Evacuation', 'Climate', 'Specialty follow-up'],
  },
];

export default function StandardsMatrixV2() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return FRAMEWORKS;
    return FRAMEWORKS.filter((framework) => `${framework.label} ${framework.standard} ${framework.useFor} ${framework.topics.join(' ')}`.toLowerCase().includes(clean));
  }, [query]);

  return (
    <div className="standards-workbench" data-testid="standards-matrix">
      <header className="standards-header">
        <div>
          <div className="standards-kicker">REFERENCE / STANDARDS</div>
          <h1>Standards Matrix</h1>
          <p>Quick starting points for the occupational frameworks reviewers repeatedly need to locate. No scoring and no clearance output.</p>
        </div>
        <div className="standards-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Framework, topic, standard…" /></div>
      </header>

      <div className="standards-table-head"><span>FRAMEWORK</span><span>USE / SCOPE</span><span>KEY TOPICS</span><span>SOURCE</span></div>
      <div className="standards-list">
        {filtered.map((framework) => {
          const Icon = framework.icon;
          return (
            <article key={framework.id} className="standards-row">
              <div className="standards-framework"><span className="standards-icon"><Icon size={16} /></span><div><strong>{framework.label}</strong><small>{framework.standard}</small></div></div>
              <p>{framework.useFor}</p>
              <div className="standards-topics">{framework.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
              <div className="standards-source">
                {framework.sourceUrl ? <a href={framework.sourceUrl} target="_blank" rel="noreferrer"><BookOpen size={13} /><span>{framework.source}</span><ExternalLink size={10} /></a> : <span>{framework.source}</span>}
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && <div className="standards-empty">No framework matches that search.</div>}
      </div>
      <div className="standards-footnote">Use these as source starting points. Verify the current controlling version and any client-, agency-, or jurisdiction-specific requirement before applying criteria.</div>
    </div>
  );
}
