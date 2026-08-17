import { useCallback, useEffect, useMemo, useState } from 'react';
import { Atom, Database, Loader2, ShieldAlert } from 'lucide-react';
import MedicationHologram3D from './MedicationHologram3D';
import './medication-molecule-panel.css';

type OccupationalProfile = {
  className: string;
  flags: string[];
  reviewerPoints: string[];
} | null;

type MolecularRecord = {
  CID?: number;
  MolecularFormula?: string;
  MolecularWeight?: string | number;
  XLogP?: number;
  TPSA?: number;
  Complexity?: number;
  HBondDonorCount?: number;
  HBondAcceptorCount?: number;
  IUPACName?: string;
  Title?: string;
};

type Factor = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: 'cyan' | 'amber' | 'red' | 'violet';
};

type Props = {
  drugName: string;
  rxcui: string;
  profile: OccupationalProfile;
};

const PUBCHEM_PROPERTIES = [
  'MolecularFormula', 'MolecularWeight', 'XLogP', 'TPSA', 'Complexity',
  'HBondDonorCount', 'HBondAcceptorCount', 'IUPACName', 'Title',
].join(',');

function cleanDrugName(name: string): string {
  return name
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?)\b/gi, '')
    .replace(/\b(tablet|capsule|solution|suspension|injection|oral|extended release|delayed release|film coated)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function riskTone(text: string): Factor['tone'] {
  const value = text.toLowerCase();
  if (/bleed|hypogly|neuropsychi|qt|infection|monitoring|storage/.test(value)) return 'red';
  if (/sedat|dizz|fatigue|heat|hydration|electrolyte|hypotension|alertness|sleep|coordination/.test(value)) return 'amber';
  return 'cyan';
}

function buildFactors(profile: OccupationalProfile, molecule: MolecularRecord | null): Factor[] {
  const factors: Factor[] = [];
  if (profile) {
    factors.push({ id: 'class', label: 'Medication class', value: profile.className, detail: 'Curated therapeutic class used by the occupational review profile.', tone: 'violet' });
    profile.flags.slice(0, 3).forEach((flag, index) => factors.push({
      id: `flag-${index}`,
      label: index === 0 ? 'Primary work factor' : 'Work factor',
      value: flag,
      detail: profile.reviewerPoints[index] ?? profile.reviewerPoints[0] ?? 'Reviewer-relevant occupational consideration.',
      tone: riskTone(flag),
    }));
    profile.reviewerPoints.slice(0, 2).forEach((point, index) => factors.push({
      id: `review-${index}`,
      label: index === 0 ? 'Reviewer focus' : 'Functional context',
      value: point.length > 74 ? `${point.slice(0, 71)}…` : point,
      detail: point,
      tone: 'cyan',
    }));
  }
  if (molecule?.MolecularFormula) factors.push({ id: 'formula', label: 'Formula', value: molecule.MolecularFormula, detail: 'PubChem molecular formula for the resolved compound.', tone: 'cyan' });
  if (molecule?.MolecularWeight !== undefined) factors.push({ id: 'weight', label: 'Molecular weight', value: `${molecule.MolecularWeight} g/mol`, detail: 'PubChem molecular weight for the resolved compound.', tone: 'cyan' });
  if (molecule?.XLogP !== undefined) factors.push({ id: 'xlogp', label: 'XLogP', value: String(molecule.XLogP), detail: 'Computed octanol/water partition coefficient reported by PubChem.', tone: 'violet' });
  if (molecule?.TPSA !== undefined) factors.push({ id: 'tpsa', label: 'Polar surface area', value: `${molecule.TPSA} Å²`, detail: 'Topological polar surface area reported by PubChem.', tone: 'violet' });
  return factors.slice(0, 9);
}

const BUBBLE_POSITIONS = [
  { left: '49%', top: '5%' }, { left: '79%', top: '17%' }, { left: '91%', top: '43%' },
  { left: '82%', top: '72%' }, { left: '58%', top: '90%' }, { left: '27%', top: '86%' },
  { left: '8%', top: '66%' }, { left: '7%', top: '35%' }, { left: '23%', top: '13%' },
];

export default function MedicationMoleculePanel({ drugName, rxcui, profile }: Props) {
  const [molecule, setMolecule] = useState<MolecularRecord | null>(null);
  const [moleculeState, setMoleculeState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [structureState, setStructureState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [activeFactorId, setActiveFactorId] = useState('');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      setMoleculeState('loading');
      setMolecule(null);
      try {
        const lookupName = cleanDrugName(drugName);
        const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(lookupName)}/property/${PUBCHEM_PROPERTIES}/JSON`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`PubChem ${response.status}`);
        const payload = await response.json();
        const property = payload?.PropertyTable?.Properties?.[0] as MolecularRecord | undefined;
        if (!property) throw new Error('No PubChem compound resolved');
        if (!cancelled) {
          setMolecule(property);
          setMoleculeState('ready');
        }
      } catch (error) {
        if (!cancelled && !controller.signal.aborted) {
          console.warn('Molecular lookup unavailable', error);
          setMoleculeState('missing');
        }
      }
    };
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [drugName]);

  const factors = useMemo(() => buildFactors(profile, molecule), [profile, molecule]);
  useEffect(() => {
    if (!factors.length) setActiveFactorId('');
    else if (!factors.some((factor) => factor.id === activeFactorId)) setActiveFactorId(factors[0].id);
  }, [factors, activeFactorId]);

  const activeFactor = factors.find((factor) => factor.id === activeFactorId) ?? factors[0] ?? null;
  const handleHologramStatus = useCallback((status: 'loading' | 'ready' | 'error') => setStructureState(status), []);

  return (
    <section className="med-molecule-shell" data-testid="medication-molecule-panel">
      <div className="med-molecule-heading">
        <div>
          <span><Atom size={14} /> MOLECULAR / OCCUPATIONAL INTELLIGENCE</span>
          <h2>{drugName}</h2>
          <p>{molecule?.IUPACName || molecule?.Title || profile?.className || 'Resolved medication identity'}</p>
        </div>
        <div className="med-molecule-source">
          {moleculeState === 'loading' ? <Loader2 size={15} className="animate-spin" /> : moleculeState === 'ready' ? <Database size={15} /> : <ShieldAlert size={15} />}
          <div><strong>{moleculeState === 'ready' ? 'PubChem linked' : moleculeState === 'loading' ? 'Resolving molecule' : 'Occupational profile only'}</strong><small>RxCUI {rxcui}</small></div>
        </div>
      </div>

      <div className="med-molecule-workspace">
        <div className="med-molecule-stage asset-hologram-stage">
          <div className="med-molecule-grid" />
          <div className="med-molecule-orbit orbit-one" />
          <div className="med-molecule-orbit orbit-two" />
          <div className="med-molecule-orbit orbit-three" />
          <div className="med-molecule-projector" />
          <div className="med-molecule-scan" />

          <div className="med-molecule-center asset-hologram-center">
            <div className="med-molecule-aura" />
            <MedicationHologram3D cid={molecule?.CID} drugName={cleanDrugName(drugName)} onStatus={handleHologramStatus} />
            {structureState !== 'ready' && (
              <div className="med-molecule-placeholder asset-hologram-placeholder">
                {structureState === 'loading' ? <Loader2 size={32} className="animate-spin" /> : <ShieldAlert size={30} />}
                <strong>{structureState === 'loading' ? 'Loading 3D holographic conformer' : '3D conformer unavailable'}</strong>
                <span>PubChem geometry · Anderson Mancini holographic shader</span>
              </div>
            )}
          </div>

          <div className="med-factor-orbit">
            {factors.map((factor, index) => (
              <button
                key={factor.id}
                type="button"
                className={`med-factor-bubble tone-${factor.tone}${activeFactorId === factor.id ? ' active' : ''}`}
                style={BUBBLE_POSITIONS[index]}
                onMouseEnter={() => setActiveFactorId(factor.id)}
                onFocus={() => setActiveFactorId(factor.id)}
                onClick={() => setActiveFactorId(factor.id)}
              >
                <small>{factor.label}</small>
                <strong>{factor.value}</strong>
              </button>
            ))}
          </div>
        </div>

        <aside className={`med-factor-inspector${activeFactor ? ` tone-${activeFactor.tone}` : ''}`}>
          <span>ACTIVE FACTOR</span>
          {activeFactor ? <><h3>{activeFactor.label}</h3><strong>{activeFactor.value}</strong><p>{activeFactor.detail}</p></> : <><h3>No factor selected</h3><p>Molecular and occupational factors will populate as data becomes available.</p></>}
          <div className="med-factor-inspector-meta">
            <div><span>STRUCTURE</span><b>{structureState === 'ready' ? '3D LIVE' : '—'}</b></div>
            <div><span>OCC PROFILE</span><b>{profile ? 'CURATED' : 'NONE'}</b></div>
            <div><span>MOLECULE</span><b>{molecule?.CID ? `CID ${molecule.CID}` : '—'}</b></div>
          </div>
        </aside>
      </div>
    </section>
  );
}
