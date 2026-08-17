import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Atom, Database, Loader2, Orbit, ShieldAlert } from 'lucide-react';
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
  SMILES?: string;
  ConnectivitySMILES?: string;
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

type BubblePosition = { x: number; y: number };

const SMILES_DRAWER_URL = 'https://esm.sh/smiles-drawer@2.4.1';
const PUBCHEM_PROPERTIES = [
  'MolecularFormula',
  'MolecularWeight',
  'SMILES',
  'ConnectivitySMILES',
  'XLogP',
  'TPSA',
  'Complexity',
  'HBondDonorCount',
  'HBondAcceptorCount',
  'IUPACName',
  'Title',
].join(',');

async function remoteImport(url: string): Promise<any> {
  return import(/* @vite-ignore */ url);
}

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
    factors.push({
      id: 'class',
      label: 'Medication class',
      value: profile.className,
      detail: 'Curated therapeutic class used by the occupational review profile.',
      tone: 'violet',
    });

    profile.flags.slice(0, 3).forEach((flag, index) => {
      factors.push({
        id: `flag-${index}`,
        label: index === 0 ? 'Primary work factor' : 'Work factor',
        value: flag,
        detail: profile.reviewerPoints[index] ?? profile.reviewerPoints[0] ?? 'Reviewer-relevant occupational consideration.',
        tone: riskTone(flag),
      });
    });

    profile.reviewerPoints.slice(0, 2).forEach((point, index) => {
      factors.push({
        id: `review-${index}`,
        label: index === 0 ? 'Reviewer focus' : 'Functional context',
        value: point.length > 74 ? `${point.slice(0, 71)}…` : point,
        detail: point,
        tone: 'cyan',
      });
    });
  }

  if (molecule?.MolecularFormula) {
    factors.push({
      id: 'formula',
      label: 'Formula',
      value: molecule.MolecularFormula,
      detail: 'PubChem molecular formula for the resolved compound.',
      tone: 'cyan',
    });
  }

  if (molecule?.MolecularWeight !== undefined) {
    factors.push({
      id: 'weight',
      label: 'Molecular weight',
      value: `${molecule.MolecularWeight} g/mol`,
      detail: 'PubChem molecular weight for the resolved compound.',
      tone: 'cyan',
    });
  }

  if (molecule?.XLogP !== undefined) {
    factors.push({
      id: 'xlogp',
      label: 'XLogP',
      value: String(molecule.XLogP),
      detail: 'Computed octanol/water partition coefficient reported by PubChem.',
      tone: 'violet',
    });
  }

  if (molecule?.TPSA !== undefined) {
    factors.push({
      id: 'tpsa',
      label: 'Polar surface area',
      value: `${molecule.TPSA} Å²`,
      detail: 'Topological polar surface area reported by PubChem.',
      tone: 'violet',
    });
  }

  return factors.slice(0, 9);
}

const BUBBLE_POSITIONS: BubblePosition[] = [
  { x: 49, y: 5 },
  { x: 79, y: 17 },
  { x: 91, y: 43 },
  { x: 82, y: 72 },
  { x: 58, y: 90 },
  { x: 27, y: 86 },
  { x: 8, y: 66 },
  { x: 7, y: 35 },
  { x: 23, y: 13 },
];

function tetherPath(position: BubblePosition, index: number): string {
  const centerX = 50;
  const centerY = 50;
  const midX = (centerX + position.x) / 2;
  const midY = (centerY + position.y) / 2;
  const horizontalBend = position.x < centerX ? -4.5 : 4.5;
  const verticalBend = position.y < centerY ? -2.5 : 2.5;
  const alternating = index % 2 === 0 ? 1 : -1;
  return `M ${centerX} ${centerY} Q ${midX + horizontalBend * alternating} ${midY + verticalBend} ${position.x} ${position.y}`;
}

export default function MedicationMoleculePanel({ drugName, rxcui, profile }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tracerSvgRef = useRef<SVGSVGElement | null>(null);
  const [molecule, setMolecule] = useState<MolecularRecord | null>(null);
  const [moleculeState, setMoleculeState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [structureReady, setStructureReady] = useState(false);
  const [activeFactorId, setActiveFactorId] = useState('');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setMoleculeState('loading');
      setMolecule(null);
      setStructureReady(false);
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
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [drugName]);

  const smiles = molecule?.SMILES ?? molecule?.ConnectivitySMILES ?? null;

  useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      const target = svgRef.current;
      if (!target || !smiles) {
        if (tracerSvgRef.current) tracerSvgRef.current.innerHTML = '';
        setStructureReady(false);
        return;
      }
      try {
        const mod = await remoteImport(SMILES_DRAWER_URL);
        if (cancelled || !svgRef.current) return;
        const SmilesDrawer = mod.default ?? mod;
        const drawer = new SmilesDrawer.SvgDrawer({
          width: 360,
          height: 360,
          padding: 34,
          bondThickness: 1.7,
          bondLength: 26,
          shortBondLength: 0.82,
          terminalCarbons: false,
          explicitHydrogens: false,
          compactDrawing: false,
          experimentalSSSR: true,
        });
        SmilesDrawer.parse(
          smiles,
          (tree: unknown) => {
            if (cancelled || !svgRef.current) return;
            svgRef.current.innerHTML = '';
            drawer.draw(tree, svgRef.current, 'dark');
            if (tracerSvgRef.current) tracerSvgRef.current.innerHTML = svgRef.current.innerHTML;
            setStructureReady(true);
          },
          () => {
            if (!cancelled) setStructureReady(false);
          },
        );
      } catch (error) {
        console.warn('Molecule renderer unavailable', error);
        if (!cancelled) setStructureReady(false);
      }
    };
    void draw();
    return () => {
      cancelled = true;
    };
  }, [smiles]);

  const factors = useMemo(() => buildFactors(profile, molecule), [profile, molecule]);

  useEffect(() => {
    if (!factors.length) setActiveFactorId('');
    else if (!factors.some((factor) => factor.id === activeFactorId)) setActiveFactorId(factors[0].id);
  }, [factors, activeFactorId]);

  const activeFactor = factors.find((factor) => factor.id === activeFactorId) ?? factors[0] ?? null;

  const handleStagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
    const y = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
    event.currentTarget.style.setProperty('--med-pointer-x', `${50 + x * 18}%`);
    event.currentTarget.style.setProperty('--med-pointer-y', `${50 + y * 14}%`);
    event.currentTarget.style.setProperty('--med-depth-x', `${(x * 9).toFixed(2)}px`);
    event.currentTarget.style.setProperty('--med-depth-y', `${(y * 6).toFixed(2)}px`);
    event.currentTarget.style.setProperty('--med-tilt-x', `${(-y * 4.5).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--med-tilt-y', `${(x * 6).toFixed(2)}deg`);
  };

  const handleStagePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--med-pointer-x', '50%');
    event.currentTarget.style.setProperty('--med-pointer-y', '50%');
    event.currentTarget.style.setProperty('--med-depth-x', '0px');
    event.currentTarget.style.setProperty('--med-depth-y', '0px');
    event.currentTarget.style.setProperty('--med-tilt-x', '0deg');
    event.currentTarget.style.setProperty('--med-tilt-y', '0deg');
  };

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
        <div className="med-molecule-stage" onPointerMove={handleStagePointerMove} onPointerLeave={handleStagePointerLeave}>
          <div className="med-molecule-grid" />
          <div className="med-molecule-depth-beams"><i /><i /><i /><i /></div>
          <div className="med-molecule-orbit orbit-one" />
          <div className="med-molecule-orbit orbit-two" />
          <div className="med-molecule-orbit orbit-three" />
          <div className="med-molecule-projector" />
          <div className="med-molecule-scan" />
          <div className="med-molecule-scan-secondary" />

          <svg className="med-energy-tether-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {factors.map((factor, index) => {
              const position = BUBBLE_POSITIONS[index % BUBBLE_POSITIONS.length];
              const active = factor.id === activeFactorId;
              const path = tetherPath(position, index);
              return (
                <g key={`tether-${factor.id}`} className={active ? 'is-active' : ''}>
                  <path className="med-tether-dormant" d={path} />
                  {active && <>
                    <path className="med-tether-core" d={path} />
                    <path className="med-tether-runner" d={path} />
                    <circle className="med-tether-node" cx={position.x} cy={position.y} r="0.8" />
                  </>}
                </g>
              );
            })}
          </svg>

          <div className="med-molecule-center">
            <div className="med-molecule-aura" />
            <div className="med-molecule-core-ring core-ring-a" />
            <div className="med-molecule-core-ring core-ring-b" />
            <div className="med-molecule-core-ring core-ring-c" />
            <svg ref={svgRef} className={`med-molecule-svg${structureReady ? ' ready' : ''}`} viewBox="0 0 360 360" aria-label={`${drugName} molecular structure`} />
            <svg ref={tracerSvgRef} className={`med-molecule-energy-tracer${structureReady ? ' ready' : ''}`} viewBox="0 0 360 360" aria-hidden="true" />
            {!structureReady && (
              <div className="med-molecule-placeholder">
                <Orbit size={42} />
                <strong>{moleculeState === 'loading' ? 'Resolving molecular structure' : 'Structure unavailable'}</strong>
                <span>{moleculeState === 'missing' ? 'Occupational factors remain available.' : 'PubChem + SMILES visualization'}</span>
              </div>
            )}
          </div>

          <div className="med-factor-orbit">
            {factors.map((factor, index) => {
              const position = BUBBLE_POSITIONS[index % BUBBLE_POSITIONS.length];
              return (
                <button
                  key={factor.id}
                  type="button"
                  className={`med-factor-bubble tone-${factor.tone}${activeFactorId === factor.id ? ' active' : ''}`}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  onMouseEnter={() => setActiveFactorId(factor.id)}
                  onFocus={() => setActiveFactorId(factor.id)}
                  onClick={() => setActiveFactorId(factor.id)}
                >
                  <small>{factor.label}</small>
                  <strong>{factor.value}</strong>
                </button>
              );
            })}
          </div>
        </div>

        <aside className={`med-factor-inspector${activeFactor ? ` tone-${activeFactor.tone}` : ''}`}>
          <span>ACTIVE FACTOR</span>
          {activeFactor ? (
            <>
              <h3>{activeFactor.label}</h3>
              <strong>{activeFactor.value}</strong>
              <p>{activeFactor.detail}</p>
            </>
          ) : (
            <>
              <h3>No factor selected</h3>
              <p>Molecular and occupational factors will populate as data becomes available.</p>
            </>
          )}
          <div className="med-factor-inspector-meta">
            <div><span>STRUCTURE</span><b>{structureReady ? 'LIVE' : '—'}</b></div>
            <div><span>OCC PROFILE</span><b>{profile ? 'CURATED' : 'NONE'}</b></div>
            <div><span>MOLECULE</span><b>{molecule?.CID ? `CID ${molecule.CID}` : '—'}</b></div>
          </div>
        </aside>
      </div>
    </section>
  );
}