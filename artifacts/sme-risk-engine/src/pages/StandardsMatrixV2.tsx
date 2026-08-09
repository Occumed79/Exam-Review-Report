import { useMemo, useState } from 'react';
import { BookOpen, Briefcase, ExternalLink, Flame, Plane, Search, Shield, Truck } from 'lucide-react';
import './standards-matrix.css';

const FRAMEWORKS = [
  {
    id: 'firefighter',
    label: 'Firefighter / Emergency Responder',
    standard: 'NFPA 1580 (2025)',
    icon: Flame,
    source: 'NFPA 1580 — occupational medical chapters',
    sourceUrl: 'https://link.nfpa.org/all-publications/1580/2025',
    useFor: 'Current NFPA emergency-responder health and wellness framework; occupational-medical chapters consolidate content formerly published in NFPA 1582.',
    topics: ['Essential job tasks', 'Occupational medical evaluation', 'Annual fitness evaluation', 'SCBA / respirator', 'Heat / emergency response'],
  },
  {
    id: 'dot',
    label: 'Commercial Driver',
    standard: 'FMCSA Medical Examiner’s Handbook — 2024',
    icon: Truck,
    source: 'FMCSA current handbook',
    sourceUrl: 'https://www.fmcsa.dot.gov/regulations/medical/driver-medical-requirements/medical-examiners-handbook-2024-edition',
    useFor: 'Current FMCSA guidance used with the physical qualification standards and Medical Advisory Criteria for interstate commercial drivers.',
    topics: ['Loss of consciousness', 'Vision / hearing', 'Medication effects', 'Sleep / alertness', 'Cardiovascular'],
  },
  {
    id: 'aviation',
    label: 'Aviation',
    standard: 'FAA AME Guide — current revision',
    icon: Plane,
    source: 'FAA Guide for Aviation Medical Examiners',
    sourceUrl: 'https://www.faa.gov/ame_guide',
    useFor: 'FAA’s continuously updated condition-specific aviation medical certification guidance.',
    topics: ['Incapacitation', 'Cognition', 'Medication acceptability', 'Neurologic stability', 'Vision / hearing'],
  },
  {
    id: 'law-enforcement',
    label: 'Law Enforcement',
    standard: 'Agency / POST / jurisdiction',
    icon: Shield,
    source: 'Jurisdiction / agency specific',
    sourceUrl: '',
    useFor: 'Law-enforcement duties where controlling medical criteria vary by jurisdiction, POST body, employer, and job classification.',
    topics: ['Emergency driving', 'Use of force', 'Weapon handling', 'Stress tolerance', 'Physical confrontation'],
  },
  {
    id: 'deployment',
    label: 'Deployment',
    standard: 'Client / Contract / Theater',
    icon: Briefcase,
    source: 'Program specific',
    sourceUrl: '',
    useFor: 'Remote, international, austere, or contract-specific medical requirements where the actual program document controls.',
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
          <p>Current source starting points for occupational frameworks reviewers repeatedly need to locate. No scoring and no clearance output.</p>
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
      <div className="standards-footnote">Verify the current controlling version and any client-, agency-, employer-, contract-, or jurisdiction-specific requirement before applying criteria. Source pages can change independently of this app.</div>
    </div>
  );
}
